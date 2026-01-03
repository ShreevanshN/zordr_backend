const BASE_URL = 'http://localhost:3000/api';

async function main() {
    console.log('=== Testing Dynamic Slot Interval Flow ===\n');

    // 1. Login as Admin
    await fetch(`${BASE_URL}/auth/setup-admin`, { method: 'POST' });
    const adminLogin = await fetch(`${BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@zordr.com', password: 'Admin@123' })
    });
    const { token: adminToken } = await adminLogin.json();
    console.log('1. ✅ Admin logged in');

    // 2. Check an outlet's current slot settings
    const outletId = 'cbit-food-court'; // Use existing outlet
    const settingsRes = await fetch(`${BASE_URL}/settings/${outletId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const settings = await settingsRes.json();

    console.log(`\n2. Current Settings for ${outletId}:`);
    console.log(`   Slot Interval: ${settings.data.business.slotInterval} minutes`);
    console.log(`   Max Orders/Slot: ${settings.data.business.maxOrdersPerSlot}`);

    // 3. Update slot interval to 15 minutes (simulating partner change)
    console.log('\n3. Updating slot interval to 15 minutes...');

    const updatePayload = {
        business: {
            ...settings.data.business,
            slotInterval: 15,
            maxOrdersPerSlot: 25
        }
    };

    const updateRes = await fetch(`${BASE_URL}/settings/${outletId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(updatePayload)
    });
    const updateResult = await updateRes.json();
    console.log('   ✅ Updated:', updateResult.success ? 'Success' : 'Failed');

    // 4. Fetch slots and verify they use the new interval
    console.log('\n4. Fetching time slots to verify...');
    const slotsRes = await fetch(`${BASE_URL}/outlets/${outletId}/slots?includePast=true`);
    const slots = await slotsRes.json();

    if (slots.success && slots.data.length > 0) {
        const times = slots.data.map(s => s.time).slice(0, 5);
        console.log('   First 5 slots:', times.join(', '));

        // Check if interval is 15 min
        const firstTime = times[0].split(':');
        const secondTime = times[1].split(':');
        const diff = (parseInt(secondTime[0]) * 60 + parseInt(secondTime[1])) -
            (parseInt(firstTime[0]) * 60 + parseInt(firstTime[1]));

        console.log(`   Actual interval: ${diff} minutes`);
        console.log(`   ✅ Slots are using ${diff === 15 ? 'DYNAMIC' : 'HARDCODED'} interval!`);
    }

    // 5. Change back to 30 for cleanup
    console.log('\n5. Restoring to 30 minutes...');
    updatePayload.business.slotInterval = 30;
    updatePayload.business.maxOrdersPerSlot = 20;
    await fetch(`${BASE_URL}/settings/${outletId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(updatePayload)
    });
    console.log('   ✅ Restored to defaults');
}

main().catch(console.error);
