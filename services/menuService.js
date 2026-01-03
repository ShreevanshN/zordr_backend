import prisma from '../lib/prisma.js';
import NodeCache from 'node-cache';
const menuCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

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

class MenuService {
    async getMenu(outletId, category) {
        if (!outletId) {
            throw new Error('outletId query parameter is required');
        }

        const cacheKey = `menu:${outletId}:${category || 'All'}`;
        const cachedData = menuCache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const whereClause = {
            outletId: outletId,
            isAvailable: true,
        };

        if (category && category !== 'All') {
            whereClause.category = category;
        }

        const items = await prisma.menuItem.findMany({
            where: whereClause,
            orderBy: { category: 'asc' },
        });

        // Get Unique Categories for this specific outlet
        const categoriesGroup = await prisma.menuItem.groupBy({
            by: ['category'],
            where: {
                outletId: outletId,
                isAvailable: true,
            },
        });
        const categories = ['All', ...categoriesGroup.map((c) => c.category)];

        const formattedItems = items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            rating: 4.5,
            image: item.image,
            category: item.category,
            isPopular: false,
            isVeg: item.isVeg,
            isDeal: item.isDeal,
            isReadyToPick: item.isReadyToPick,
            discount: item.discount,
            originalPrice: item.originalPrice,
        }));

        const responseData = {
            outletId,
            items: formattedItems,
            categories,
        };

        menuCache.set(cacheKey, responseData);
        return responseData;
    }

    async getAllItems(filters, limit, offset) {
        const { category, search, outletId } = filters;
        const whereClause = {};

        if (outletId) whereClause.outletId = outletId;
        if (category && category !== 'All') whereClause.category = category;
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const items = await prisma.menuItem.findMany({
            where: whereClause,
            include: { outlet: { select: safeOutletSelect } },
            orderBy: { name: 'asc' },
            take: limit,
            skip: offset,
        });

        return items.map((item) => ({
            ...item,
            outletName: item.outlet ? item.outlet.name : 'Unknown',
        }));
    }

    async getItemById(id) {
        const item = await prisma.menuItem.findUnique({
            where: { id },
            include: { outlet: { select: safeOutletSelect } },
        });
        return item;
    }

    async createItem(itemData, user) {
        // Only Admin or Partner Manager/Staff can create
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            // If partner, can only add to their outlet
            if (
                (user.role === 'PARTNER_MANAGER' || user.role === 'PARTNER_STAFF') &&
                user.outletId !== itemData.outletId
            ) {
                throw new Error('Unauthorized to add items to this outlet');
            }
        }

        const newItem = await prisma.menuItem.create({
            data: {
                name: itemData.name,
                description: itemData.description,
                price: parseFloat(itemData.price),
                category: itemData.category,
                image:
                    itemData.image ||
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
                isVeg: itemData.isVeg || false,
                isAvailable: itemData.isAvailable !== undefined ? itemData.isAvailable : true,
                isReadyToPick: itemData.isReadyToPick || false,
                outletId: itemData.outletId, // Must be provided
            },
        });

        this.invalidateCache(newItem.outletId);
        return newItem;
    }

    async updateItem(id, updateData, user) {
        const existingItem = await prisma.menuItem.findUnique({ where: { id } });
        if (!existingItem) throw new Error('Item not found');

        // Auth logic
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            if (
                (user.role === 'PARTNER_MANAGER' || user.role === 'PARTNER_STAFF') &&
                user.outletId !== existingItem.outletId
            ) {
                throw new Error('Unauthorized');
            }
        }

        const data = {};
        if (updateData.name) data.name = updateData.name;
        if (updateData.description) data.description = updateData.description;
        if (updateData.price) data.price = parseFloat(updateData.price);
        if (updateData.category) data.category = updateData.category;
        if (updateData.veg !== undefined) data.isVeg = updateData.veg;
        if (updateData.available !== undefined) data.isAvailable = updateData.available;
        if (updateData.image) data.image = updateData.image;
        if (updateData.readyToPick !== undefined) data.isReadyToPick = updateData.readyToPick;

        const updatedItem = await prisma.menuItem.update({
            where: { id },
            data: data,
        });

        this.invalidateCache(updatedItem.outletId);
        return updatedItem;
    }

    async deleteItem(id, user) {
        const existingItem = await prisma.menuItem.findUnique({ where: { id } });
        if (!existingItem) throw new Error('Item not found');

        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            if (
                (user.role === 'PARTNER_MANAGER' || user.role === 'PARTNER_STAFF') &&
                user.outletId !== existingItem.outletId
            ) {
                throw new Error('Unauthorized');
            }
        }

        await prisma.menuItem.delete({ where: { id } });
        this.invalidateCache(existingItem.outletId);
        return { message: 'Item deleted successfully' };
    }

    async getCategories(outletId) {
        const whereClause = {};
        if (outletId) whereClause.outletId = outletId;

        const categories = await prisma.menuItem.groupBy({
            by: ['category'],
            where: whereClause,
        });

        return categories.map((c) => c.category);
    }

    async getDeals(outletId) {
        const whereClause = { isDeal: true, isAvailable: true };
        if (outletId) whereClause.outletId = outletId;

        const deals = await prisma.menuItem.findMany({
            where: whereClause,
            include: { outlet: { select: safeOutletSelect } },
        });

        return deals.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            category: item.category,
            isVeg: item.isVeg,
            isDeal: item.isDeal,
            isReadyToPick: item.isReadyToPick,
            discount: item.discount,
            originalPrice: item.originalPrice,
            outletId: item.outletId,
            outletName: item.outlet ? item.outlet.name : 'Unknown',
            rating: 4.5
        }));
    }

    // Helper
    invalidateCache(outletId) {
        const keys = menuCache.keys();
        const outletKeys = keys.filter((k) => k.startsWith(`menu:${outletId}`));
        menuCache.del(outletKeys);
    }
}

export default new MenuService();
