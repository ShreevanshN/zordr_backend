import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import MenuController from '../controllers/menuController.js';
import MenuService from '../services/menuService.js'; // Import Service for Cache Invalidation
import prisma from '../lib/prisma.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Menu management and retrieval
 */

/**
 * @swagger
 * /menu:
 *   get:
 *     summary: Get Public Menu for an Outlet (Cached)
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: outletId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu details and items
 */
router.get('/', optionalAuth, MenuController.getMenu);

/**
 * @swagger
 * /menu/items:
 *   get:
 *     summary: List all menu items with search and filters
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: outletId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of items
 */
router.get('/items', optionalAuth, MenuController.getAllItems);
router.get('/categories', optionalAuth, MenuController.getCategories);
router.get('/deals', optionalAuth, MenuController.getDeals); // Add specific routes BEFORE /:id

// Support Frontend Route (Admin/Partner App using path param)
router.get('/outlet/:outletId', optionalAuth, (req, res, next) => {
  req.query.outletId = req.params.outletId;
  MenuController.getMenu(req, res, next);
});

router.get('/:id', optionalAuth, MenuController.getItemById);

/**
 * @swagger
 * /menu/items:
 *   post:
 *     summary: Create a new menu item
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - outletId
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               outletId:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item created
 */
router.post('/items', authenticateToken, MenuController.createItem);
router.put('/items/:id', authenticateToken, MenuController.updateItem);
router.delete('/items/:id', authenticateToken, MenuController.deleteItem);

// --- PARTNER ROUTES (Inline Implementation) ---

// 6. Get Partner Menu
router.get('/partner/menu', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'PARTNER_STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.outletId) {
      return res.status(400).json({ success: false, message: 'No outlet linked' });
    }

    const items = await prisma.menuItem.findMany({
      where: { outletId: user.outletId },
      orderBy: { name: 'asc' }
    });

    const formattedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      rating: 4.5,
      image: item.image,
      category: item.category,
      veg: item.isVeg,
      available: item.isAvailable,
      readyToPick: item.isReadyToPick,
      dietary: item.dietary,
      prepTime: item.prepTime,
      dailyStock: item.dailyStock
    }));

    res.json({ success: true, data: formattedItems });

  } catch (error) {
    console.error('Get partner menu error:', error);
    res.status(500).json({ success: false, message: 'Error fetching menu' });
  }
});

// 7. Add Menu Item
router.post('/partner/menu', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { name, description, price, category, veg, image, readyToPick, prepTime, dailyStock } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const newItem = await prisma.menuItem.create({
      data: {
        outletId: user.outletId,
        name,
        description,
        price: parseFloat(price),
        category,
        isVeg: veg,
        image: image || 'https://placehold.co/400',
        isAvailable: true,
        isReadyToPick: readyToPick || false,
        prepTime: prepTime ? parseInt(prepTime) : null,
      }
    });

    MenuService.invalidateCache(user.outletId); // Clear cache

    res.json({ success: true, message: 'Item added successfully', data: newItem });

  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ success: false, message: 'Error adding item' });
  }
});

// 8. Update Menu Item
router.put('/partner/menu/:id', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'PARTNER_STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, description, price, category, veg, available, image, readyToPick, prepTime, dailyStock } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category;
    if (veg !== undefined) updateData.isVeg = veg;
    if (available !== undefined) updateData.isAvailable = available;
    if (image) updateData.image = image;
    if (readyToPick !== undefined) updateData.isReadyToPick = readyToPick;
    if (prepTime !== undefined) updateData.prepTime = prepTime ? parseInt(prepTime) : null;
    if (dailyStock !== undefined) updateData.dailyStock = dailyStock;

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: updateData
    });

    MenuService.invalidateCache(updatedItem.outletId); // Clear cache

    res.json({ success: true, message: 'Item updated successfully', data: updatedItem });

  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ success: false, message: 'Error updating item' });
  }
});

// 9. Delete Menu Item
router.delete('/partner/menu/:id', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const existingItem = await prisma.menuItem.findUnique({ where: { id } });
    await prisma.menuItem.delete({ where: { id } });

    if (existingItem) {
      MenuService.invalidateCache(existingItem.outletId); // Clear cache
    }

    res.json({ success: true, message: 'Item deleted successfully' });

  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ success: false, message: 'Error deleting item' });
  }
});

// 10. Reset Daily Stock by Category
router.post('/partner/reset-stock', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'PARTNER_STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { category } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.outletId) {
      return res.status(400).json({ success: false, message: 'No outlet linked' });
    }

    const whereClause = {
      outletId: user.outletId,
      dailyStock: true
    };

    // If category specified, filter by it
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Reset stock: set isAvailable to true and update stockResetTime
    const result = await prisma.menuItem.updateMany({
      where: {
        ...whereClause,
        // Optional: only reset if not available? or reset all? usually reset means make available.
        isAvailable: false
      },
      data: {
        isAvailable: true,
        stockResetTime: new Date()
      }
    });

    MenuService.invalidateCache(user.outletId); // Clear cache

    res.json({
      success: true,
      message: `Stock reset for ${result.count} items`,
      data: { count: result.count, category: category || 'all' }
    });

  } catch (error) {
    console.error('Reset stock error:', error);
    res.status(500).json({ success: false, message: 'Error resetting stock' });
  }
});

export default router;
