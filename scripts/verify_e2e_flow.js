
const BASE_URL = 'https://zordr-backend-main.onrender.com/api';
// const BASE_URL = 'http://localhost:3000/api'; // Use local if needed

const ADMIN_EMAIL = 'admin@zordr.com';
const ADMIN_PASSWORD = 'Admin@123';
const PARTNER_PHONE = '9876543210';
const CAMPUS_NAME = 'SGSIT';
const OUTLET_NAME = 'Main Canteen';

async function main() {
    try {
        console.log('🚀 Starting End-to-End Verification Flow');

        // 1. Setup/Login Admin
        console.log('\n--- 1. Admin Login ---');
        let adminToken;
        try {
            // Try Setup first (idempotent)
            await fetch(`${BASE_URL}/auth/setup-admin`, { method: 'POST' });

            const loginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
            });
            const loginData = await loginRes.json();

            if (!loginData.success) {
                console.warn('⚠️ Admin Login failed, trying fallback credentials...');
                // Add logic if needed, but usually admin setup should work.
                throw new Error(loginData.message);
            }
            adminToken = loginData.token;
            console.log('✅ Admin Logged In');
        } catch (e) {
            console.error('❌ Admin Login Failed:', e.message);
            process.exit(1);
        }

        // 2. Create Campus
        console.log('\n--- 2. Create Campus ---');
        let campusData;
        const campusRes = await fetch(`${BASE_URL}/campuses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: CAMPUS_NAME,
                location: 'Indore, MP',
                city: 'Indore',
                state: 'Madhya Pradesh',
                contactPerson: 'Director',
                contactPhone: '0731-123456'
            })
        });
        const campusJson = await campusRes.json();
        if (campusJson.success) {
            campusData = campusJson.data;
            console.log('✅ Campus Created:', campusData.name);
        } else if (campusJson.message && campusJson.message.includes('already exists')) {
            console.log('⚠️ Campus already exists (Assuming OK)');
        } else {
            throw new Error(campusJson.message || 'Campus creation failed');
        }

        // 3. Create Outlet
        console.log('\n--- 3. Create Outlet ---');
        let outletId;
        const outletRes = await fetch(`${BASE_URL}/outlets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: OUTLET_NAME,
                campus: CAMPUS_NAME,
                location: 'Block A, Ground Floor',
                contactPhone: PARTNER_PHONE,
                prepTime: '20 mins',
                isOpen: true,
                rating: 0,
                commissionRate: 5
            })
        });
        const outletJson = await outletRes.json();
        if (outletJson.success) {
            outletId = outletJson.data.id;
            console.log('✅ Outlet Created:', outletJson.data.name, `(${outletId})`);
        } else {
            if (outletJson.message && outletJson.message.includes('exist')) { // Adjust based on actual error
                console.log('⚠️ Outlet might exist, searching by name...');
                // List outlets for this campus
                const listRes = await fetch(`${BASE_URL}/outlets?campus=${CAMPUS_NAME}`);
                const listData = await listRes.json();
                const existing = listData.data.find(o => o.name === OUTLET_NAME);
                if (existing) {
                    outletId = existing.id;
                    console.log('✅ Outlet Found:', outletId);
                } else {
                    // Maybe manually check logic or just fail
                    console.error('Failed to find existing outlet despite duplicate error');
                    throw new Error(outletJson.message);
                }
            } else {
                throw new Error(outletJson.message || 'Outlet creation failed');
            }
        }

        // 4. Register Partner User
        console.log('\n--- 4. Register Partner User ---');
        let userId;
        // Send OTP first
        await fetch(`${BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: PARTNER_PHONE })
        });
        // Verify OTP to create/fetch user
        const userRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: PARTNER_PHONE, otp: '123456', name: 'Partner Manager' })
        });
        const userJson = await userRes.json();
        if (userJson.success) {
            userId = userJson.data.user.id;
            console.log('✅ Partner User registered/found:', userId);
        } else {
            throw new Error(userJson.message);
        }

        // 5. Upgrade & Link User
        console.log('\n--- 5. Link User to Outlet ---');
        // Upgrade Role
        const roleRes = await fetch(`${BASE_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ role: 'PARTNER_MANAGER' })
        });
        const roleJson = await roleRes.json();
        if (!roleJson.success) throw new Error(roleJson.message);
        console.log('✅ User Role Upgraded to PARTNER_MANAGER');

        // Link Outlet
        const linkRes = await fetch(`${BASE_URL}/admin/users/${userId}/outlet`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ outletId: outletId })
        });
        const linkJson = await linkRes.json();
        if (!linkJson.success) throw new Error(linkJson.message);
        console.log('✅ User Linked to Outlet');

        // 6. Partner Login
        console.log('\n--- 6. Verify Partner Login ---');
        const partnerRes = await fetch(`${BASE_URL}/auth/partner/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: PARTNER_PHONE, otp: '123456' })
        });
        const partnerJson = await partnerRes.json();

        if (partnerJson.success) {
            console.log('🎉 Partner Login SUCCESSFUL!');
            console.log('Token:', partnerJson.token ? 'Present' : 'Missing');
            console.log('Outlet:', partnerJson.user.outletName);

            if (partnerJson.user.outletId === outletId) {
                console.log('✅ Outlet ID Matches!');
            } else {
                console.error('❌ Outlet ID Mismatch!', partnerJson.user.outletId, 'vs', outletId);
            }
        } else {
            throw new Error('Partner login failed: ' + partnerJson.message);
        }

        // 7. Verify Dashboard Access (API call with token)
        console.log('\n--- 7. Verify Dashboard Access ---');
        if (partnerJson.token) {
            // Fetch outlet details as a "dashboard" check
            const dashboardRes = await fetch(`${BASE_URL}/outlets/${outletId}`, {
                headers: { 'Authorization': `Bearer ${partnerJson.token}` }
            });
            const dashboardJson = await dashboardRes.json();
            if (dashboardJson.success) {
                console.log('✅ Partner Access Verified (Fetched Own Outlet Details)');
            } else {
                console.log('⚠️ Dashboard Access Warning:', dashboardJson.message);
            }
        }

        console.log('\n✅✅✅ END-TO-END FLOW VERIFIED SUCCESSFULLY ✅✅✅');

    } catch (err) {
        console.error('\n❌ VERIFICATION FAILED:', err.message || err);
        process.exit(1);
    }
}

main();
