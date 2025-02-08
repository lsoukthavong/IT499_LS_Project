//Checkout
document.addEventListener("DOMContentLoaded", () => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    console.log("Cart items on checkout page:", cartItems); // Debugging log
    displayCartItems(cartItems);
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const totalAmount = calculateTotalAmount(cartItems);
        console.log("Total amount to be paid:", totalAmount); // Debugging log
        mockPayment(totalAmount);
    });
});

// Function to display cart items and total amount
const displayCartItems = (cartItems) => {
    const cartItemsList = document.getElementById('cart-items-list');
    const totalAmountElement = document.getElementById('total-amount');
    cartItemsList.innerHTML = '';
    let totalAmount = 0;

    cartItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = `${item.name} - $${item.price} x ${item.quantity}`;
        cartItemsList.appendChild(listItem);
        totalAmount += item.price * item.quantity;
    });

    console.log("Calculated total amount:", totalAmount); // Debugging log
    totalAmountElement.textContent = totalAmount.toFixed(2);
};

// Function to mock payment
const mockPayment = async (amount) => {
    try {
        const response = await fetch('http://localhost:3307/mock-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();
        if (data.message === 'Payment successful!') {
            finalizeOrder(); // Call finalizeOrder after successful payment
        } else {
            document.getElementById('error-message').textContent = 'Payment failed.';
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        document.getElementById('error-message').textContent = 'Error processing payment.';
    }
};

// Function to finalize order
const finalizeOrder = async () => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const totalAmount = calculateTotalAmount(cartItems); // Calculate total amount

    try {
        const response = await fetch('http://localhost:3307/finalize-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems, totalAmount })
        });
        const data = await response.json();
        if (data.message === 'Order finalized successfully!') {
            document.getElementById('confirmation-message').textContent = 'Order finalized successfully!';
            document.getElementById('confirmation-message').style.display = 'block';
            localStorage.removeItem('cartItems'); // Clear cart
            updateInventory(cartItems); // Update inventory
        } else {
            document.getElementById('error-message').textContent = 'Failed to finalize order.';
        }
    } catch (error) {
        console.error('Error finalizing order:', error);
        document.getElementById('error-message').textContent = 'Error finalizing order.';
    }
};

// Function to calculate total amount
const calculateTotalAmount = (cartItems) => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
};

// Function to update inventory
const updateInventory = async (cartItems) => {
    try {
        const response = await fetch('http://localhost:3307/update-inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems })
        });
        if (!response.ok) {
            throw new Error('Failed to update inventory');
        }
        console.log('Inventory updated successfully');
    } catch (error) {
        console.error('Error updating inventory:', error);
    }
};