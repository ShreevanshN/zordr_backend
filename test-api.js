// Backend API Test Script for Zordr
// Run this with: node test-api.js

const API_BASE = 'http://192.168.0.7:3000/api';
let authToken = '';

const results = { passed: [], failed: [] };

function log(message, type = 'info') {
  const colors = { info: '\x1b[36m', success: '\x1b[32m', error: '\x1b[31m', warn: '\x1b[33m' };
  console.log(`${colors[type]}${message}\x1b[0m`);
}

async function testEndpoint(name, method, endpoint, body = null, requiresAuth = false) {
  try {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (requiresAuth && authToken) options.headers['Authorization'] = `Bearer ${authToken}`;
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (response.ok && data.success !== false) {
      log(`✅ PASS: ${name}`, 'success');
      results.passed.push(name);
      return data;
    } else {
      log(`❌ FAIL: ${name} - ${data.message || 'Unknown'}`, 'error');
      results.failed.push({ name, error: data.message });
      return null;
    }
  } catch (error) {
    log(`❌ FAIL: ${name} - ${error.message}`, 'error');
    results.failed.push({ name, error: error.message });
    return null;
  }
}

async function runTests() {
  log('\n🚀 Starting Zordr Backend API Tests...\n', 'info');

  // Auth Flow
  log('📧 Testing Authentication...', 'info');
  const otpResponse = await testEndpoint('Send OTP', 'POST', '/auth/send-otp', {
    phone: '9876543210',
  });
  const otp = otpResponse?.debug_otp || '123456';
  if (otpResponse) log(`📱 OTP: ${otp}`, 'info');

  const authResult = await testEndpoint('Verify OTP', 'POST', '/auth/verify-otp', {
    phone: '9876543210',
    otp,
    name: 'Test User',
  });
  if (authResult?.data) {
    authToken = authResult.data.token;
    log(`🔑 Token: ${authToken.substring(0, 20)}...`, 'success');
  }

  // Profile
  log('\n👤 Testing Profile...', 'info');
  await testEndpoint('Get Profile', 'GET', '/user/profile', null, true);
  await testEndpoint(
    'Update Profile',
    'PUT',
    '/user/profile',
    {
      name: 'Updated',
      dietary: 'Veg',
      campus: 'KITSW',
      allergies: 'None',
    },
    true
  );

  // Outlets
  log('\n🏪 Testing Outlets...', 'info');
  await testEndpoint('All Outlets', 'GET', '/outlets');
  await testEndpoint('Campus Outlets', 'GET', '/outlets?campus=KITSW');

  // Menu
  log('\n🍔 Testing Menu...', 'info');
  await testEndpoint('All Items', 'GET', '/menu/items');
  await testEndpoint('Search', 'GET', '/menu/items?search=burger');

  // Cart
  log('\n🛒 Testing Cart...', 'info');
  await testEndpoint('Get Cart', 'GET', '/cart', null, true);
  await testEndpoint('Add Item', 'POST', '/cart/add', { itemId: '1', quantity: 2 }, true);
  await testEndpoint('Update Item', 'PUT', '/cart/update', { itemId: '1', quantity: 3 }, true);

  // Favorites
  log('\n❤️ Testing Favorites...', 'info');
  await testEndpoint('Get Favorites', 'GET', '/favorites', null, true);
  await testEndpoint('Toggle Favorite', 'POST', '/favorites/toggle/1', null, true);

  // Orders
  log('\n📦 Testing Orders...', 'info');
  const orderResult = await testEndpoint(
    'Place Order',
    'POST',
    '/orders',
    {
      outletId: 'kitsw-canteen',
      deliveryTime: 'ASAP',
      items: [{ id: '1', quantity: 2, price: 25 }],
    },
    true
  );
  await testEndpoint('Get Orders', 'GET', '/orders', null, true);

  // Cleanup
  log('\n🧹 Cleanup...', 'info');
  await testEndpoint('Clear Cart', 'DELETE', '/cart/clear', null, true);

  // Summary
  log('\n' + '='.repeat(60), 'info');
  log(`📊 Summary: ✅ ${results.passed.length} | ❌ ${results.failed.length}`, 'info');
  log('='.repeat(60) + '\n', 'info');

  if (results.failed.length === 0) {
    log('🎉 All tests passed! Backend is fully functional!', 'success');
  } else {
    log(`⚠️  ${results.failed.length} test(s) failed`, 'warn');
    results.failed.forEach((f) => log(`  - ${f.name}: ${f.error}`, 'error'));
  }
}

runTests().catch((error) => {
  log(`\n💥 Test suite failed: ${error.message}`, 'error');
  process.exit(1);
});
