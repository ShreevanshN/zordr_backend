import http from 'http';

// Helper for making requests
function makeRequest(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
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
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    // Check for JSON
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testSlots() {
    console.log('--- Debugging Time Slots ---');

    // 1. Login
    const loginRes = await makeRequest('/api/auth/admin/login', 'POST', {
        email: 'admin@zordr.com',
        password: 'Admin@123'
    });

    if (!loginRes.body.success) {
        console.error('Login Failed:', loginRes.body);
        return;
    }
    const token = loginRes.body.token;

    // 2. Get Outlet
    const outletsRes = await makeRequest('/api/outlets', 'GET', null, token);
    const outletId = outletsRes.body.data[0].id;
    console.log(`Target Outlet: ${outletId} (${outletsRes.body.data[0].name})`);

    // 3. Force Open and Set Hours
    console.log('Setting Outlet to OPEN and 24/7 Hours...');

    // Construct proper payload like Settings.tsx
    const fullWeekSchedule = {
        slotInterval: 30,
        maxOrdersPerSlot: 20,
        scheduledOrders: true
    };
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    days.forEach(day => {
        fullWeekSchedule[day] = {
            openTime: "00:00",
            closeTime: "23:59",
            isOpen: true
        };
    });

    // Update Settings
    await makeRequest(`/api/settings/${outletId}`, 'PUT', { business: fullWeekSchedule }, token);
    // Ensure isOpen is True (Master Switch)
    await makeRequest(`/api/outlets/${outletId}/status`, 'PUT', { isOpen: true }, token);

    // 4. Fetch Slots
    console.log('Fetching Slots...');
    const slotsRes = await makeRequest(`/api/outlets/${outletId}/slots`, 'GET', null, token);

    console.log('Slots Response:', JSON.stringify(slotsRes.body, null, 2));

    if (slotsRes.body.data.length === 0) {
        console.error('❌ NO SLOTS RETURNED!');
    } else {
        console.log(`✅ ${slotsRes.body.data.length} slots returned.`);
        console.log('Sample:', slotsRes.body.data.slice(0, 3));
    }
}

testSlots().catch(console.error);
