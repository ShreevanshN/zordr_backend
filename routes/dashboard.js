import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Admin Dashboard Stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is ADMIN or SUPER_ADMIN
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { period = 'today' } = req.query;

    // Get date range based on period
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // 1. Today's Orders
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: { gte: startOfToday },
      },
    });

    const yesterdayOrders = await prisma.order.count({
      where: {
        createdAt: { gte: startOfYesterday, lt: startOfToday },
      },
    });

    const ordersChange =
      yesterdayOrders > 0
        ? (((todayOrders - yesterdayOrders) / yesterdayOrders) * 100).toFixed(1)
        : '+100';

    // 2. Today's Revenue
    const todayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfToday },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    });

    const yesterdayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfYesterday, lt: startOfToday },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    });

    const revenueToday = todayRevenue._sum.total || 0;
    const revenueYesterday = yesterdayRevenue._sum.total || 0;
    const revenueChange =
      revenueYesterday > 0
        ? (((revenueToday - revenueYesterday) / revenueYesterday) * 100).toFixed(1)
        : '+100';

    // 3. Active Outlets
    const activeOutlets = await prisma.outlet.count({
      where: { isOpen: true },
    });

    const totalOutlets = await prisma.outlet.count();
    const outletsChange = totalOutlets - activeOutlets;

    // 4. Pending Support Tickets
    const pendingTickets = await prisma.supportTicket.count({
      where: { status: 'OPEN' },
    });

    const stats = [
      {
        title: 'Total Orders',
        value: todayOrders.toString(),
        change: `${ordersChange > 0 ? '+' : ''}${ordersChange}%`,
        trend: parseFloat(ordersChange) >= 0 ? 'up' : 'down',
        period: 'Today',
      },
      {
        title: 'Revenue',
        value: `₹${Math.round(revenueToday).toLocaleString()}`,
        change: `${revenueChange > 0 ? '+' : ''}${revenueChange}%`,
        trend: parseFloat(revenueChange) >= 0 ? 'up' : 'down',
        period: 'Today',
      },
      {
        title: 'Active Outlets',
        value: activeOutlets.toString(),
        change: outletsChange > 0 ? `+${outletsChange}` : `${outletsChange}`,
        trend: outletsChange >= 0 ? 'up' : 'down',
        period: 'Live',
      },
      {
        title: 'Pending Tickets',
        value: pendingTickets.toString(),
        change: '',
        trend: 'up',
        period: 'Open',
      },
    ];

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
    });
  }
});

// Live Order Stream for Dashboard
router.get('/live-orders', authenticateToken, async (req, res) => {
  try {
    // Check if user is ADMIN or SUPER_ADMIN
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { limit = 10 } = req.query;

    // Get recent active orders (not completed or cancelled)
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['pending', 'new', 'confirmed', 'preparing', 'ready'],
        },
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        outlet: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
    });

    const liveOrders = orders.map((order) => ({
      id: order.orderNumber,
      outlet: order.outlet.name,
      user: order.user.name || order.user.phone,
      value: `₹${Math.round(order.total)}`,
      status: order.status.toLowerCase(),
      pickupTime: order.estimatedTime || 'ASAP',
    }));

    res.json({
      success: true,
      data: liveOrders,
    });
  } catch (error) {
    console.error('Live orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live orders',
    });
  }
});

// Export Dashboard Stats
router.get('/export', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const stats = await prisma.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
    });

    const activeOutlets = await prisma.outlet.count({ where: { isOpen: true } });
    const pendingTickets = await prisma.supportTicket.count({ where: { status: 'OPEN' } });

    const exportData = {
      generatedAt: new Date(),
      summary: {
        totalRevenue: stats._sum.total || 0,
        totalOrders: stats._count.id || 0,
        activeOutlets,
        pendingTickets,
      },
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

export default router;
