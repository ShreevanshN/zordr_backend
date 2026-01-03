import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import OrderController from '../controllers/orderController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management API
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: List of user orders
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - outletId
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               outletId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.get('/', authenticateToken, OrderController.getUserOrders);
router.post('/', authenticateToken, OrderController.createOrder);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:orderId', authenticateToken, OrderController.getOrderById);

/**
 * @swagger
 * /orders/{orderId}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, preparing, ready, out_for_delivery, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:orderId/status', authenticateToken, OrderController.updateStatus);
router.put('/:orderId/cancel', authenticateToken, OrderController.cancelOrder);

// Partner Routes
router.get('/partner/orders', authenticateToken, OrderController.getPartnerOrders);

// Admin Routes
router.get('/admin/orders', authenticateToken, OrderController.getAdminOrders);

export default router;
