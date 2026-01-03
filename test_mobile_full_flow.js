
import http from 'http';

// --- CONFIG ---
const BASE_URL = 'http://localhost:3000/api';
const PHONE_NUMBER = '9876543210'; // Test user
const OTP = '123456';

// --- HELPER: REQUEST WRAPPER ---
function request(method, endpoint, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api${endpoint}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// --- TEST RUNNER ---
async function runTests() {
    console.log('🚀 STARTING COMPREHENSIVE MOBILE APP BACKEND TEST\n');
    let token = null;
    let userId = null;
    let outletId = null;
    let itemId = null;
    let orderId = null;
    let notifId = null;

    // 1. AUTHENTICATION
    console.log('--- 1. AUTHENTICATION ---');
    console.log('Sending OTP...');
    await request('POST', '/auth/send-otp', { phone: PHONE_NUMBER }); // Just to trigger flow

    console.log('Verifying OTP & Logging In...');
    const loginRes = await request('POST', '/auth/verify-otp', {
        phone: PHONE_NUMBER,
        otp: OTP,
        name: 'Test Mobile User',
        email: 'mobile.test@example.com'
    });

    if (loginRes.status === 200 || loginRes.status === 201) {
        console.log('Login Response:', JSON.stringify(loginRes.body, null, 2));
        token = loginRes.body.token;
        if (loginRes.body.user) {
            userId = loginRes.body.user.id;
            console.log(`✅ Login Successful. Token obtained. User ID: ${userId}`);
        } else {
            console.error('❌ Login User object missing');
            // Maybe it returns data: { user: ... }?
            if (loginRes.body.data && loginRes.body.data.user) {
                userId = loginRes.body.data.user.id;
                token = loginRes.body.data.token || token;
                console.log(`✅ Login Successful (User in data). User ID: ${userId}`);
            } else {
                console.error('CRITICAL: Cannot find user in response');
                process.exit(1);
            }
        }
    } else {
        console.error('❌ Login Failed:', loginRes.body);
        process.exit(1);
    }

    // 2. USER PROFILE
    console.log('\n--- 2. USER PROFILE ---');
    console.log('Fetching Profile...');
    const profileRes = await request('GET', '/user/profile', null, token);
    if (profileRes.status === 200) console.log('✅ Profile Fetched:', profileRes.body.data.name);
    else console.error('❌ Profile Fetch Failed');

    console.log('Updating Profile (Dietary Pref)...');
    const updateRes = await request('PUT', '/user/profile', { dietary: 'Non-Veg' }, token);
    if (updateRes.status === 200 && updateRes.body.data.dietary === 'Non-Veg') console.log('✅ Profile Updated');
    else console.error('❌ Profile Update Failed');

    console.log('Saving Push Token...');
    const pushRes = await request('POST', '/user/push-token', { pushToken: 'ExponentPushToken[TestToken123]' }, token);
    if (pushRes.status === 200) console.log('✅ Push Token Saved');
    else console.error('❌ Push Token Save Failed');

    // 3. BROWSING
    console.log('\n--- 3. BROWSING ---');
    console.log('Listing Campuses...');
    const campusRes = await request('GET', '/outlets/meta/campuses', null, token); // Correct endpoint? No, route /meta/campuses isn't correct prefix? Check routes.
    // routes/outlets.js mounted at /api/outlets. Route is /meta/campuses. So /api/outlets/meta/campuses.
    const campusResReal = await request('GET', '/outlets/meta/campuses');
    if (campusResReal.status === 200) console.log(`✅ Campuses Fetched: ${campusResReal.body.data.length}`);
    else console.error('❌ Campus Fetch Failed', campusResReal.body);

    console.log('Listing Outlets...');
    const outletsRes = await request('GET', '/outlets', null, token);
    if (outletsRes.status === 200 && outletsRes.body.data.length > 0) {
        outletId = outletsRes.body.data[0].id; // Pick first outlet
        console.log(`✅ Outlets Fetched. Selected: ${outletsRes.body.data[0].name} (${outletId})`);
    } else {
        console.error('❌ No Outlets Found');
        process.exit(1);
    }

    console.log(`Fetching Time Slots for ${outletId}...`);
    const slotsRes = await request('GET', `/outlets/${outletId}/slots`, null, token);
    if (slotsRes.status === 200 && slotsRes.body.data.length > 0) console.log(`✅ Slots Fetched: ${slotsRes.body.data.length} slots available.`);
    else console.warn('⚠️ No Slots returned (Maybe closed?)', slotsRes.body);

    // 4. MENU & CART
    console.log('\n--- 4. MENU & CART ---');
    console.log('Fetching Menu...');
    const menuRes = await request('GET', `/menu?outletId=${outletId}`, null, token);
    if (menuRes.status === 200 && menuRes.body.data.items.length > 0) {
        // Pick an item
        itemId = menuRes.body.data.items[0].id;
        console.log(`✅ Menu Fetched. Selected Item: ${menuRes.body.data.items[0].name} (${itemId})`);
    } else {
        console.error('❌ Menu Fetch Failed or Empty');
        process.exit(1);
    }

    console.log('Adding to Cart...');
    const cartAddRes = await request('POST', '/cart/add', { itemId: itemId, quantity: 2 }, token);
    if (cartAddRes.status === 200) console.log('✅ Item Added to Cart. Count:', cartAddRes.body.data.summary.itemCount);
    else console.error('❌ Cart Add Failed', cartAddRes.body);

    console.log('Updates Quantity...');
    const cartUpdateRes = await request('PUT', '/cart/update', { itemId: itemId, quantity: 3 }, token);
    if (cartUpdateRes.status === 200) console.log('✅ Cart Qty Updated.');

    // 5. FAVORITES
    console.log('\n--- 5. FAVORITES ---');
    console.log('Toggling Favorite...');
    const favRes = await request('POST', `/favorites/toggle/${itemId}`, null, token);
    if (favRes.status === 200) console.log(`✅ Favorite Toggled: ${favRes.body.data.isFavorite}`);
    else console.error('❌ Favorite Toggle Failed');

    // 6. ORDERING
    console.log('\n--- 6. ORDERING ---');
    console.log('Placing Order...');

    // Use a valid slot if available, else null (ASAP?)
    const slotTime = slotsRes.body.data.length > 0 ? slotsRes.body.data[0].time : '12:00';

    const orderPayload = {
        items: [{ id: itemId, quantity: 1 }],
        outletId: outletId,
        pickupSlot: slotTime,
        paymentMethod: 'UPI',
        specialInstructions: 'Test Order via Script'
    };

    const orderRes = await request('POST', '/orders', orderPayload, token);
    if (orderRes.status === 201) {
        orderId = orderRes.body.data.id;
        console.log(`✅ Order Placed Successfully! ID: ${orderId}`);
        console.log(`   Total: ${orderRes.body.data.total}, Estimated: ${orderRes.body.data.pickupSlot}`);
    } else {
        console.error('❌ Order Placement Failed', orderRes.body);
    }

    if (orderId) {
        console.log('Cancelling Order...');
        const cancelRes = await request('PUT', `/orders/${orderId}/cancel`, { reason: 'Test Cancellation' }, token);
        if (cancelRes.status === 200) console.log('✅ Order Cancelled Successfully.');
        else console.error('❌ Order Cancellation Failed', cancelRes.body);
    }

    // 7. NOTIFICATIONS
    console.log('\n--- 7. NOTIFICATIONS ---');
    console.log('Fetching Notifications...');
    const notifRes = await request('GET', '/notifications', null, token);
    if (notifRes.status === 200) {
        console.log(`✅ Notifications Fetched: ${notifRes.body.data.length}`);
        if (notifRes.body.data.length > 0) notifId = notifRes.body.data[0].id;
    }

    if (notifId) {
        console.log('Marking as Read...');
        const readRes = await request('PUT', `/notifications/${notifId}/read`, null, token);
        if (readRes.status === 200) console.log('✅ Notification Marked Read');
    }

    console.log('\n✅ TEST SUITE COMPLETED.');
}

runTests();
