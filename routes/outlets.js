import express from 'express';

import { optionalAuth, authenticateToken } from '../middleware/auth.js';

const router = express.Router();
import prisma from '../lib/prisma.js';
import upload from '../middleware/upload.js';

// Get all outlets (with optional campus filter)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { campus, isOpen } = req.query;

    const whereClause = {};

    // Filter by campus if provided
    if (campus) {
      whereClause.campus = campus;
    }

    // Filter by open status if specified
    if (isOpen !== undefined) {
      whereClause.isOpen = isOpen === 'true';
    }

    // Define safe select fields (excluding printerSettings which is missing in DB)
    const safeSelect = {
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
      paymentFrequency: true,       // Assuming these might exist from migration
      preferredPaymentMethod: true  // Assuming these might exist from migration
    };

    const outlets = await prisma.outlet.findMany({
      where: whereClause,
      select: safeSelect,
      orderBy: [
        { isOpen: 'desc' }, // Open outlets first
        { name: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: outlets,
    });
  } catch (error) {
    console.error('Get outlets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching outlets',
    });
  }
});

// Create new outlet
router.post('/', authenticateToken, upload.array('documents'), async (req, res) => {
  try {
    console.log('[DEBUG] POST /outlets Content-Type:', req.headers['content-type']);
    if (req.files) console.log('[DEBUG] Files:', req.files.length);
    if (req.body) console.log('[DEBUG] Body Keys:', Object.keys(req.body));

    // Check permissions
    if (!['ADMIN', 'SUPER_ADMIN', 'PARTNER_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let {
      name,
      campus,
      image,
      location,
      contactPhone,
      prepTime,
      isOpen,
      rating,
      commissionRate
    } = req.body;

    // Auto-clean variables
    name = name?.trim();
    campus = campus?.trim();
    location = location?.trim();
    contactPhone = contactPhone?.trim();
    prepTime = prepTime?.trim();

    if (!name || !campus || !location) {
      return res.status(400).json({ success: false, message: 'Name, Campus, and Location are required' });
    }

    // Process Uploaded Documents
    let documentUrls = [];
    if (req.files && req.files.length > 0) {
      // Construct public URL. Assuming server serves 'public' folder at root or specific path.
      // We will configure static serving in server.js next.
      // URL format: /uploads/filename
      documentUrls = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Optional: Check if campus exists (for data integrity), but we allow string linkage for flexibility
    // const campusExists = await prisma.campus.findUnique({ where: { name: campus } });

    const newOutlet = await prisma.outlet.create({
      data: {
        name,
        campus, // Link by string name as per schema
        image: image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', // Default placeholder
        location,
        contactPhone: contactPhone || '',
        prepTime: prepTime || '15 mins',
        isOpen: isOpen !== undefined ? (isOpen === 'true' || isOpen === true) : true, // Handle string 'true' from formData
        rating: parseFloat(rating) || 0,
        commissionRate: parseFloat(commissionRate) || 10.0,
        documents: documentUrls,
        operatingHours: {
          "Monday": { "isOpen": true, "openTime": "09:00", "closeTime": "22:00" },
          "Tuesday": { "isOpen": true, "openTime": "09:00", "closeTime": "22:00" },
          "Wednesday": { "isOpen": true, "openTime": "09:00", "closeTime": "22:00" },
          "Thursday": { "isOpen": true, "openTime": "09:00", "closeTime": "22:00" },
          "Friday": { "isOpen": true, "openTime": "09:00", "closeTime": "22:00" },
          "Saturday": { "isOpen": true, "openTime": "09:00", "closeTime": "22:00" },
          "Sunday": { "isOpen": true, "openTime": "09:00", "closeTime": "22:00" },
          "slotInterval": 30, // Default 30 min - Partner can change in Settings
          "maxOrdersPerSlot": 20, // Default 20 orders - Partner can change in Settings
          "scheduledOrders": true
        } // Default hours
      },
    });

    // AUTO-CREATE PARTNER MANAGER ACCOUNT
    let partnerUser = null;
    let userCreated = false;

    if (contactPhone) {
      try {
        // Check if user exists with this phone number
        partnerUser = await prisma.user.findUnique({
          where: { phone: contactPhone }
        });

        if (partnerUser) {
          // User exists - update to link with outlet and ensure proper role
          console.log(`[OUTLET] User ${contactPhone} already exists. Linking to outlet ${newOutlet.id}`);

          // Only upgrade to PARTNER_MANAGER if they're currently a USER
          const shouldUpgradeRole = partnerUser.role === 'USER';

          partnerUser = await prisma.user.update({
            where: { phone: contactPhone },
            data: {
              outletId: newOutlet.id,
              ...(shouldUpgradeRole ? { role: 'PARTNER_MANAGER' } : {})
            }
          });

          console.log(`[OUTLET] User linked. Role: ${partnerUser.role}`);
        } else {
          // User doesn't exist - create new partner manager
          console.log(`[OUTLET] Creating new PARTNER_MANAGER for ${contactPhone}`);

          const bcrypt = await import('bcryptjs');
          const hashedPassword = await bcrypt.default.hash('Partner@123', 10);

          partnerUser = await prisma.user.create({
            data: {
              phone: contactPhone,
              name: `${name} Manager`,
              role: 'PARTNER_MANAGER',
              password: hashedPassword,
              outletId: newOutlet.id,
              isActive: true
            }
          });

          userCreated = true;
          console.log(`[OUTLET] ✅ Partner account created with default password: Partner@123`);
        }
      } catch (userError) {
        console.error('[OUTLET] Error managing partner user:', userError);
        // Don't fail the outlet creation if user creation fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Outlet created successfully',
      data: newOutlet,
      partnerAccount: partnerUser ? {
        created: userCreated,
        phone: partnerUser.phone,
        role: partnerUser.role,
        ...(userCreated ? { defaultPassword: 'Partner@123' } : {})
      } : null
    });
  } catch (error) {
    console.error('Create outlet error:', error);
    res.status(500).json({ success: false, message: 'Error creating outlet' });
  }
});

// Get single outlet by ID
router.get('/:outletId', optionalAuth, async (req, res) => {
  try {
    const { outletId } = req.params;

    const safeSelect = {
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
      preferredPaymentMethod: true,
      // Relations
      menu: {
        where: { isAvailable: true },
        take: 10,
        select: { // Also safe select for menu if needed, but usually fine
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          category: true,
          isVeg: true,
          isAvailable: true,
          isReadyToPick: true, // Hope this exists
          isDeal: true,
          discount: true,
          prepTime: true
        }
      }
    };

    // Use findUnique but we must satisfy Prisma type check.
    // Actually findUnique + select is valid.
    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId },
      select: safeSelect
    });

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found',
      });
    }

    res.json({
      success: true,
      data: outlet,
    });
  } catch (error) {
    console.error('Get outlet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching outlet',
    });
  }
});

// Get outlets by campus
router.get('/campus/:campus', optionalAuth, async (req, res) => {
  try {
    const { campus } = req.params;

    const safeSelect = {
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

    const outlets = await prisma.outlet.findMany({
      where: { campus },
      select: safeSelect,
      orderBy: [{ isOpen: 'desc' }, { name: 'asc' }],
    });

    res.json({
      success: true,
      data: outlets,
      meta: {
        campus,
        count: outlets.length,
      },
    });
  } catch (error) {
    console.error('Get campus outlets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campus outlets',
    });
  }
});

// Get available campuses
router.get('/meta/campuses', async (req, res) => {
  try {
    const campuses = await prisma.outlet.groupBy({
      by: ['campus'],
      _count: {
        campus: true,
      },
    });

    const formattedCampuses = campuses.map((c) => ({
      name: c.campus,
      outletCount: c._count.campus,
    }));

    res.json({
      success: true,
      data: formattedCampuses,
    });
  } catch (error) {
    console.error('Get campuses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campuses',
    });
  }
});

// Get outlet time slots with availability
router.get('/:outletId/slots', optionalAuth, async (req, res) => {
  try {
    const { outletId } = req.params;
    const { includePast } = req.query;
    console.log(`[SLOT_DEBUG] Fetching slots for ${outletId}. IncludePast: ${includePast}`);

    // 1. Get Outlet Settings (Opening/Closing Time)
    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId },
      select: { operatingHours: true, isOpen: true },
    });

    if (!outlet) {
      return res.status(404).json({ success: false, message: 'Outlet not found' });
    }

    // If manually closed via switch, return no slots (UNLESS it's the partner asking)
    if (!outlet.isOpen && includePast !== 'true') {
      return res.json({ success: true, data: [] });
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // BUFFER: Advanced timing by 10 minutes
    // timezone fix: Convert UTC to IST
    const nowUtc = new Date();
    const now = new Date(nowUtc.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    now.setMinutes(now.getMinutes() + 10);

    const currentDay = days[now.getDay()];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Default hours if not set
    let openTime = '09:00';
    let closeTime = '22:00';
    let isTodayClosed = false;

    if (outlet.operatingHours && outlet.operatingHours[currentDay]) {
      const daySettings = outlet.operatingHours[currentDay];
      if (!daySettings.isOpen) {
        isTodayClosed = true;
      } else {
        openTime = daySettings.openTime || '09:00';
        closeTime = daySettings.closeTime || '22:00';
      }
    }



    // Parse "HH:MM" to integers
    let [openH, openM] = openTime.split(':').map(Number);
    let [closeH, closeM] = closeTime.split(':').map(Number);

    console.log(`[SLOT_DEBUG] Initial State -> OutletOpen: ${outlet.isOpen}, Day: ${currentDay}, DayClosed: ${isTodayClosed}, Time: ${openTime}-${closeTime}`);

    // --- FIX 1: MASTER SWITCH OVERRIDE ---
    // If Global Switch is ON, force the day to be Open
    if (outlet.isOpen) {
      isTodayClosed = false;
    }

    console.log(`[SLOT_DEBUG] Final State -> DayClosed: ${isTodayClosed}`);

    if (isTodayClosed) {
      return res.json({ success: true, data: [] });
    }

    // --- FIX 2: OVERNIGHT LOGIC ---
    // If Close Time is smaller than OR EQUAL TO Open Time (e.g. 2 AM < 10 AM, or 00:00 == 00:00), 
    // assume it ends the next day (24h shift).
    if (closeH <= openH) {
      closeH += 24;
    }

    // --- FIX 3: EARLY OPEN LOGIC ---
    // If Global Switch is ON, and current time is BEFORE scheduled open, 
    // assume we are opening early (now).
    if (outlet.isOpen && currentHour < openH) {
      openH = currentHour;
      openM = currentMinute; // Approximate start to now
    }

    // Parse dynamic settings with fallbacks
    const SLOT_INTERVAL_MIN = outlet.operatingHours?.slotInterval
      ? parseInt(outlet.operatingHours.slotInterval)
      : 15;
    const MAX_ORDERS_PER_SLOT = outlet.operatingHours?.maxOrdersPerSlot
      ? parseInt(outlet.operatingHours.maxOrdersPerSlot)
      : 20;

    let startHour, startMinute;

    if (includePast === 'true') {
      // Return ALL slots for the day (Partner View)
      startHour = openH;
      startMinute = openM;
      // Ensure start minute aligns with interval
      startMinute = Math.ceil(startMinute / SLOT_INTERVAL_MIN) * SLOT_INTERVAL_MIN;
      if (startMinute >= 60) {
        startHour++;
        startMinute = 0;
      }
    } else {
      // Return FUTURE slots (Customer View)
      startHour = currentHour;
      startMinute = Math.ceil(currentMinute / SLOT_INTERVAL_MIN) * SLOT_INTERVAL_MIN;

      if (startMinute >= 60) {
        startHour++;
        startMinute = 0;
      }

      // If current time is before opening time, start at opening time
      if (startHour < openH || (startHour === openH && startMinute < openM)) {
        startHour = openH;
        startMinute = openM;
        startMinute = Math.ceil(startMinute / SLOT_INTERVAL_MIN) * SLOT_INTERVAL_MIN;
        if (startMinute >= 60) {
          startHour++;
          startMinute = 0;
        }
      }
    }

    // If past closing time
    if (startHour > closeH || (startHour === closeH && startMinute >= closeM)) {
      return res.json({ success: true, data: [] });
    }

    // 2. Generate Slots
    const slots = [];
    let h = startHour;
    let m = startMinute;

    // Loop until closing time
    while (h < closeH || (h === closeH && m < closeM)) {
      // Format time string "HH:MM am/pm"
      const date = new Date();
      date.setHours(h);
      date.setMinutes(m);
      const hh = date.getHours().toString().padStart(2, '0');
      const mm = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hh}:${mm}`;

      slots.push({
        time: timeString,
        hour: hh,
        minute: mm,
      });

      // Increment
      m += SLOT_INTERVAL_MIN;
      if (m >= 60) {
        h++;
        m = 0;
      }
    }

    // 3. Check Availability for each slot
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const activeOrders = await prisma.order.findMany({
      where: {
        outletId: outletId,
        createdAt: { gte: todayStart },
        status: { in: ['new', 'confirmed', 'preparing', 'ready'] }, // Only count active orders
      },
      select: { pickupTime: true },
    });

    const slotCounts = {};
    activeOrders.forEach((o) => {
      if (o.pickupTime) {
        slotCounts[o.pickupTime.toLowerCase()] = (slotCounts[o.pickupTime.toLowerCase()] || 0) + 1;
      }
    });

    // 4. Format Response
    console.log(`[SLOT_DEBUG] Generated ${slots.length} slots. Returning response.`);
    const responseSlots = slots.map((slot) => {
      const count = slotCounts[slot.time] || 0;
      return {
        time: slot.time,
        available: count < MAX_ORDERS_PER_SLOT,
        remaining: Math.max(0, MAX_ORDERS_PER_SLOT - count),
        isHighTraffic: count >= MAX_ORDERS_PER_SLOT - 5,
      };
    });

    res.json({
      success: true,
      data: responseSlots,
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching time slots',
    });
  }
});

// Update Outlet Status (Open/Close)
router.put('/:outletId/status', authenticateToken, async (req, res) => {
  try {
    const { outletId } = req.params;
    const { isOpen } = req.body;

    // Verify role
    if (!['PARTNER_MANAGER', 'PARTNER_STAFF', 'ADMIN', 'SUPER_ADMIN', 'OUTLET_OWNER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Verify outlet ownership
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.outletId !== outletId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized for this outlet' });
    }

    const updatedOutlet = await prisma.outlet.update({
      where: { id: outletId },
      data: { isOpen },
      select: { id: true, isOpen: true, name: true, autoConfirm: true }
    });

    res.json({
      success: true,
      message: `Outlet is now ${isOpen ? 'OPEN' : 'CLOSED'}`,
      data: updatedOutlet,
    });
  } catch (error) {
    console.error('Update outlet status error:', error);
    res.status(500).json({ success: false, message: 'Error updating status' });
  }
});

// Update Outlet Details (Profile)
router.put('/:outletId', authenticateToken, async (req, res) => {
  try {
    const { outletId } = req.params;
    let { contactPhone, location, operatingHours, prepTime } = req.body;

    // Auto-clean variables
    contactPhone = contactPhone?.trim();
    location = location?.trim();
    prepTime = prepTime?.trim();

    // Verify role (Only Managers and Admins)
    if (!['PARTNER_MANAGER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Verify outlet ownership
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.outletId !== outletId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized for this outlet' });
    }

    const updatedOutlet = await prisma.outlet.update({
      where: { id: outletId },
      data: {
        contactPhone,
        location,
        contactPhone,
        location,
        operatingHours,
        prepTime, // Added prepTime support
      },
      select: {
        id: true,
        contactPhone: true,
        location: true,
        operatingHours: true,
        prepTime: true,
        name: true
      }
    });

    res.json({ success: true, message: 'Outlet details updated', data: updatedOutlet });
  } catch (error) {
    console.error('Update outlet details error:', error);
    res.status(500).json({ success: false, message: 'Error updating details' });
  }
});

// Toggle outlet status (open/close)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'SUPER_ADMIN' &&
      req.user.role !== 'OUTLET_OWNER'
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const { id } = req.params;
    const { isOpen } = req.body;
    const outlet = await prisma.outlet.update({
      where: { id },
      data: { isOpen },
      select: { id: true, isOpen: true, name: true }
    });
    res.json({
      success: true,
      message: `Outlet ${isOpen ? 'opened' : 'closed'} successfully`,
      data: outlet,
    });
  } catch (error) {
    console.error('Toggle outlet status error:', error);
    res.status(500).json({ success: false, message: 'Error updating outlet status' });
  }
});

// Toggle auto-confirm status
router.put('/:id/auto-confirm', authenticateToken, async (req, res) => {
  try {
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'OUTLET_OWNER', 'PARTNER_MANAGER', 'PARTNER_STAFF'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { autoConfirm } = req.body;

    const outlet = await prisma.outlet.update({
      where: { id },
      data: { autoConfirm },
      select: {
        id: true,
        autoConfirm: true,
        name: true,
        isOpen: true
      }
    });

    res.json({
      success: true,
      message: `Auto-confirm ${autoConfirm ? 'enabled' : 'disabled'} successfully`,
      data: outlet,
    });
  } catch (error) {
    console.error('Toggle auto-confirm error:', error);
    res.status(500).json({ success: false, message: 'Error updating auto-confirm settings' });
  }
});

export default router;
