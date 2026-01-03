import express from 'express';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from '../utils/pushNotifications.js';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to authenticate token
import { authenticateToken } from '../middleware/auth.js';

// GET / - Fetch user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
    });
  }
});

// PUT /:id/read - Mark as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: req.params.id,
        userId: req.user.id, // Ensure ownership
      },
      data: { read: true },
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
    });
  }
});

// POST /mark-all-read - Mark all as read
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notifications',
    });
  }
});

// POST / - Create notification (Admin only or Internal)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId, type, title, message, targetId } = req.body;

    // Basic validation
    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type || 'system',
        title,
        message,
        targetId,
      },
    });

    // Send Push Notification
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.pushToken) {
      await sendPushNotification(user.pushToken, title, message, {
        type: type || 'system',
        targetId,
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
    });
  }
});

// DELETE /clear-all - Delete all notifications for the user
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id },
    });

    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications',
    });
  }
});

// POST /broadcast - Send notification to multiple users
router.post('/broadcast', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { title, message, audience, medium } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    let where = {};
    if (audience === 'active') {
      where.isActive = true;
    } else if (audience === 'vendors') {
      where.role = { in: ['OUTLET_OWNER', 'PARTNER_MANAGER', 'PARTNER_STAFF'] };
    } else if (audience === 'all') {
      // No filter, all users
    }
    // Note: Campus-specific filtering would require joining with Outlet/Campus, omitted for simplicity

    const users = await prisma.user.findMany({
      where,
      select: { id: true, pushToken: true },
    });

    if (users.length === 0) {
      return res.json({ success: true, message: 'No matching users found', count: 0 });
    }

    // 1. Create database notifications
    const notificationsData = users.map((u) => ({
      userId: u.id,
      title,
      message,
      type: 'announcement',
      read: false,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    // 2. Send Push Notifications (async, don't block response)
    if (medium !== 'sms' && medium !== 'email') {
      // 'push' or 'all'
      // We'll process this in chunks or just fire and forget for now
      users.forEach(async (u) => {
        if (u.pushToken) {
          try {
            await sendPushNotification(u.pushToken, title, message, { type: 'announcement' });
          } catch (err) {
            console.error(`Failed to push to ${u.id}:`, err);
          }
        }
      });
    }

    res.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
      count: users.length,
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ success: false, message: 'Error sending broadcast' });
  }
});

export default router;
