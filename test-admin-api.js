// Admin API Test Script
// Run with: node test-admin-api.js

const API_BASE = 'https://zordr-backend-main.onrender.com/api';

// Admin credentials (replace with actual after setup)
const ADMIN_EMAIL = 'admin@zordr.com';
const ADMIN_PASSWORD = 'Admin@123';

let authToken = '';

async function login() {
  console.log('\n🔐 Testing Admin Login...');
  try {
    const response = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    const data = await response.json();
    if (data.success && data.token) {
      authToken = data.token;
      console.log('✅ Login successful');
      console.log(`   Admin: ${data.user.name} (${data.user.role})`);
      return true;
    } else {
      console.log('❌ Login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testDashboardStats() {
  console.log('\n📊 Testing Dashboard Stats...');
  try {
    const response = await fetch(`${API_BASE}/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const data = await response.json();
    if (data.success) {
      console.log('✅ Dashboard stats fetched successfully');
      data.data.forEach((stat) => {
        console.log(`   ${stat.title}: ${stat.value} (${stat.change})`);
      });
      return true;
    } else {
      console.log('❌ Failed to fetch stats:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Stats error:', error.message);
    return false;
  }
}

async function testLiveOrders() {
  console.log('\n📦 Testing Live Orders...');
  try {
    const response = await fetch(`${API_BASE}/admin/dashboard/live-orders`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const data = await response.json();
    if (data.success) {
      console.log(`✅ Live orders fetched: ${data.data.length} active orders`);
      data.data.slice(0, 3).forEach((order) => {
        console.log(`   ${order.id} - ${order.outlet} - ${order.value} (${order.status})`);
      });
      return true;
    } else {
      console.log('❌ Failed to fetch live orders:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Live orders error:', error.message);
    return false;
  }
}

async function testAdminOrders() {
  console.log('\n📋 Testing Admin Orders List...');
  try {
    const response = await fetch(`${API_BASE}/orders/admin/orders`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const data = await response.json();
    if (data.success) {
      console.log(`✅ Admin orders fetched: ${data.data.length} total orders`);
      if (data.data.length > 0) {
        const order = data.data[0];
        console.log(
          `   Sample: ${order.id} - Campus: ${order.campusName} - Status: ${order.status}`
        );
      }
      return true;
    } else {
      console.log('❌ Failed to fetch admin orders:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin orders error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 ========================================');
  console.log('🧪 Admin API Test Suite - Phase 1');
  console.log('🧪 ========================================');

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without valid login');
    return;
  }

  await testDashboardStats();
  await testLiveOrders();
  await testAdminOrders();

  console.log('\n🧪 ========================================');
  console.log('🧪 Test Suite Complete');
  console.log('🧪 ========================================\n');
}

runTests();
