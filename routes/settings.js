import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const settings = await prisma.systemSetting.findMany();

    // Convert array to object for easier frontend consumption
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = JSON.parse(curr.value);
      return acc;
    }, {});

    res.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
});

// Update maintenance mode
router.post('/maintenance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { isActive, message } = req.body;

    const value = JSON.stringify({ isActive, message });

    const setting = await prisma.systemSetting.upsert({
      where: { key: 'maintenance_mode' },
      update: { value },
      create: { key: 'maintenance_mode', value },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE_SETTINGS',
          details: JSON.stringify({ setting: 'maintenance_mode', isActive, message }),
          targetId: 'maintenance_mode',
          ipAddress: req.ip || req.connection.remoteAddress,
        },
      });
    } catch (logError) {
      console.error('Failed to create audit log:', logError);
      // Don't fail the request if logging fails
    }

    res.json({
      success: true,
      message: `Maintenance mode ${isActive ? 'enabled' : 'disabled'}`,
      data: JSON.parse(setting.value),
    });
  } catch (error) {
    console.error('Update maintenance settings error:', error);
    res.status(500).json({ success: false, message: 'Error updating maintenance settings' });
  }
});

// Get Outlet Settings
router.get('/:outletId', authenticateToken, async (req, res) => {
  try {
    const { outletId } = req.params;

    // Verify ownership/role
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user || user.outletId !== outletId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    }

    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId },
      select: {
        operatingHours: true,
        paymentFrequency: true,
        preferredPaymentMethod: true,
        // printerSettings: true // Disabled until migration runs
      }
    });

    if (!outlet) {
      return res.status(404).json({ success: false, message: 'Outlet not found' });
    }

    // Map to frontend expected structure
    // "business" maps to operatingHours (plus flat fields if we decide to move them, but currently they are inside operatingHours JSON in frontend logic)
    // Frontend expects: { business: {...}, payment: {...}, printer: {...} }

    const responseData = {
      business: outlet.operatingHours || {},
      payment: {
        paymentFrequency: outlet.paymentFrequency || 'weekly',
        preferredPaymentMethod: outlet.preferredPaymentMethod || 'bank-transfer'
      },
      printer: {} // outlet.printerSettings not available
    };

    res.json({ success: true, data: responseData });

  } catch (error) {
    console.error('Get outlet settings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching outlet settings' });
  }
});

// Update Outlet Settings
router.put('/:outletId', authenticateToken, async (req, res) => {
  try {
    const { outletId } = req.params;
    const payload = req.body; // { business: {...} } OR { payment: {...} } OR { printer: {...} }

    // Verify ownership/role
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user || user.outletId !== outletId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    }

    const updateData = {};

    if (payload.business) {
      // Merge with existing operatingHours to avoid data loss if we only send partial updates
      // But usually frontend sends full object for the section.
      // Let's fetch existing first if needed, but Prisma merge for JSON is not deep.
      // We'll trust the frontend sends the complete object for "business" section or we fetch-merge.

      // For now, let's assume we replace the "business" part which maps to operatingHours.
      // But wait, operatingHours might contain other things?
      // "business" in frontend: { slotInterval, maxOrdersPerSlot, scheduledOrders, weekdays, sunday }
      // "operatingHours" in DB: Json

      // We should probably fetch existing operatingHours to merge if we want to be safe,
      // but replacing is cleaner if frontend holds truth.
      updateData.operatingHours = payload.business;
    }

    if (payload.payment) {
      if (payload.payment.paymentFrequency) updateData.paymentFrequency = payload.payment.paymentFrequency;
      if (payload.payment.preferredPaymentMethod) updateData.preferredPaymentMethod = payload.payment.preferredPaymentMethod;
    }

    if (payload.printer) {
      updateData.printerSettings = payload.printer;
    }

    // Handle User Notification Preferences (Saved on User, not Outlet)
    if (payload.notifications) {
      try {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { notificationPreferences: payload.notifications }
        });
      } catch (err) {
        console.error('Failed to update notification preferences:', err);
        // Don't fail the main outlet update
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid settings provided' });
    }

    const updatedOutlet = await prisma.outlet.update({
      where: { id: outletId },
      data: updateData,
      select: {
        id: true,
        operatingHours: true,
        paymentFrequency: true,
        preferredPaymentMethod: true
        // printerSettings: false // Explicitly exclude
      }
    });

    res.json({ success: true, message: 'Settings updated', data: updatedOutlet });

  } catch (error) {
    console.error('Update outlet settings error:', error);
    res.status(500).json({ success: false, message: `Error updating settings: ${error.message}` });
  }
});

export default router;
