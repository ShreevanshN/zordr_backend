import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ZOR-${timestamp}-${random}`;
};

// TEST ENDPOINT - Create order without auth (for testing COD from mobile simulation)
router.post('/orders', async (req, res) => {
    try {
        const {
            items,
            paymentMethod = 'COD',
            pickupSlot,
            customer,
            total,
            type = 'Takeaway'
        } = req.body;

        console.log('📦 Test order received:', { paymentMethod, pickupSlot, total });

        // For testing, we'll create a simple order without full validation
        // In production, this endpoint should be removed or protected

        // Find or create a test user
        let testUser = await prisma.user.findFirst({
            where: { phone: customer?.phone || '+919876543210' }
        });

        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    phone: customer?.phone || '+919876543210',
                    name: customer?.name || 'Test Customer',
                    role: 'USER',
                    rank: customer?.rank || 'Starter',
                    allergies: customer?.allergies || []
                }
            });
        }

        // Get KITSW Main Canteen outlet for testing
        const outlet = await prisma.outlet.findFirst({
            where: {
                OR: [
                    { name: { contains: 'KITSW', mode: 'insensitive' } },
                    { name: { contains: 'Main Canteen', mode: 'insensitive' } }
                ]
            }
        });

        if (!outlet) {
            return res.status(400).json({
                success: false,
                message: 'KITSW Main Canteen not found. Please create the outlet first.'
            });
        }

        const orderNumber = generateOrderNumber();

        // Create order without menu item validation for testing
        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: testUser.id,
                outletId: outlet.id,
                subtotal: total || 1000,
                discount: 0,
                tax: (total || 1000) * 0.05,
                total: total || 1000,
                paymentMethod,
                pickupTime: pickupSlot || null, // Use the provided slot directly
                status: 'confirmed',
                estimatedTime: '25-30 mins'
                // Skip items creation to avoid foreign key issues
            },
            include: {
                outlet: true,
                user: true
            }
        });

        console.log('✅ Test order created:', orderNumber);

        res.status(201).json({
            success: true,
            message: 'Test order created successfully',
            data: {
                id: order.orderNumber,
                status: order.status,
                paymentMethod: order.paymentMethod,
                pickupSlot: order.pickupTime,
                total: order.total,
                customer: {
                    name: testUser.name,
                    rank: testUser.rank
                }
            }
        });
    } catch (error) {
        console.error('❌ Test order creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating test order',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;
