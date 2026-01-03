
const BASE_URL = 'http://localhost:3000/api'; // Targeting Local Backend
// const BASE_URL = 'https://zordr-backend-main.onrender.com/api';

// Use an ID that exists on LOCAL backend.
// Earlier I saw 'cbit-food-court'.
const OUTLET_ID = 'cbit-food-court';

const ADMIN_EMAIL = 'admin@zordr.com';
const ADMIN_PASSWORD = 'Admin@123';

async function main() {
    console.log(`Checking endpoints for Outlet ID: ${OUTLET_ID} on ${BASE_URL}`);

    // 0. Login Admin
    let token;
    try {
        // Try setup first
        await fetch(`${BASE_URL}/auth/setup-admin`, { method: 'POST' });

        const loginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const loginJson = await loginRes.json();
        if (loginJson.success) {
            token = loginJson.token;
            console.log('✅ Admin Logged In');
        } else {
            console.error('❌ Admin Login Failed:', loginJson.message);
            return; // Cannot proceed
        }
    } catch (e) {
        console.error('❌ Admin Login Error:', e.message);
        return;
    }

    // 1. Check Outlet Details
    try {
        const res = await fetch(`${BASE_URL}/outlets/${OUTLET_ID}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        console.log(`GET /outlets/${OUTLET_ID}:`, json.success ? '✅ Success' : '❌ Failed', json.message || '');
    } catch (e) {
        console.log(`GET /outlets/${OUTLET_ID}: ❌ Network/Server Error`, e.message);
    }

    // 2. Check Menu (The Route I Fixed)
    try {
        // Note: This route is optionalAuth so it should work without token, but good to check.
        const res = await fetch(`${BASE_URL}/menu/outlet/${OUTLET_ID}`);
        // Handle HTML 404
        if (res.headers.get('content-type')?.includes('text/html')) {
            console.log(`GET /menu/outlet/${OUTLET_ID}: ❌ Failed (Returned HTML, likely 404)`);
        } else {
            const json = await res.json();
            console.log(`GET /menu/outlet/${OUTLET_ID}:`, json.success ? '✅ Success' : '❌ Failed', json.message || '');
            if (json.data) console.log('  Items found:', json.data.length);
        }
    } catch (e) {
        console.log(`GET /menu/outlet/${OUTLET_ID}: ❌ Network/Server Error`, e.message);
    }

    // 3. Check Finance
    try {
        const res = await fetch(`${BASE_URL}/finance/revenue-by-outlet`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        console.log(`GET /finance/revenue-by-outlet:`, json.success ? '✅ Success' : '❌ Failed', json.message || '');
    } catch (e) {
        console.log(`GET /finance/revenue-by-outlet: ❌ Network/Server Error`, e.message);
    }
}

main();
