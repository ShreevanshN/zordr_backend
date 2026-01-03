import MenuService from '../services/menuService.js';

class MenuController {
    async getMenu(req, res) {
        try {
            const { outletId, category } = req.query;
            const data = await MenuService.getMenu(outletId, category);
            res.json({ success: true, data });
        } catch (error) {
            if (error.message.includes('required')) return res.status(400).json({ success: false, message: error.message });
            console.error(error);
            res.status(500).json({ success: false, message: 'Error fetching menu' });
        }
    }

    async getAllItems(req, res) {
        try {
            const { category, search, outletId, limit = 50, offset = 0 } = req.query;
            const items = await MenuService.getAllItems(
                { category, search, outletId },
                parseInt(limit),
                parseInt(offset)
            );
            res.json({ success: true, data: items });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error fetching items' });
        }
    }

    async getItemById(req, res) {
        try {
            const { id } = req.params;
            const item = await MenuService.getItemById(id);
            if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
            res.json({ success: true, data: item });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching item' });
        }
    }

    async createItem(req, res) {
        try {
            const newItem = await MenuService.createItem(req.body, req.user);
            res.status(201).json({ success: true, message: 'Item created successfully', data: newItem });
        } catch (error) {
            if (error.message === 'Unauthorized' || error.message.includes('Unauthorized')) {
                return res.status(403).json({ success: false, message: error.message });
            }
            console.error(error);
            res.status(500).json({ success: false, message: 'Error creating item' });
        }
    }

    async updateItem(req, res) {
        try {
            const { id } = req.params;
            const updatedItem = await MenuService.updateItem(id, req.body, req.user);
            res.json({ success: true, message: 'Item updated successfully', data: updatedItem });
        } catch (error) {
            if (error.message === 'Item not found') return res.status(404).json({ success: false, message: error.message });
            if (error.message === 'Unauthorized') return res.status(403).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: 'Error updating item' });
        }
    }

    async deleteItem(req, res) {
        try {
            const { id } = req.params;
            const result = await MenuService.deleteItem(id, req.user);
            res.json({ success: true, message: result.message });
        } catch (error) {
            if (error.message === 'Item not found') return res.status(404).json({ success: false, message: error.message });
            if (error.message === 'Unauthorized') return res.status(403).json({ success: false, message: error.message });
            res.status(500).json({ success: false, message: 'Error deleting item' });
        }
    }

    async getCategories(req, res) {
        try {
            const { outletId } = req.query;
            const categories = await MenuService.getCategories(outletId);
            res.json({ success: true, data: categories });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching categories' });
        }
    }

    async getDeals(req, res) {
        try {
            const { outletId } = req.query;
            const deals = await MenuService.getDeals(outletId);
            res.json({ success: true, data: deals });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error fetching deals' });
        }
    }
}

export default new MenuController();
