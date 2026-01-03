import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 1. Admin Routes (Explicit)
router.get('/admin/offers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const offers = await prisma.offer.findMany({
      include: { outlet: { select: { id: true, name: true, campus: true } } },
      orderBy: { validUntil: 'asc' },
    });

    res.json({ success: true, data: offers });
  } catch (error) {
    console.error('Get admin offers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching offers' });
  }
});

router.post('/admin/offers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const {
      outletId,
      code,
      name,
      description,
      discountType,
      value,
      minOrderVal,
      validity,
      validUntil,
    } = req.body;

    if (!code || !value) {
      return res
        .status(400)
        .json({ success: false, message: 'Code and Value are required' });
    }

    const newOffer = await prisma.offer.create({
      data: {
        outletId, // Optional (null for platform-wide)
        code: code.toUpperCase(),
        description: description || name,
        discountType: discountType || 'PERCENTAGE',
        value: parseFloat(value),
        minOrderVal: parseFloat(minOrderVal) || 0,
        validUntil: new Date(validUntil || validity),
        isActive: true,
        // New Fields
        offerType: req.body.offerType || 'OFFER',
        source: 'ADMIN',
        applicableItemIds: req.body.applicableItemIds || [],
      },
    });

    res.json({ success: true, message: 'Offer created successfully', data: newOffer });
  } catch (error) {
    console.error('Create admin offer error:', error);
    res.status(500).json({ success: false, message: 'Error creating offer' });
  }
});

router.delete('/admin/offers/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    await prisma.offer.delete({ where: { id } });

    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Delete admin offer error:', error);
    res.status(500).json({ success: false, message: 'Error deleting offer' });
  }
});

// 2. Partner Routes
router.get('/partner/offers', authenticateToken, async (req, res) => {
  try {
    // Verify partner role
    if (!['PARTNER_MANAGER', 'PARTNER_STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.outletId) {
      return res.status(400).json({ success: false, message: 'No outlet linked' });
    }

    const offers = await prisma.offer.findMany({
      where: { outletId: user.outletId },
      orderBy: { validUntil: 'asc' },
    });

    res.json({ success: true, data: offers });
  } catch (error) {
    console.error('Get partner offers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching offers' });
  }
});

// 2. Create Offer
router.post('/partner/offers', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const {
      name,
      discount,
      minOrder,
      validity,
      category,
      customerType,
      code,
      value,
      discountType,
    } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Basic validation
    if (!code || !value) {
      return res.status(400).json({ success: false, message: 'Code and Value are required' });
    }

    const newOffer = await prisma.offer.create({
      data: {
        outletId: user.outletId,
        code: code.toUpperCase(),
        description: name, // Using name as description for now
        discountType: discountType || 'PERCENTAGE',
        value: parseFloat(value),
        minOrderVal: parseFloat(minOrder) || 0,
        validUntil: new Date(validity), // Expecting ISO string or date string
        isActive: true,
        // New Fields
        offerType: 'OFFER', // Partners primarily create Offers
        source: 'PARTNER',
      },
    });

    res.json({ success: true, message: 'Offer created successfully', data: newOffer });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ success: false, message: 'Error creating offer' });
  }
});

// 3. Toggle Offer Status
router.put('/partner/offers/:id/toggle', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'PARTNER_STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: { isActive },
    });

    res.json({
      success: true,
      message: `Offer ${isActive ? 'activated' : 'deactivated'}`,
      data: updatedOffer,
    });
  } catch (error) {
    console.error('Toggle offer error:', error);
    res.status(500).json({ success: false, message: 'Error updating offer' });
  }
});

// 4. Delete Offer
router.delete('/partner/offers/:id', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    await prisma.offer.delete({ where: { id } });

    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ success: false, message: 'Error deleting offer' });
  }
});

// 5. Validate Offer (Public/User)
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code, outletId, orderValue } = req.body;

    if (!code || !outletId || !orderValue) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const offer = await prisma.offer.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    if (!offer.isActive) {
      return res.status(400).json({ success: false, message: 'This coupon is no longer active' });
    }

    // Check Expiry
    if (new Date() > new Date(offer.validUntil)) {
      return res.status(400).json({ success: false, message: 'This coupon has expired' });
    }

    // Check Outlet (if specific)
    if (offer.outletId && offer.outletId !== outletId) {
      return res.status(400).json({ success: false, message: 'This coupon is not valid for this outlet' });
    }

    // Check Min Order
    if (orderValue < offer.minOrderVal) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${offer.minOrderVal} required`,
      });
    }

    // Calculate Discount
    let discountAmount = 0;
    if (offer.discountType === 'PERCENTAGE') {
      discountAmount = (orderValue * offer.value) / 100;
    } else {
      discountAmount = offer.value;
    }

    // Cap discount if needed (optional logic, usually meant for percentage)
    // For now, simple logic

    res.json({
      success: true,
      data: {
        code: offer.code,
        discount: discountAmount,
        type: offer.discountType,
        description: offer.description
      },
    });

  } catch (error) {
    console.error('Validate offer error:', error);
    res.status(500).json({ success: false, message: 'Error validating offer' });
  }
});

// 6. Get Available Offers for User (Public/Auth)
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { outletId } = req.query;

    const whereClause = {
      isActive: true,
      validUntil: { gt: new Date() },
    };

    if (outletId) {
      whereClause.OR = [
        { outletId: null }, // Platform-wide
        { outletId: outletId }, // Specific outlet
      ];
    } else {
      whereClause.outletId = null; // Only platform-wide if no outlet specified
    }

    const offers = await prisma.offer.findMany({
      where: whereClause,
      orderBy: { validUntil: 'asc' },
    });

    res.json({ success: true, data: offers });
  } catch (error) {
    console.error('Get available offers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching offers' });
  }
});

export default router;
