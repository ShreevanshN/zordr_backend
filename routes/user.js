import express from 'express';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
import prisma from '../lib/prisma.js';

// 1. GET MY PROFILE
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email, // Used for updates/info
        dietary: user.dietary, // Veg/Non-Veg preference
        zCoins: user.zCoins,
        rank: user.rank,
        notificationPreferences: user.notificationPreferences || {},
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

// 2. UPDATE PROFILE (Add Email, Change Name, etc.)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, dietary, campus, allergies } = req.body;

    // Build update data object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (dietary) updateData.dietary = dietary;
    if (campus) updateData.campus = campus;
    if (allergies !== undefined) {
      // Allergies should be an array
      updateData.allergies = Array.isArray(allergies) ? allergies : [];
    }
    if (req.body.notificationPreferences) {
      updateData.notificationPreferences = req.body.notificationPreferences;
    }

    // Update only the fields provided
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        dietary: updatedUser.dietary,
        campus: updatedUser.campus,
        allergies: updatedUser.allergies,
        zCoins: updatedUser.zCoins,
        rank: updatedUser.rank,
        notificationPreferences: updatedUser.notificationPreferences || {},
      },
    });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 'P2002') {
      return res
        .status(400)
        .json({ success: false, message: 'Email already in use by another account' });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// 3. SAVE PUSH TOKEN
router.post('/push-token', authenticateToken, async (req, res) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { pushToken },
    });

    res.json({ success: true, message: 'Push token saved successfully' });
  } catch (error) {
    console.error('Save push token error:', error);
    res.status(500).json({ success: false, message: 'Failed to save push token' });
  }
});

export default router;
