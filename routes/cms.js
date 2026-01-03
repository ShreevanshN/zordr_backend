import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all banners/CMS content
router.get('/banners', authenticateToken, async (req, res) => {
  try {
    const { isActive } = req.query;

    const whereClause = {};
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const banners = await prisma.banner.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
    });

    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ success: false, message: 'Error fetching banners' });
  }
});

// Create banner
router.post('/banners', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { title, imageUrl, link, order = 0, isActive = true } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Title and image URL required' });
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        link: link || '',
        order,
        isActive,
      },
    });

    res.json({ success: true, message: 'Banner created', data: banner });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ success: false, message: 'Error creating banner' });
  }
});

// Update banner
router.put('/banners/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { title, imageUrl, link, order, isActive } = req.body;

    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data: {
        title,
        imageUrl,
        link,
        order,
        isActive,
      },
    });

    res.json({ success: true, message: 'Banner updated', data: banner });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ success: false, message: 'Error updating banner' });
  }
});

// Delete banner
router.delete('/banners/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.banner.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ success: false, message: 'Error deleting banner' });
  }
});

export default router;
