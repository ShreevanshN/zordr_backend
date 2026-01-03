import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { role, search, limit = 50, offset = 0 } = req.query;

    const whereClause = {};
    if (role) {
      whereClause.role = role;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        outletId: true,
        outlet: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const totalCount = await prisma.user.count({ where: whereClause });

    res.json({
      success: true,
      data: users.map((user) => ({
        ...user,
        outletName: user.outlet?.name || 'N/A',
      })),
      meta: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Get single user details
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
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
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// Update user details
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        name,
        phone,
      },
    });

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
});

// Update user role
router.put('/:userId/role', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { role } = req.body;
    const validRoles = ['USER', 'PARTNER_STAFF', 'PARTNER_MANAGER', 'ADMIN', 'SUPER_ADMIN'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { role },
    });

    res.json({ success: true, message: 'User role updated', data: user });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Error updating user role' });
  }
});

// Toggle user active status
router.put('/:userId/toggle-active', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: { isActive: !user.isActive },
    });

    res.json({
      success: true,
      message: `User ${updated.isActive ? 'activated' : 'deactivated'}`,
      data: updated,
    });
  } catch (error) {
    console.error('Toggle user active error:', error);
    res.status(500).json({ success: false, message: 'Error updating user status' });
  }
});

// Link user to outlet
router.put('/:userId/outlet', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { outletId } = req.body;

    // Validate outlet exists
    if (outletId) {
      const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
      if (!outlet) {
        return res.status(404).json({ success: false, message: 'Outlet not found' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { outletId: outletId || null }, // Allow null to unlink
      include: { outlet: { select: { name: true } } }
    });

    res.json({
      success: true,
      message: outletId ? `User linked to ${user.outlet?.name}` : 'User unlinked from outlet',
      data: user
    });
  } catch (error) {
    console.error('Link user outlet error:', error);
    res.status(500).json({ success: false, message: 'Error linking user to outlet' });
  }
});

export default router;
