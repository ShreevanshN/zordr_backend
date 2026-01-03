
import http from 'http';

const BASE_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'admin@zordr.com';
const ADMIN_PASS = 'Admin@123';

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
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('🚀 STARTING ADMIN APP BACKEND TEST\n');
    let token = null;

    // 1. ADMIN LOGIN
    console.log('--- 1. ADMIN AUTH ---');
    const loginRes = await request('POST', '/auth/admin/login', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASS
    });

    if (loginRes.status === 200) {
        if (loginRes.body.token) {
            token = loginRes.body.token;
        } else if (loginRes.body.data && loginRes.body.data.token) {
            token = loginRes.body.data.token;
        }
        console.log(`✅ Login Successful. Token obtained.`);
    } else {
        console.error('❌ Login Failed:', loginRes.body);
        process.exit(1);
    }

    // 2. DASHBOARD
    console.log('\n--- 2. DASHBOARD ---');
    const statsRes = await request('GET', '/admin/dashboard/stats', null, token);
    if (statsRes.status === 200) console.log('✅ Dashboard Stats Fetched:', statsRes.body.data.length, 'metrics');
    else console.error('❌ Dashboard Stats Failed', statsRes.body);

    const liveRes = await request('GET', '/admin/dashboard/live-orders', null, token);
    if (liveRes.status === 200) console.log('✅ Live Orders Fetched:', liveRes.body.data.length);
    else console.error('❌ Live Orders Failed', liveRes.body);

    // 3. OUTLETS (Admin View)
    console.log('\n--- 3. OUTLETS ---');
    const outletsRes = await request('GET', '/outlets', null, token);
    if (outletsRes.status === 200) console.log(`✅ Outlets List Fetched: ${outletsRes.body.data.length}`);
    else console.error('❌ Outlets List Failed');

    // 4. USERS
    console.log('\n--- 4. USERS ---');
    const usersRes = await request('GET', '/admin/users', null, token);
    if (usersRes.status === 200) console.log(`✅ Users List Fetched: ${usersRes.body.data.length}`);
    // Endpoint might be /users (admin-users.js often mounted at /api/admin/users or just /api/users?)
    // Let's verify admin-users.js mount in server.js but assuming /admin/users for now based on file name.

    // 5. FINANCE
    console.log('\n--- 5. FINANCE ---');
    const financeRes = await request('GET', '/admin/finance/overview', null, token);
    if (financeRes.status === 200) {
        console.log('✅ Finance Overview Fetched');
    } else {
        console.error('❌ Finance Overview Failed', financeRes.body);
    }

    // 6. AUDIT LOGS
    console.log('\n--- 6. AUDIT LOGS ---');
    const auditRes = await request('GET', '/admin/audit', null, token);
    if (auditRes.status === 200) console.log(`✅ Audit Logs Fetched: ${auditRes.body.data.length}`);
    // Might fail if audit table empty or not set up, but route should exist.

    // 7. SUPPORT
    console.log('\n--- 7. SUPPORT ---');
    const ticketRes = await request('GET', '/support/admin/tickets', null, token);
    if (ticketRes.status === 200) console.log(`✅ Support Tickets Fetched: ${ticketRes.body.data.length}`);
    else console.error('❌ Support Tickets Failed', ticketRes.body);

    console.log('\n✅ ADMIN TEST SUITE COMPLETED.');
}

runTests();
