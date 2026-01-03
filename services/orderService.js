import prisma from '../lib/prisma.js';
import { sendPushNotification } from '../utils/pushNotifications.js';

// --- Helpers ---
const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
    return `ZOR-${timestamp}-${random}`;
};

// Shared safe select for outlet to avoid printerSettings crash
const safeOutletSelect = {
    id: true,
    name: true,
    campus: true,
    image: true,
    location: true,
    contactPhone: true,
    prepTime: true,
    rating: true,
    isOpen: true,
    autoConfirm: true,
    operatingHours: true,
    paymentFrequency: true,
    preferredPaymentMethod: true
};

const formatOrder = (order) => ({
    id: order.orderNumber,
    outletName: order.outlet ? order.outlet.name : 'Unknown',
    items: order.items.map((item) => ({
        id: item.menuItemId,
        name: item.menuItem ? item.menuItem.name : 'Unknown Item',
        price: item.price,
        quantity: item.quantity,
        image: item.menuItem ? item.menuItem.image : '',
        outletId: order.outletId,
        isReadyToPick: item.menuItem ? item.menuItem.isReadyToPick : false,
        prepTime: item.menuItem ? item.menuItem.prepTime : null,
    })),
    status: order.status,
    total: order.total,
    date: order.createdAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    pickupTime: (order.pickupTime && !isNaN(new Date(order.pickupTime).getTime())) ? new Date(order.pickupTime).toISOString() : null,
    pickupSlot: order.estimatedTime,
    qrCode: order.qrCode || undefined,
    outletId: order.outletId,
    paymentMethod: order.paymentMethod,
});

class OrderService {
    async getUserOrders(userId, status, limit, offset) {
        const whereClause = { userId };
        if (status) whereClause.status = status;

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                outlet: { select: safeOutletSelect },
                items: { include: { menuItem: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        return {
            data: orders.map(formatOrder),
            total: orders.length, // Approximation for now as we didn't count all
        };
    }

    async getPartnerOrders(userId, status, limit, offset) {
        // 1. Get Partner's Outlet
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user.outletId) throw new Error('No outlet linked to this partner account');

        const whereClause = { outletId: user.outletId };
        if (status) whereClause.status = status;

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                outlet: { select: safeOutletSelect },
                items: { include: { menuItem: true } },
                user: {
                    select: { name: true, rank: true, allergies: true, phone: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        return orders.map((order) => ({
            id: order.orderNumber,
            items: order.items.map((item) => ({
                name: item.name,
                qty: item.quantity,
                prepTime: item.menuItem?.prepTime || 15,
            })),
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            status: order.status,
            total: order.total,
            time: new Date(order.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            pickupSlot: order.pickupSlot || (order.pickupTime ? new Date(order.pickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'ASAP'),
            paymentMethod: order.paymentMethod,
            type: 'Takeaway',
            customer: {
                name: order.user.name || 'Guest',
                rank: order.user.rank || 'Starter',
                allergies: order.user.allergies || [],
            },
            cancellationReason: order.status === 'cancelled' ? 'Cancelled' : undefined,
        }));
    }

    async getOrderById(orderNumber, user) {
        const order = await prisma.order.findUnique({
            where: { orderNumber },
            include: {
                outlet: { select: safeOutletSelect },
                items: { include: { menuItem: true } },
            },
        });

        if (!order) return null;

        // Auth Check Logic moved here or keep in Controller?
        // Service usually just returns data. Authorization is often Controller or Middleware.
        // But let's check ownership here for safety.
        let isAuthorized = false;
        if (order.userId === user.id) isAuthorized = true;
        else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') isAuthorized = true;
        else if (
            (user.role === 'PARTNER_MANAGER' || user.role === 'PARTNER_STAFF') &&
            user.outletId === order.outletId
        ) {
            isAuthorized = true;
        }

        if (!isAuthorized) throw new Error('Unauthorized access to order');

        return formatOrder(order);
    }

    async createOrder(userId, orderData) {
        const {
            items,
            paymentMethod = 'UPI',
            pickupSlot,
            outletId,
            useLoyaltyPoints = false,
            specialInstructions,
        } = orderData;

        return await prisma.$transaction(async (tx) => {
            // 1. Validate Items & Calculate Subtotal & Max Prep Time
            let subtotal = 0;
            const orderItemsData = [];
            let targetOutletId = outletId;
            let maxPrepTime = 0; // Fixed: Start at 0 to allow fast items
            let totalPrepWork = 0;

            for (const item of items) {
                const menuItem = await tx.menuItem.findUnique({
                    where: { id: String(item.id) },
                });

                if (!menuItem || !menuItem.isAvailable) {
                    throw new Error(`Menu item with ID ${item.id} not found or unavailable`);
                }

                if (!targetOutletId) targetOutletId = menuItem.outletId;

                // Track max prep time (Bottleneck) and total prep work (Volume)
                // Ready-to-pick: 0 mins prep (instant). Others: DB value or 10 mins default.
                const singleItemPrep = menuItem.isReadyToPick ? 0 : (menuItem.prepTime || 10);

                // Bottleneck: The longest single item defines the minimum time
                if (singleItemPrep > maxPrepTime) maxPrepTime = singleItemPrep;

                // Total Work: Sum of all prep times
                totalPrepWork += (singleItemPrep * (item.quantity || 1));

                const itemSubtotal = menuItem.price * item.quantity;
                subtotal += itemSubtotal;

                orderItemsData.push({
                    menuItemId: menuItem.id,
                    quantity: item.quantity,
                    price: menuItem.price,
                    name: menuItem.name,
                });
            }

            if (!targetOutletId) throw new Error('Outlet ID could not be determined');

            // Fetch Outlet Settings (Check Auto-Confirm)
            const outlet = await tx.outlet.findUnique({
                where: { id: targetOutletId },
                select: { autoConfirm: true, name: true }
            });

            // Calculate Target Completion Time (Capacity Model)
            // 1. Bottleneck: Time for the hardest item
            // 2. Volume Load: Remaining work is divided by Parallelism Factor

            const extraPrepWork = Math.max(0, totalPrepWork - maxPrepTime);
            const parallelismFactor = 0.25;
            const volumeDelay = Math.ceil(extraPrepWork * parallelismFactor);

            // Buffer: If purely ready-to-pick (maxPrepTime=0), buffer is small (2m). Else 5m.
            const opsBuffer = maxPrepTime === 0 ? 2 : 5;
            const totalDurationMins = maxPrepTime + volumeDelay + opsBuffer;

            const now = new Date();
            const targetTime = new Date(now.getTime() + totalDurationMins * 60000);

            // Format estimated time string
            const estimatedTimeStr = `${totalDurationMins}-${totalDurationMins + 5} mins`;

            // Determine Initial Status & Timer
            // If Auto-Confirm is ON -> 'preparing' (Auto-Start Kitchen) and Set Timer
            // If Auto-Confirm is OFF -> 'pending' (Waiting for manual acceptance) and Timer is null
            const initialStatus = outlet?.autoConfirm ? 'preparing' : 'pending';
            const initialPickupTime = outlet?.autoConfirm ? targetTime.toISOString() : null;

            // 2. Fees & Loyalty
            const user = await tx.user.findUnique({ where: { id: userId } });
            const discount = useLoyaltyPoints ? Math.min(subtotal * 0.1, user.zCoins * 0.01) : 0;
            const taxRate = 0.08;
            const taxes = (subtotal - discount) * taxRate;
            const total = subtotal - discount + taxes;

            const orderNumber = generateOrderNumber();

            // 3. Create Order
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    userId,
                    outletId: targetOutletId,
                    subtotal,
                    discount,
                    tax: taxes,
                    total,
                    paymentMethod,
                    pickupSlot,
                    status: initialStatus,
                    estimatedTime: estimatedTimeStr, // Friendly string
                    pickupTime: initialPickupTime,
                    instructions: specialInstructions,
                    items: { create: orderItemsData },
                },
                include: {
                    outlet: { select: safeOutletSelect },
                    items: { include: { menuItem: true } },
                },
            });

            // 4. Update Points
            if (useLoyaltyPoints && discount > 0) {
                const pointsUsed = Math.floor(discount * 100);
                await tx.user.update({
                    where: { id: userId },
                    data: { zCoins: { decrement: pointsUsed } },
                });
            }
            const pointsEarned = Math.floor(total);
            await tx.user.update({
                where: { id: userId },
                data: { zCoins: { increment: pointsEarned } },
            });

            // 5. Clear Cart
            const cart = await tx.cart.findUnique({ where: { userId } });
            if (cart) {
                await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            }

            // 6. Notifications
            await tx.notification.create({
                data: {
                    userId,
                    type: 'order',
                    title: 'Order Placed Successfully!',
                    message: `Your order #${order.orderNumber} at ${order.outlet.name} has been placed.`,
                    targetId: order.orderNumber,
                },
            });

            if (user?.pushToken) {
                await sendPushNotification(
                    user.pushToken,
                    'Order Placed Successfully!',
                    `Your order #${order.orderNumber} at ${order.outlet.name} has been placed.`,
                    { type: 'order', targetId: order.orderNumber }
                );
            }

            return { order: formatOrder(order), pointsEarned };
        });
    }

    async updateStatus(orderId, status, estimatedTime, currentUser) {
        const validStatuses = [
            'confirmed',
            'preparing',
            'ready',
            'out_for_delivery',
            'delivered',
            'cancelled',
        ];
        if (!validStatuses.includes(status)) throw new Error('Invalid status');

        const order = await prisma.order.findUnique({
            where: { orderNumber: orderId },
            include: {
                outlet: { select: safeOutletSelect },
                items: { include: { menuItem: true } }
            }
        });
        if (!order) throw new Error('Order not found');

        // Auth Check
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
            if (
                (currentUser.role === 'PARTNER_MANAGER' || currentUser.role === 'PARTNER_STAFF') &&
                currentUser.outletId !== order.outletId
            ) {
                throw new Error('Unauthorized');
            }
        }

        const updateData = { status };

        // --- DYNAMIC TIME CALCULATION ON STATUS CHANGE ---
        // Calculate new Target Time if status changes to confirmed or preparing (and not already set or override needed)
        if (['confirmed', 'preparing'].includes(status) && !order.pickupTime) {
            let maxPrepTime = 15; // default
            let totalPrepWork = 0;

            for (const item of order.items) {
                if (item.menuItem) {
                    const singleItemPrep = item.menuItem.isReadyToPick ? 2 : (item.menuItem.prepTime || 15);
                    if (singleItemPrep > maxPrepTime) maxPrepTime = singleItemPrep;
                    totalPrepWork += (singleItemPrep * (item.quantity || 1));
                }
            }

            // Capacity Model: Max + (Remaining / 4)
            const extraPrepWork = Math.max(0, totalPrepWork - maxPrepTime);
            const volumeDelay = Math.ceil(extraPrepWork * 0.25);
            const totalDurationMins = maxPrepTime + volumeDelay;

            const now = new Date();
            const targetTime = new Date(now.getTime() + totalDurationMins * 60000);

            updateData.pickupTime = targetTime.toISOString();
            updateData.estimatedTime = `~${totalDurationMins} mins`;
        } else if (estimatedTime) {
            updateData.estimatedTime = estimatedTime;

            // Sync pickupTime if estimatedTime is provided (e.g., "20 mins" or "20")
            const durationMatch = estimatedTime.match(/\d+/);
            if (durationMatch) {
                const durationMins = parseInt(durationMatch[0]);
                const now = new Date();
                const targetTime = new Date(now.getTime() + durationMins * 60000);
                updateData.pickupTime = targetTime.toISOString();
            }
        }

        if (status === 'delivered' || status === 'completed') updateData.completedAt = new Date();

        const updatedOrder = await prisma.order.update({
            where: { orderNumber: orderId },
            data: updateData,
            include: {
                items: { include: { menuItem: true } },
                user: true,
                outlet: { select: safeOutletSelect },
            },
        });

        // Notifications logic...
        const statusTitles = {
            confirmed: 'Order Confirmed',
            preparing: 'Preparing Your Food',
            ready: 'Ready for Pickup!',
            delivered: 'Order Completed',
            out_for_delivery: 'Out for Delivery',
            cancelled: 'Order Cancelled',
        };
        const title = statusTitles[status] || 'Order Update';
        const message = `Your order status is now: ${status}`;

        await prisma.notification.create({
            data: {
                userId: updatedOrder.userId,
                type: 'order',
                title,
                message,
                targetId: updatedOrder.orderNumber,
            },
        });

        if (updatedOrder.user?.pushToken) {
            await sendPushNotification(updatedOrder.user.pushToken, title, message, {
                type: 'order',
                targetId: updatedOrder.orderNumber,
            });
        }

        return formatOrder(updatedOrder);
    }

    async cancelOrder(orderId, userId, reason) {
        const order = await prisma.order.findUnique({ where: { orderNumber: orderId } });
        if (!order) throw new Error('Order not found');
        if (order.userId !== userId) throw new Error('Unauthorized'); // Basic check

        if (!['confirmed', 'preparing', 'pending'].includes(order.status)) {
            throw new Error('Order cannot be cancelled');
        }

        const updatedOrder = await prisma.order.update({
            where: { orderNumber: orderId },
            data: { status: 'cancelled', completedAt: new Date() },
            include: {
                outlet: { select: safeOutletSelect },
                items: { include: { menuItem: true } },
            },
        });

        return formatOrder(updatedOrder);
    }

    async getAdminOrders(filters, limit, offset) {
        const { status, campus, outlet } = filters;
        const whereClause = {};
        if (status) whereClause.status = status;
        if (campus) whereClause.outlet = { campus };
        if (outlet) whereClause.outletId = outlet;

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                user: true,
                outlet: { select: safeOutletSelect },
                items: { include: { menuItem: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        return orders.map((order) => ({
            id: order.orderNumber,
            userId: order.user.id,
            userName: order.user.name || order.user.phone,
            userPhone: order.user.phone,
            campusId: order.outlet.id,
            campusName: order.outlet.campus,
            outlet: order.outlet.name,
            outletLocation: order.outlet.location,
            items: order.items.map((item) => (item.menuItem ? item.menuItem.name : 'Unknown')),
            total: `\u20B9${order.total.toFixed(0)}`,
            status: order.status.toLowerCase(),
            // ... more mapping
        }));
    }
}

export default new OrderService();
