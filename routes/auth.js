import express from 'express';
import jwt from 'jsonwebtoken';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
import prisma from '../lib/prisma.js';

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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and OTP management
 */

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to phone
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */


// Temporary OTP Store (Use Redis in production)
const otpStore = new Map();

// Generate JWT
const generateToken = (userId, phone, role) => {
  return jwt.sign({ userId, phone, role }, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: '7d',
  });
};

// 1. SEND OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res.status(400).json({ success: false, message: 'Phone number is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, { code: otp, expires: Date.now() + 300000 }); // 5 min expiry

    console.log(`📲 [MOCK SMS] To: ${phone} | OTP: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      debug_otp: otp, // Remove in production
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// 2. VERIFY OTP (Login or Signup)
/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP and Login/Signup
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns token
 */
router.post('/verify-otp', async (req, res) => {
  try {
    // Frontend can send name/email if this is a Registration flow
    const { phone, otp, name, email } = req.body;

    if (!phone || !otp)
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });

    // Validate OTP
    const storedData = otpStore.get(phone);

    // Magic OTP for testing
    const isMagicOtp = otp === '123456';

    if (!isMagicOtp && (!storedData || storedData.code !== otp)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    otpStore.delete(phone); // Clear OTP after use

    // Find User
    let user = await prisma.user.findUnique({ where: { phone } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Create New User (Save Email/Name if provided)
      user = await prisma.user.create({
        data: {
          phone,
          name: name || 'Foodie',
          email: email || null, // Save email here if provided!
          role: 'USER',
          zCoins: 0,
        },
      });
    }

    // Generate Token
    const token = generateToken(user.id, user.phone, user.role);

    res.json({
      success: true,
      message: isNewUser ? 'Welcome to Zordr!' : 'Welcome back!',
      data: {
        user,
        token,
        isNewUser,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// 3. PARTNER LOGIN (Strict Role Check)
router.post('/partner/login', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp)
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });

    // Validate OTP
    const storedData = otpStore.get(phone);

    // Magic OTP for testing
    const isMagicOtp = otp === '123456';

    if (!isMagicOtp && (!storedData || storedData.code !== otp)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (storedData) otpStore.delete(phone); // Clear OTP

    // Find User
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { outlet: { select: safeOutletSelect } }, // Include outlet details
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Partner account not found. Please contact admin.' });
    }

    // Check Role
    if (user.role !== 'PARTNER_MANAGER' && user.role !== 'PARTNER_STAFF' && user.role !== 'ADMIN') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized access. Partner role required.' });
    }

    // Generate Token
    const token = generateToken(user.id, user.phone, user.role);

    res.json({
      success: true,
      message: 'Partner login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        outletId: user.outletId,
        outletName: user.outlet?.name,
        notificationPreferences: user.notificationPreferences
      },
    });
  } catch (error) {
    console.error('Partner login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// 4. ADMIN LOGIN (Password-based)
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Find admin user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { outlet: { select: safeOutletSelect } },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    // Check Role - Must be ADMIN or SUPER_ADMIN
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized. Admin access required.' });
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.default.compare(password, user.password || '');

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate Token
    const token = generateToken(user.id, user.phone, user.role);

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        outletId: user.outletId,
        outletName: user.outlet?.name,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// 5. ONE-TIME MIGRATION - Run Database Migration
router.post('/migrate-schema', async (req, res) => {
  try {
    // Import exec to run shell commands
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Run Prisma db push
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss');

    res.json({
      success: true,
      message: 'Database migration completed successfully!',
      output: stdout,
      errors: stderr || 'None',
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      stderr: error.stderr,
    });
  }
});

// 6. ONE-TIME SETUP - Create Super Admin (Remove after use!)
router.post('/setup-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@zordr.com' },
    });

    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Super admin already exists!',
        admin: {
          email: existingAdmin.email,
          role: existingAdmin.role,
        },
      });
    }

    // Create super admin
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('Admin@123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@zordr.com',
        phone: '9999999999',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        password: hashedPassword,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: 'Super admin created successfully!',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      credentials: {
        email: 'admin@zordr.com',
        password: 'Admin@123',
      },
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to create admin', error: error.message });
  }
});

export default router;
