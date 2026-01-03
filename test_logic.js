
import http from 'http';

const BASE_URL = 'http://localhost:3000/api';
const PHONE = '9876543210';
const OTP = '123456';

function request(method, endpoint, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
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

async function runTests() {
    console.log('🚀 TESTING LOGIC: PREP TIME & SLOTS\n');

    // LOGIN
    const loginRes = await request('POST', '/auth/verify-otp', { phone: PHONE, otp: OTP });
    const token = loginRes.body.token || loginRes.body.data.token;
    const userId = loginRes.body.user?.id || loginRes.body.data.user.id;

    // GET A MENU ITEM
    const outletsRes = await request('GET', '/outlets', null, token);
    const outletId = outletsRes.body.data[0].id;
    const menuRes = await request('GET', `/menu?outletId=${outletId}`, null, token);
    const item = menuRes.body.data.items[0]; // Just picking first
    const itemId = item.id;

    console.log(`Testing with Item: ${item.name} (${itemId})`);

    // 1. TEST STANDARD ORDER (Assume it's not ready-to-pick initially, or we force update)
    // Actually, I can't easily force update item properties from customer API.
    // I won't update the item. I'll just check what the logic produces.
    // If it's a standard item (Ice Cream?), might be ready-to-pick?

    // Let's CREATE A ORDER and check the estimated time returned.
    const start = Date.now();
    const orderRes = await request('POST', '/orders', {
        items: [{ id: itemId, quantity: 1 }],
        outletId: outletId,
        paymentMethod: 'COD'
    }, token);

    if (orderRes.status === 201) {
        const estTime = orderRes.body.data.pickupSlot; // e.g. "12-17 mins"
        const points = orderRes.body.data.pointsEarned || 0;
        console.log(`✅ Order 1 Placed. Est Time: ${estTime}. Points: ${points}`);

        // Parse "X-Y mins"
        // If Logic changes worked, this should be consistent with Item settings.
        // If Item prepTime is null, it should be 10 (default) + 5 (buffer) + 0 = 15 mins.
        // If it was 15 default, it would be 20.
    } else {
        console.error('❌ Order 1 Failed', orderRes.body);
    }

    // 2. CHECK SLOTS LOGIC
    // We check if slots start at least ~10 mins from now.
    const slotsRes = await request('GET', `/outlets/${outletId}/slots`, null, token);
    if (slotsRes.status === 200) {
        const slots = slotsRes.body.data;
        if (slots.length > 0) {
            const firstSlot = slots[0].time; // HH:MM
            console.log(`✅ Slots Fetched. First Slot: ${firstSlot}`);

            const now = new Date();
            const [h, m] = firstSlot.split(':').map(Number);
            const slotTime = new Date();
            slotTime.setHours(h, m, 0);
            if (slotTime < now) slotTime.setDate(slotTime.getDate() + 1); // Handle next day?

            const diffMins = (slotTime - now) / 60000;
            console.log(`   Time Diff from Now (${now.toLocaleTimeString()}): ${diffMins.toFixed(1)} mins`);

            if (diffMins >= 10 || diffMins < -1000) { // < -1000 means tomorrow 
                console.log('   ✅ Slot is advanced by roughly 10+ mins (or rounded interval).');
            } else {
                console.warn('   ⚠️ Slot is closer than 10 mins?');
            }
        }
    }

    console.log('\n✅ LOGIC TEST COMPLETED.');
}

runTests();
