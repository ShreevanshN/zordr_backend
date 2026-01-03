import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all campuses
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, city } = req.query;
    const whereClause = {}; // Removed isActive filter - show ALL campuses

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' };
    }

    // Auto-discover campuses from Outlets
    // This ensures compatibility with legacy data where 'campus' string exists on Outlet but no Campus record exists
    const distinctOutletCampuses = await prisma.outlet.groupBy({
      by: ['campus'],
    });

    const existingCampusNames = await prisma.campus
      .findMany({
        select: { name: true },
      })
      .then((rows) => rows.map((r) => r.name));

    const missingCampuses = distinctOutletCampuses
      .map((g) => g.campus)
      .filter((name) => name && !existingCampusNames.includes(name));

    if (missingCampuses.length > 0) {
      console.log(
        `Auto-registering ${missingCampuses.length} missing campuses: ${missingCampuses.join(', ')}`
      );
      await prisma.campus.createMany({
        data: missingCampuses.map((name) => ({
          name,
          location: 'Main Campus',
          city: 'Unknown',
          state: 'Unknown',
          isActive: true,
        })),
        skipDuplicates: true,
      });
    }

    const campuses = await prisma.campus.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    // Enrich with outlet counts
    // We can do a quick lookup count
    const enrichedCampuses = await Promise.all(
      campuses.map(async (campus) => {
        const outletCount = await prisma.outlet.count({
          where: { campus: campus.name },
        });
        const activeOutletCount = await prisma.outlet.count({
          where: { campus: campus.name, isOpen: true },
        });

        // Very rough mock of "orders today" just to fill UI
        const todaysOrders = 0;

        return {
          ...campus,
          totalOutlets: outletCount,
          activeOutlets: activeOutletCount,
          todaysOrders,
          monthlyRevenue: '₹0', // Placeholder
          status: campus.isActive ? 'active' : 'inactive',
        };
      })
    );

    res.json({
      success: true,
      data: enrichedCampuses,
    });
  } catch (error) {
    console.error('Get campuses error:', error);
    res.status(500).json({ success: false, message: 'Error fetching campuses' });
  }
});

// Create new campus
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Only Admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let { name, location, city, state, contactPerson, contactPhone, contactEmail, established } =
      req.body;

    // Auto-clean variables
    name = name?.trim();
    location = location?.trim();
    city = city?.trim();
    state = state?.trim();
    contactPerson = contactPerson?.trim();
    contactPhone = contactPhone?.trim();
    contactEmail = contactEmail?.trim();

    if (!name || !location || !city || !state) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existing = await prisma.campus.findUnique({ where: { name } });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'Campus with this name already exists' });
    }

    const campus = await prisma.campus.create({
      data: {
        name,
        location,
        city,
        state,
        contactPerson,
        contactPhone,
        contactEmail,
        established: established ? new Date(established) : undefined,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Campus registered successfully',
      data: campus,
    });
  } catch (error) {
    console.error('Create campus error:', error);
    res.status(500).json({ success: false, message: 'Error creating campus' });
  }
});

// Update campus
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Only Admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    let { name, location, city, state, established } = req.body;

    // Auto-clean variables
    name = name?.trim();
    location = location?.trim();
    city = city?.trim();
    state = state?.trim();

    if (!name || !location || !city || !state) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if campus exists
    const existing = await prisma.campus.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Campus not found' });
    }

    // Check if new name conflicts with another campus
    if (name !== existing.name) {
      const nameConflict = await prisma.campus.findUnique({ where: { name } });
      if (nameConflict) {
        return res.status(400).json({ success: false, message: 'Campus name already exists' });
      }
    }

    const campus = await prisma.campus.update({
      where: { id },
      data: {
        name,
        location,
        city,
        state,
        established: established ? new Date(established) : undefined,
      },
    });

    res.json({
      success: true,
      message: 'Campus updated successfully',
      data: campus,
    });
  } catch (error) {
    console.error('Update campus error:', error);
    res.status(500).json({ success: false, message: 'Error updating campus' });
  }
});

// Delete campus (cascade delete outlets)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Only Admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if campus exists
    const campus = await prisma.campus.findUnique({ where: { id } });
    if (!campus) {
      return res.status(404).json({ success: false, message: 'Campus not found' });
    }

    // Delete all outlets associated with this campus first (cascade)
    await prisma.outlet.deleteMany({
      where: { campus: campus.name },
    });

    // Delete the campus
    await prisma.campus.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Campus and its outlets deleted successfully',
    });
  } catch (error) {
    console.error('Delete campus error:', error);
    res.status(500).json({ success: false, message: 'Error deleting campus' });
  }
});

export default router;
