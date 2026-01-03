import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's favorite items
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Find or create favorites for user
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        menuItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedFavorites = favorites.map((fav) => ({
      id: fav.menuItem.id,
      name: fav.menuItem.name,
      description: fav.menuItem.description,
      price: fav.menuItem.price,
      image: fav.menuItem.image,
      category: fav.menuItem.category,
      isAvailable: fav.menuItem.isAvailable,
      addedAt: fav.createdAt,
    }));

    res.json({
      success: true,
      data: formattedFavorites,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
    });
  }
});

// Add item to favorites
router.post('/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Check if menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: itemId },
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_menuItemId: {
          userId: req.user.id,
          menuItemId: itemId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Item already in favorites',
      });
    }

    // Add to favorites
    await prisma.favorite.create({
      data: {
        userId: req.user.id,
        menuItemId: itemId,
      },
    });

    res.json({
      success: true,
      message: 'Item added to favorites successfully',
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to favorites',
    });
  }
});

// Remove item from favorites
router.delete('/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;

    await prisma.favorite.delete({
      where: {
        userId_menuItemId: {
          userId: req.user.id,
          menuItemId: itemId,
        },
      },
    });

    res.json({
      success: true,
      message: 'Item removed from favorites successfully',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Item not found in favorites',
      });
    }
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from favorites',
    });
  }
});

// Toggle favorite (add if not exists, remove if exists)
router.post('/toggle/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Check if menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: itemId },
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_menuItemId: {
          userId: req.user.id,
          menuItemId: itemId,
        },
      },
    });

    if (existing) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: {
          userId_menuItemId: {
            userId: req.user.id,
            menuItemId: itemId,
          },
        },
      });

      return res.json({
        success: true,
        message: 'Item removed from favorites',
        data: { isFavorite: false },
      });
    } else {
      // Add to favorites
      await prisma.favorite.create({
        data: {
          userId: req.user.id,
          menuItemId: itemId,
        },
      });

      return res.json({
        success: true,
        message: 'Item added to favorites',
        data: { isFavorite: true },
      });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling favorite',
    });
  }
});

export default router;
