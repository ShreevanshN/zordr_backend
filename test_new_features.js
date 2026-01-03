// test_new_features.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';

async function post(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // console.log(`POST ${url}`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        const data = await res.json();
        return { status: res.status, data };
    } catch (e) {
        return { status: 500, data: { success: false, message: e.message } };
    }
}

async function get(url, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // console.log(`GET ${url}`);
    try {
        const res = await fetch(url, { headers });
        const data = await res.json();
        return { status: res.status, data };
    } catch (e) {
        return { status: 500, data: { success: false, message: e.message } };
    }
}

async function runTests() {
    console.log('🚀 Starting Verification: Offers, Coupons & Invoices...\n');

    try {
        // 0. Setup: Login as Admin
        console.log('0. Authenticating as Admin...');

        const loginRes = await post(`${API_URL}/auth/admin/login`, {
            email: 'admin@zordr.com',
            password: 'Admin@123'
        });

        if (!loginRes.data.success) {
            throw new Error(`Login Failed: ${JSON.stringify(loginRes.data)}`);
        }
        const adminToken = loginRes.data.token;
        console.log('✅ Admin Authenticated\n');

        // 1. Verify Outlet Creation with Commission Rate
        console.log('1. Testing Outlet Creation (with Commission Rate)...');
        const outletData = {
            name: `Test Outlet ${Date.now()}`,
            campus: 'KITSW',
            location: 'Test Loc',
            commissionRate: 15.5 // Custom rate
        };

        const createOutletRes = await post(`${API_URL}/outlets`, outletData, adminToken);
        if (!createOutletRes.data.success) {
            throw new Error(`Create Outlet Failed: ${JSON.stringify(createOutletRes.data)}`);
        }

        const outletId = createOutletRes.data.data.id;
        // Verify DB
        const dbOutlet = await prisma.outlet.findUnique({ where: { id: outletId } });
        if (dbOutlet.commissionRate === 15.5) {
            console.log(`✅ Outlet Created. Commission Rate Verified: ${dbOutlet.commissionRate}%`);
        } else {
            console.error(`❌ Commission Rate Mismatch. Expected 15.5, got ${dbOutlet.commissionRate}`);
        }
        console.log('\n');


        // 2. Verify Admin Coupon Creation
        console.log('2. Testing Admin Coupon Creation...');
        const couponCode = `TEST${Date.now()}`;
        const couponData = {
            code: couponCode,
            value: 50,
            description: 'Test Admin Coupon',
            offerType: 'COUPON',
            outletId: null, // Platform wide
            validUntil: new Date(Date.now() + 86400000).toISOString()
        };

        // Correct URL: /api/offers/admin/offers
        const createCouponRes = await post(`${API_URL}/offers/admin/offers`, couponData, adminToken);
        if (!createCouponRes.data.success) {
            throw new Error(`Create Coupon Failed: ${JSON.stringify(createCouponRes.data)}`);
        }

        const dbCoupon = await prisma.offer.findUnique({ where: { id: createCouponRes.data.data.id } });
        if (dbCoupon.offerType === 'COUPON' && dbCoupon.source === 'ADMIN') {
            console.log(`✅ Admin Coupon Verified: Type=${dbCoupon.offerType}, Source=${dbCoupon.source}`);
        } else {
            console.error(`❌ Admin Coupon Failed: ${JSON.stringify(dbCoupon)}`);
        }
        console.log('\n');


        // 3. Setup Test Partner
        console.log('3. Setting up Test Partner...');
        const adminUser = await prisma.user.findUnique({ where: { email: 'admin@zordr.com' } });
        await prisma.user.update({
            where: { id: adminUser.id },
            data: { outletId: outletId }
        });
        console.log('   (Temporary: Linked Admin to Test Outlet)\n');


        // 4. Verify Partner Offer Creation
        console.log('4. Testing Partner Offer Creation...');
        const offerCode = `OFFER${Date.now()}`;
        const offerData = {
            name: 'Test Partner Offer',
            code: offerCode,
            value: 20,
            minOrder: 100,
            validity: new Date(Date.now() + 86400000).toISOString()
        };

        // Correct URL: /api/offers/partner/offers
        const createPartnerOfferRes = await post(`${API_URL}/offers/partner/offers`, offerData, adminToken);

        if (!createPartnerOfferRes.data.success) {
            throw new Error(`Create Partner Offer Failed: ${JSON.stringify(createPartnerOfferRes.data)}`);
        }

        const dbPartnerOffer = await prisma.offer.findUnique({ where: { id: createPartnerOfferRes.data.data.id } });
        if (dbPartnerOffer.offerType === 'OFFER' && dbPartnerOffer.source === 'PARTNER') {
            console.log(`✅ Partner Offer Verified: Type=${dbPartnerOffer.offerType}, Source=${dbPartnerOffer.source}`);
        } else {
            console.error(`❌ Partner Offer Failed: ${JSON.stringify(dbPartnerOffer)}`);
        }
        console.log('\n');


        // 5. Verify Daily Invoices
        console.log('5. Testing Daily Invoices...');
        // Seed some orders
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday

        await prisma.order.createMany({
            data: [
                {
                    orderNumber: `ORD-${Date.now()}-1`,
                    userId: adminUser.id,
                    outletId: outletId,
                    total: 100.0,
                    subtotal: 90.0, tax: 5.0, discount: 0, paymentMethod: 'UPI', status: 'delivered',
                    createdAt: pastDate
                },
                {
                    orderNumber: `ORD-${Date.now()}-2`,
                    userId: adminUser.id,
                    outletId: outletId,
                    total: 200.0,
                    subtotal: 190.0, tax: 10.0, discount: 0, paymentMethod: 'UPI', status: 'delivered',
                    createdAt: pastDate
                }
            ]
        });

        // Correct URL: /api/finance/partner/daily-invoices
        const invoiceRes = await get(`${API_URL}/finance/partner/daily-invoices`, adminToken);

        if (!invoiceRes.data.success) {
            throw new Error(`Get Invoices Failed: ${JSON.stringify(invoiceRes.data)}`);
        }

        const invoices = invoiceRes.data.data;
        const todayStr = pastDate.toISOString().split('T')[0];
        const targetInvoice = invoices.find(i => i.date === todayStr);

        if (targetInvoice) {
            console.log(`   Found Invoice for ${todayStr}: Gross=${targetInvoice.grossSales}, Net=${targetInvoice.netPayout}, Comm=${targetInvoice.commission}`);

            // Expected: Total 300. Commission 15.5% of 300 = 46.5. Net = 253.5.
            // Allowing float imprecision
            if (targetInvoice.grossSales === 300 && Math.abs(targetInvoice.commission - 46.5) < 0.1) {
                console.log('✅ Daily Invoice Calculation Verified!');
            } else {
                console.error(`❌ Invoice Calculation Mismatch. Expected Gross:300, Comm:46.5. Got Gross:${targetInvoice.grossSales}, Comm:${targetInvoice.commission}`);
            }

        } else {
            console.error(`❌ No invoice found for date ${todayStr}. Response:`, invoices);
        }


    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        // Cleanup
        const adminUser = await prisma.user.findUnique({ where: { email: 'admin@zordr.com' } });
        if (adminUser) {
            await prisma.user.update({ where: { id: adminUser.id }, data: { outletId: null } });
        }
        await prisma.$disconnect();
    }
}

runTests();
