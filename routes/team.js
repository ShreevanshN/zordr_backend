import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// 1. Get Team Members
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'PARTNER_STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.outletId) {
      return res.status(400).json({ success: false, message: 'No outlet linked' });
    }

    const team = await prisma.user.findMany({
      where: {
        outletId: user.outletId,
        role: { in: ['PARTNER_MANAGER', 'PARTNER_STAFF'] },
      },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
      },
    });

    res.json({ success: true, data: team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ success: false, message: 'Error fetching team' });
  }
});

// 2. Add Team Member
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { name, phone, role } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'User with this phone already exists' });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        role: role === 'Manager' ? 'PARTNER_MANAGER' : 'PARTNER_STAFF',
        outletId: user.outletId,
        isActive: true,
      },
    });

    res.json({ success: true, message: 'Team member added', data: newUser });
  } catch (error) {
    console.error('Add team error:', error);
    res.status(500).json({ success: false, message: 'Error adding team member' });
  }
});

// 3. Remove Team Member
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot remove yourself' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ success: true, message: 'Team member removed' });
  } catch (error) {
    console.error('Remove team error:', error);
    res.status(500).json({ success: false, message: 'Error removing team member' });
  }
});

export default router;
