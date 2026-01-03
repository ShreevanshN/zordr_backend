
import http from 'http';

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'admin@zordr.com';
const ADMIN_PASS = 'Admin@123';

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

async function runTests() {
    console.log('🚀 TESTING ADMIN BUTTONS (Campus & Outlets)\n');

    // 1. LOGIN
    const loginRes = await request('POST', '/auth/admin/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
    if (loginRes.status !== 200) {
        console.error('❌ Login Failed', loginRes.body);
        return;
    }
    const token = loginRes.body.token;
    console.log('✅ Admin Logged In');

    // 2. ADD CAMPUS
    const campusName = `TestCampus_${Date.now()}`;
    console.log(`\n🔹 Action 1: Add Campus [${campusName}]`);
    const campusRes = await request('POST', '/campuses', {
        name: campusName,
        location: 'Test Location',
        city: 'Test City',
        state: 'Telangana',
        contactPerson: 'Tester',
        established: '2023-01'
    }, token);

    if (campusRes.status === 201) {
        console.log('✅ Campus Created:', campusRes.body.data.name);
    } else {
        console.error('❌ Add Campus Failed', campusRes.body);
        return; // Can't proceed
    }

    // 3. ADD OUTLET (Linked to Campus)
    const outletName = `TestOutlet_${Date.now()}`;
    console.log(`\n🔹 Action 2: Add Outlet [${outletName}] to Campus [${campusName}]`);
    const outletRes = await request('POST', '/outlets', {
        name: outletName,
        campus: campusName, // Frontend sends simple string name
        image: 'https://via.placeholder.com/150',
        location: 'Block A',
        contactPhone: '9999999999',
        prepTime: '15 mins',
        isOpen: true,
        rating: 0
    }, token);

    if (outletRes.status === 201 || outletRes.status === 200) {
        console.log('✅ Outlet Created:', outletRes.body.data.name);
        console.log('   Linked Campus:', outletRes.body.data.campus);
    } else {
        console.error('❌ Add Outlet Failed', outletRes.status, outletRes.body);
    }

    // 4. VERIFY RELATIONS
    console.log(`\n🔹 Action 3: Verify Campus List includes new items`);
    const listRes = await request('GET', '/campuses', null, token);
    const foundCampus = listRes.body.data.find(c => c.name === campusName);
    if (foundCampus) {
        console.log(`✅ Campus found in list. Outlet Count: ${foundCampus.totalOutlets}`);
    } else {
        console.error('❌ Campus NOT found in list');
    }

    console.log('\n✅ BUTTON TEST COMPLETED.');
}

runTests();
