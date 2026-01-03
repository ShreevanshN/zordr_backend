// Test script to create both COD and Prepaid orders
const API_BASE = 'http://localhost:3000/api';

async function createTestOrder(paymentMethod) {
    try {
        const response = await fetch(`${API_BASE}/test/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentMethod,
                items: [
                    { name: 'Burger', quantity: 2, price: 150 },
                    { name: 'Fries', quantity: 1, price: 80 }
                ]
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log(`\u001b[32m✅ ${paymentMethod} order created: ${data.data.orderNumber}\u001b[0m`);
            console.log(`   Total: ₹${data.data.total}`);
        } else {
            console.log(`\u001b[31m❌ Failed to create ${paymentMethod} order: ${data.message}\u001b[0m`);
        }
    } catch (error) {
        console.log(`\u001b[31m❌ Error creating ${paymentMethod} order: ${error.message}\u001b[0m`);
    }
}

async function runTests() {
    console.log('\n\u001b[36m🧪 Creating Test Orders...\u001b[0m\n');

    // Create COD order
    await createTestOrder('COD');

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create Prepaid order
    await createTestOrder('UPI');

    console.log('\n\u001b[36m✨ Done! Check the partner app Orders page.\u001b[0m');
    console.log('\u001b[33m   COD orders should have a GREEN background.\u001b[0m');
    console.log('\u001b[33m   Prepaid orders should have a NORMAL background.\u001b[0m\n');
}

runTests();
