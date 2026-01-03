
const BASE_URL = 'http://localhost:3000/api';

async function main() {
    const phone = '9849777565';
    const otp = '123456'; // Magic OTP

    console.log(`Testing Partner Login for ${phone}...`);

    // Step 1: Send OTP (or skip if using magic OTP directly)
    try {
        const sendRes = await fetch(`${BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const sendJson = await sendRes.json();
        console.log('OTP Sent:', sendJson.success ? '✅' : '❌', sendJson.message || '');
    } catch (e) {
        console.log('⚠️  Send OTP failed (might be ok if using magic OTP):', e.message);
    }

    // Step 2: Partner Login
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/partner/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
        });

        const loginJson = await loginRes.json();

        if (loginJson.success) {
            console.log('✅ Partner Login SUCCESS!');
            console.log('   User:', loginJson.user.name);
            console.log('   Role:', loginJson.user.role);
            console.log('   Outlet ID:', loginJson.user.outletId);
            console.log('   Token:', loginJson.token ? 'Generated ✅' : 'Missing ❌');
        } else {
            console.log('❌ Partner Login FAILED:', loginJson.message);
        }
    } catch (e) {
        console.log('❌ Partner Login Error:', e.message);
    }
}

main();
