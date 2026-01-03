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
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
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

async function testSettings() {
    console.log('--- Testing Settings API ---');

    // 1. Login as Admin
    console.log('1. Logging in as Admin...');
    const loginRes = await makeRequest('/api/auth/admin/login', 'POST', {
        email: 'admin@zordr.com',
        password: 'Admin@123'
    });

    if (!loginRes.body.success) {
        console.error('Login Failed:', loginRes.body);
        // Try setting up admin if login fails
        console.log('Attempting to setup admin...');
        await makeRequest('/api/auth/setup-admin', 'POST', {});
        return;
    }

    const token = loginRes.body.token;
    console.log('Login Successful. Token received.');

    // 2. Find an Outlet
    console.log('2. Fetching Outlets...');
    const outletsRes = await makeRequest('/api/outlets', 'GET', null, token);

    if (!outletsRes.body.success || outletsRes.body.data.length === 0) {
        console.error('No outlets found.');
        return;
    }

    const outletId = outletsRes.body.data[0].id;
    console.log(`Using Outlet ID: ${outletId}`);

    // 3. Get Settings
    console.log('3. Fetching Settings...');
    const settingsRes = await makeRequest(`/api/settings/${outletId}`, 'GET', null, token);
    console.log('Get Settings Response:', JSON.stringify(settingsRes.body, null, 2));

    // 4. Update Business Settings
    console.log('4. Updating Business Settings...');
    const businessPayload = {
        business: {
            slotInterval: 45,
            maxOrdersPerSlot: 25,
            scheduledOrders: false,
            weekdays: { open: "08:00", close: "22:00", enabled: true },
            sunday: { open: "10:00", close: "18:00", enabled: true }
        }
    };
    const updateBusinessRes = await makeRequest(`/api/settings/${outletId}`, 'PUT', businessPayload, token);
    console.log('Update Business Result:', updateBusinessRes.body);

    // 5. Update Payment Settings
    console.log('5. Updating Payment Settings...');
    const paymentPayload = {
        payment: {
            paymentFrequency: 'monthly',
            preferredPaymentMethod: 'upi'
        }
    };
    const updatePaymentRes = await makeRequest(`/api/settings/${outletId}`, 'PUT', paymentPayload, token);
    console.log('Update Payment Result:', updatePaymentRes.body);

    // 6. Update Printer Settings
    // Note: Backend routes/settings.js line 159 handles 'printer' key
    console.log('6. Updating Printer Settings...');
    const printerPayload = {
        printer: {
            selectedPrinter: 'kitchen',
            autoPrint: false,
            printFormat: '58mm'
        }
    };
    const updatePrinterRes = await makeRequest(`/api/settings/${outletId}`, 'PUT', printerPayload, token);
    console.log('Update Printer Result:', updatePrinterRes.body);

}

testSettings().catch(console.error);
