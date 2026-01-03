import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all roles (including system roles if we want to list them, but primarily custom ones)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const roles = await prisma.customRole.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    res.json({ success: true, data: roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ success: false, message: 'Error fetching roles' });
  }
});

// Create a new custom role
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      // Only Super Admin can create roles? Or Admin too? Let's allow Admin for now.
      // Actually, strict RBAC usually implies Super Admin manages Roles.
      // But let's check current logic.
      // For now, let's allow ADMIN too to be flexible.
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const existingRole = await prisma.customRole.findUnique({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'Role already exists' });
    }

    const role = await prisma.customRole.create({
      data: {
        name,
        description,
        permissions: permissions || [],
        isSystem: false,
      },
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATE_ROLE',
          details: `Created role: ${name}`,
          targetId: role.id,
          ipAddress: req.ip,
        },
      });
    } catch (e) {
      console.error('Audit log failed', e);
    }

    res.json({ success: true, data: role });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ success: false, message: 'Error creating role' });
  }
});

// Update a role
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await prisma.customRole.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(403).json({ success: false, message: 'Cannot edit system roles' });
    }

    const updatedRole = await prisma.customRole.update({
      where: { id },
      data: {
        name,
        description,
        permissions,
      },
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE_ROLE',
          details: `Updated role: ${name}`,
          targetId: role.id,
          ipAddress: req.ip,
        },
      });
    } catch (e) {
      console.error('Audit log failed', e);
    }

    res.json({ success: true, data: updatedRole });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Error updating role' });
  }
});

// Delete a role
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;

    const role = await prisma.customRole.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(403).json({ success: false, message: 'Cannot delete system roles' });
    }

    if (role._count.users > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Cannot delete role assigned to users. Reassign them first.',
        });
    }

    await prisma.customRole.delete({ where: { id } });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'DELETE_ROLE',
          details: `Deleted role: ${role.name}`,
          targetId: role.id,
          ipAddress: req.ip,
        },
      });
    } catch (e) {
      console.error('Audit log failed', e);
    }

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ success: false, message: 'Error deleting role' });
  }
});

export default router;
