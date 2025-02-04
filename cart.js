document.addEventListener("DOMContentLoaded", () => {
    fetchCartItems();
});

// Fetch Cart Items from the Server
const fetchCartItems = async () => {
    try {
        console.log("Fetching cart items..."); // Debugging log
        const response = await fetch("http://localhost:5501/cart");
        if (!response.ok) {
            throw new Error("Failed to fetch cart items");
        }
        const cartItems = await response.json();
        console.log("Cart items fetched:", cartItems); // Debugging log
        if (cartItems.length === 0) {
            document.getElementById("cart").innerHTML = "<p>Your cart is empty.</p>";
            return;
        }
        renderCartItems(cartItems);
    } catch (error) {
        console.error("Error fetching cart items:", error);
        document.getElementById("cart").innerHTML = "<p>Error loading cart items. Please try again later.</p>";
    }
};


// Add to Cart
const addToCart = (event) => {
    const plantId = event.target.getAttribute('data-id');
    const plant = plants.find(p => p.plantId == plantId);

    if (!plant) {
        console.error('Plant not found');
        return;
    }

    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existingItem = cartItems.find(item => item.plantId === plant.plantId);

    if (existingItem) {
        existingItem.cart_quantity += 1;
    } else {
        cartItems.push({ ...plant, cart_quantity: 1 });
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    showConfirmationMessage('Plant added to cart successfully!');
    renderCartItems(cartItems); // Update cart display
};


// Render Cart Items to the Page
const renderCartItems = (cartItems) => {
    const cartSection = document.getElementById("cart");
    cartSection.innerHTML = ""; // Clear existing content

    let totalPrice = 0;

    cartItems.forEach((item) => {
        console.log('Cart item:', item); // Debugging log
        const price = parseFloat(item.price); // Ensure price is a number
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        cartItem.innerHTML = `
        <div class="cart-item-content">
            <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-info">
            <h2>${item.name}</h2>
            <p>Price: $${price.toFixed(2)}</p>
            <p>Quantity: <input type="number" class="quantity-input" data-id="${item.PlantId}" value="${item.cart_quantity}" min="1"></p>
            <p>Subtotal: $${(item.price * item.cart_quantity).toFixed(2)}</p>
            <button data-id="${item.plantId}" class="remove-button">Remove</button>
        `;

        cartSection.appendChild(cartItem);

        totalPrice += item.price * item.cart_quantity;
    });

    document.getElementById("total-price").textContent = totalPrice.toFixed(2);

    // Add event listeners to "Remove" buttons
    document.querySelectorAll(".remove-button").forEach(button => {
        button.addEventListener("click", (e) => {
            const itemId = e.target.getAttribute("data-id");
            removeFromCart(itemId);
        });
    });

    // Add event listeners to quantity inputs
    document.querySelectorAll(".quantity-input").forEach(input => {
        input.addEventListener("change", (e) => {
            const itemId = e.target.getAttribute("data-id");
            const newQuantity = parseInt(e.target.value);
            updateCartQuantity(itemId, newQuantity);
        });
    });
};

// Remove Item from Cart
const removeFromCart = (itemId) => {
    fetch(`http://localhost:5501/cart/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
    })
        .then(response => response.json())
        .then(data => {
            alert("Item removed from cart!");
            fetchCartItems(); // Refresh cart items
        })
        .catch(error => {
            console.error("Error removing item from cart:", error);
        });
};

// Show confirmation message
const showConfirmationMessage = (message) => {
    const confirmationMessage = document.getElementById('confirmation-message');
    confirmationMessage.textContent = message;
    confirmationMessage.style.display = 'block';
    setTimeout(() => {
        confirmationMessage.style.display = 'none';
    }, 3000); // Hide the message after 3 seconds
};


// Update Cart Quantity
const updateCartQuantity = (itemId, newQuantity) => {
    fetch(`http://localhost:5501/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_quantity: newQuantity })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Cart quantity updated:", data);
        fetchCartItems(); // Refresh cart items
    })
    .catch(error => {
        console.error("Error updating cart quantity:", error);
    });
};

// Pass cart data to the checkout page
document.getElementById("checkout-button").addEventListener("click", () => {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    localStorage.setItem('checkoutCart', JSON.stringify(cartItems));
    window.location.href = "checkout.html";
});