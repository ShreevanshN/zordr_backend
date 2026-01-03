import OrderService from '../services/orderService.js';

class OrderController {
    async getUserOrders(req, res) {
        try {
            const { status, limit = 20, offset = 0 } = req.query;
            const result = await OrderService.getUserOrders(
                req.user.id,
                status,
                parseInt(limit),
                parseInt(offset)
            );

            res.json({
                success: true,
                data: result.data,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: result.total,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getPartnerOrders(req, res) {
        try {
            // Permission check could also be in Service, but Controller guards the door.
            if (!['PARTNER_MANAGER', 'PARTNER_STAFF', 'ADMIN'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }

            const { status, limit = 50, offset = 0 } = req.query;
            const data = await OrderService.getPartnerOrders(
                req.user.id,
                status,
                parseInt(limit),
                parseInt(offset)
            );

            res.json({ success: true, data });
        } catch (error) {
            // Handle specific errors like "No outlet linked"
            if (error.message.includes('No outlet')) return res.status(400).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getOrderById(req, res) {
        try {
            const { orderId } = req.params;
            const order = await OrderService.getOrderById(orderId, req.user);
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

            res.json({ success: true, data: order });
        } catch (error) {
            if (error.message === 'Unauthorized access to order') return res.status(403).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createOrder(req, res) {
        try {
            if (!req.body.items || req.body.items.length === 0) {
                return res.status(400).json({ success: false, message: 'Order items are required' });
            }

            const result = await OrderService.createOrder(req.user.id, req.body);

            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                data: {
                    ...result.order,
                    pointsEarned: result.pointsEarned
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateStatus(req, res) {
        try {
            const { orderId } = req.params;
            const { status, estimatedTime } = req.body;
            if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

            const order = await OrderService.updateStatus(orderId, status, estimatedTime, req.user);
            res.json({ success: true, message: 'Order status updated successfully', data: order });

        } catch (error) {
            if (error.message === 'Order not found') return res.status(404).json({ success: false, message: error.message });
            if (error.message === 'Unauthorized') return res.status(403).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async cancelOrder(req, res) {
        try {
            const { orderId } = req.params;
            const { reason } = req.body;
            const order = await OrderService.cancelOrder(orderId, req.user.id, reason);
            res.json({ success: true, message: 'Order cancelled successfully', data: order });

        } catch (error) {
            if (error.message === 'Order not found') return res.status(404).json({ success: false, message: error.message });
            if (error.message === 'Unauthorized') return res.status(404).json({ success: false, message: 'Order not found' }); // Ambiguous 404 for sec
            if (error.message === 'Order cannot be cancelled') return res.status(400).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAdminOrders(req, res) {
        try {
            if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }

            const { status, campus, outlet, limit = 100, offset = 0 } = req.query;
            const data = await OrderService.getAdminOrders({ status, campus, outlet }, parseInt(limit), parseInt(offset));

            res.json({
                success: true,
                data,
                meta: { total: data.length, limit: parseInt(limit), offset: parseInt(offset) }
            });

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new OrderController();
