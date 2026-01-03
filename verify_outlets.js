import http from 'http';

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
    });
}

async function verifyOutlets() {
    console.log('--- Verifying Outlet Visibility ---');

    // 1. List All Outlets (User App Home Screen)
    console.log('\n1. Fetching All Outlets (User View)...');
    const listRes = await makeRequest('/api/outlets');

    if (listRes.success) {
        console.log(`✅ Found ${listRes.data.length} outlets.`);
        listRes.data.forEach(o => {
            console.log(`   - [${o.isOpen ? 'OPEN' : 'CLOSED'}] ${o.name} (ID: ${o.id})`);
            console.log(`     Campus: ${o.campus}, Rating: ${o.rating}, Image: ${o.image ? 'Has Image' : 'No Image'}`);
        });
    } else {
        console.error('❌ Failed to fetch outlets:', listRes);
    }

    // 2. Fetch Single Outlet Details (Partner App / User Outlet Page)
    if (listRes.data && listRes.data.length > 0) {
        const targetId = listRes.data[0].id; // e.g., cbit-food-court
        console.log(`\n2. Fetching Details for: ${targetId}...`);
        const detailRes = await makeRequest(`/api/outlets/${targetId}`);

        if (detailRes.success) {
            const o = detailRes.data;
            console.log(`✅ Details Fetched:`);
            console.log(`   - Name: ${o.name}`);
            console.log(`   - Contact: ${o.contactPhone}`);
            console.log(`   - Location: ${o.location}`);
            console.log(`   - Operating Hours: ${JSON.stringify(o.operatingHours ? 'Present' : 'Missing')}`);
            console.log(`   - Payment Prefs: ${o.paymentFrequency} / ${o.preferredPaymentMethod}`);
        } else {
            console.error('❌ Failed to fetch details:', detailRes);
        }
    }
}

verifyOutlets().catch(console.error);
