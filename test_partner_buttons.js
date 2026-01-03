
import http from 'http';

const BASE_URL = 'http://localhost:3001/api';

function request(method, endpoint, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/api${endpoint}`,
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function assert(condition, message) {
    if (condition) console.log(`✅ ${message}`);
    else console.error(`❌ ${message}`);
}

async function runTests() {
    console.log('🚀 TESTING PARTNER APP BUTTONS (Using 9999999901)\n');

    // 1. PARTNER LOGIN (Using OTP 123456)
    console.log('🔹 [SETUP] Partner Login (Main Canteen Manager)...');

    // Send OTP (to ensure flow is valid, even if we mock verify)
    await request('POST', '/auth/send-otp', { phone: '9999999901' });

    const loginRes = await request('POST', '/auth/partner/login', {
        phone: '9999999901',
        otp: '123456'
    });

    const partnerToken = loginRes.body.token;
    if (!partnerToken) {
        console.error('❌ Login Failed. User might not exist or OTP wrong.', loginRes.body);
        return;
    }
    console.log(`✅ Logged in as: ${loginRes.body.user.name} (${loginRes.body.user.role})`);
    console.log(`   Outlet: ${loginRes.body.user.outletName} (ID: ${loginRes.body.user.outletId})`);

    // 2. TEST MENU BUTTONS
    console.log('\n🔹 [MENU] Add Item');
    const itemRes = await request('POST', '/menu/partner/menu', {
        name: `TestDish_${Date.now()}`,
        category: 'Snacks',
        price: 99,
        veg: true,
        description: 'Automated Test Dish',
        prepTime: 5
    }, partnerToken);

    // Check Result
    if (itemRes.status === 200 || itemRes.status === 201) {
        console.log('✅ Add Item Success');
        const itemId = itemRes.body.data.id;

        console.log('🔹 [MENU] Toggle Availability');
        const toggle = await request('PUT', `/menu/partner/menu/${itemId}`, { available: false }, partnerToken);

        // Backend returns raw object (isAvailable), Frontend maps this on GET. Test checks Raw.
        if (toggle.status === 200 && (toggle.body.data.available === false || toggle.body.data.isAvailable === false)) {
            console.log('✅ Toggle Success');
        } else {
            console.error('❌ Toggle Failed', JSON.stringify(toggle.body, null, 2));
        }

        // Clean up (optional, but good practice)
        await request('DELETE', `/menu/partner/menu/${itemId}`, null, partnerToken);
        console.log('🔹 [CLEANUP] Deleted Test Item');

    } else {
        console.error('❌ Add Item Failed', itemRes.body);
    }

    // 3. TEST OFFERS BUTTONS
    console.log('\n🔹 [OFFERS] Create Offer');
    const offerCode = `TEST${Date.now().toString().slice(-4)}`;
    const offerRes = await request('POST', '/offers/partner/offers', {
        code: offerCode,
        value: 15,
        name: 'Auto Test Offer',
        validity: '2025-12-31'
    }, partnerToken);

    if (offerRes.status === 200 || offerRes.status === 201) {
        console.log('✅ Create Offer Success');
        const offerId = offerRes.body.data.id;
        await request('DELETE', `/offers/partner/offers/${offerId}`, null, partnerToken);
        console.log('🔹 [CLEANUP] Deleted Test Offer');
    } else {
        console.error('❌ Create Offer Failed', offerRes.body);
    }

    // 4. TEST PROFILE UPDATE (Settings)
    console.log('\n🔹 [PROFILE] Update Details');
    const profileRes = await request('PUT', `/outlets/${loginRes.body.user.outletId}`, {
        prepTime: '20 mins'
    }, partnerToken);
    assert(profileRes.status === 200, 'Update Outlet Profile (Prep Time)');

    console.log('\n✅ PARTNER TEST COMPLETED');
}

runTests();
