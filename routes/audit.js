import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all audit logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { action, userId, limit = 100, offset = 0 } = req.query;

    const whereClause = {};
    if (action) {
      whereClause.action = action;
    }
    if (userId) {
      whereClause.userId = userId;
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching audit logs' });
  }
});

// Create audit log (internal use)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { action, details, targetId } = req.body;

    const log = await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action,
        details,
        targetId,
      },
    });

    res.json({ success: true, data: log });
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({ success: false, message: 'Error creating audit log' });
  }
});

export default router;
