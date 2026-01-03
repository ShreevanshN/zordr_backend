import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Helper to get date ranges
const getDateRange = (range) => {
  const now = new Date();
  const start = new Date();

  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === 'week') {
    start.setDate(now.getDate() - 7);
  } else if (range === 'month') {
    start.setMonth(now.getMonth() - 1);
  }

  return start;
};

// 1. Get Key Stats
router.get('/partner/stats', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'PARTNER_STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const outletId = user.outletId;
    const { range = 'today' } = req.query;
    const startDate = getDateRange(range);

    // Fetch orders for the period
    const orders = await prisma.order.findMany({
      where: {
        outletId,
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' }, // Exclude cancelled for revenue
      },
      include: { user: true },
    });

    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;

    // Unique customers
    const uniqueCustomers = new Set(orders.map((o) => o.userId)).size;

    res.json({
      success: true,
      data: {
        totalOrders,
        revenue,
        avgOrderValue,
        customers: uniqueCustomers,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// 2. Get Charts Data (Revenue Trend & Category Distribution)
router.get('/partner/charts', authenticateToken, async (req, res) => {
  try {
    if (!['PARTNER_MANAGER', 'PARTNER_STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const outletId = user.outletId;

    // --- Revenue Trend (Last 7 days) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        outletId,
        createdAt: { gte: sevenDaysAgo },
        status: { not: 'CANCELLED' },
      },
    });

    const trend = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayRevenue = orders
        .filter((o) => o.createdAt.toISOString().startsWith(dateStr))
        .reduce((sum, o) => sum + o.total, 0);

      trend.push({ day: dayName, revenue: dayRevenue });
    }

    // --- Category Distribution ---
    // This is harder with Prisma since OrderItems don't directly store category.
    // We need to fetch OrderItems -> MenuItem -> Category
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          outletId,
          status: { not: 'CANCELLED' },
        },
      },
      include: { menuItem: true },
    });

    const categoryMap = {};
    let totalRevenue = 0;

    orderItems.forEach((item) => {
      if (item.menuItem) {
        const cat = item.menuItem.category || 'Other';
        const rev = item.price * item.quantity;
        categoryMap[cat] = (categoryMap[cat] || 0) + rev;
        totalRevenue += rev;
      }
    });

    const categoryDistribution = Object.keys(categoryMap)
      .map((cat) => ({
        name: cat,
        revenue: categoryMap[cat],
        percentage: totalRevenue > 0 ? Math.round((categoryMap[cat] / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5

    res.json({
      success: true,
      data: {
        trend,
        categories: categoryDistribution,
      },
    });
  } catch (error) {
    console.error('Get charts error:', error);
    res.status(500).json({ success: false, message: 'Error fetching charts' });
  }
});

export default router;
