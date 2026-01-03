import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to get cart with items AND outlet details
const getCartWithItems = async (userId) => {
  return await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      items: {
        include: {
          menuItem: {
            include: {
              outlet: {
                select: {
                  id: true,
                  name: true,
                  campus: true,
                  image: true,
                  location: true,
                  contactPhone: true,
                  prepTime: true,
                  rating: true,
                  isOpen: true,
                  autoConfirm: true,
                  operatingHours: true,
                  paymentFrequency: true,
                  preferredPaymentMethod: true
                }
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
};

// Helper to format cart response
const formatCartResponse = (cart) => {
  const items = cart.items.map((item) => ({
    id: item.menuItemId,
    name: item.menuItem.name,
    price: item.menuItem.price,
    quantity: item.quantity,
    image: item.menuItem.image,
    isAvailable: item.menuItem.isAvailable,
    // ADDED THESE FIELDS so frontend validation works
    outletId: item.menuItem.outletId,
    outletName: item.menuItem.outlet ? item.menuItem.outlet.name : 'Unknown',
    isReadyToPick: item.menuItem.isReadyToPick || false,
    prepTime: item.menuItem.prepTime || 15,
    subtotal: item.menuItem.price * item.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const taxRate = 0.08;
  const taxes = subtotal * taxRate;
  const deliveryFee = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + taxes + deliveryFee;

  return {
    items,
    summary: {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxes: parseFloat(taxes.toFixed(2)),
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    },
  };
};

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const cart = await getCartWithItems(req.user.id);
    const formattedCart = formatCartResponse(cart);

    res.json({
      success: true,
      data: formattedCart,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
    });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;

    if (!itemId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid item ID and quantity are required',
      });
    }

    // Check if menu item exists and is available
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: String(itemId) },
    });

    if (!menuItem || !menuItem.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found or unavailable',
      });
    }

    const cart = await getCartWithItems(req.user.id);

    // Upsert cart item
    await prisma.cartItem.upsert({
      where: {
        cartId_menuItemId: {
          cartId: cart.id,
          menuItemId: String(itemId),
        },
      },
      create: {
        cartId: cart.id,
        menuItemId: String(itemId),
        quantity,
      },
      update: {
        quantity: { increment: quantity },
      },
    });

    // Return updated cart
    const updatedCart = await getCartWithItems(req.user.id);
    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: formatCartResponse(updatedCart),
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
    });
  }
});

// Update item quantity
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (!itemId || quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid item ID and quantity are required',
      });
    }

    const cart = await getCartWithItems(req.user.id);

    if (quantity === 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: {
          cartId_menuItemId: {
            cartId: cart.id,
            menuItemId: String(itemId),
          },
        },
      });
    } else {
      // Update quantity
      await prisma.cartItem.update({
        where: {
          cartId_menuItemId: {
            cartId: cart.id,
            menuItemId: String(itemId),
          },
        },
        data: { quantity },
      });
    }

    // Return updated cart
    const updatedCart = await getCartWithItems(req.user.id);
    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: formatCartResponse(updatedCart),
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart',
    });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await getCartWithItems(req.user.id);

    await prisma.cartItem.delete({
      where: {
        cartId_menuItemId: {
          cartId: cart.id,
          menuItemId: String(itemId),
        },
      },
    });

    const updatedCart = await getCartWithItems(req.user.id);
    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: formatCartResponse(updatedCart),
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
    });
  }
});

// Clear cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const cart = await getCartWithItems(req.user.id);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        summary: {
          subtotal: 0,
          taxes: 0,
          deliveryFee: 0,
          total: 0,
          itemCount: 0,
        },
      },
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
    });
  }
});

export default router;
