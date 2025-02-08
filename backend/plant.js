// To display selected plant
const getPlantIdFromUrl = () => {
    // Get the URL parameters
    const params = new URLSearchParams(window.location.search);
    // Extract the plantId parameter
    const plantId = params.get('plantId');
    console.log('Plant ID from URL:', plantId); // Debugging log
    return plantId;
};

// Fetch plant details from the server
const fetchPlantDetails = async (id) => {
    console.log('Fetching details for plant ID:', id); // Debugging log
    try {
        // Make a GET request to fetch plant details
        const response = await fetch(`http://localhost:3307/plants/${id}`);
        if (!response.ok) {
            throw new Error("Failed to fetch plant details");
        }
        // Parse the JSON response
        const plant = await response.json();
        console.log('Fetched plant details:', plant); // Debugging log
        // Render the plant details on the page
        renderPlantDetails(plant);
    } catch (error) {
        console.error("Error fetching plant details:", error);
    }
};

// Render plant details on the page
const renderPlantDetails = (plant) => {
    // Get the plant details section element
    const plantDetailsSection = document.getElementById('plant-details');
    if (!plantDetailsSection) {
        console.error('Element with ID "plant-details" not found');
        return;
    }
    // Set the inner HTML of the plant details section
    plantDetailsSection.innerHTML = `
        <img src="${plant.image_url}" alt="${plant.name}">
        <h2>${plant.name}</h2>
        <p>${plant.description}</p>
        <p>Price: $${plant.price}</p>
        <p>In Stock: ${plant.quantity}</p>
        <button class="add-to-cart" data-id="${plant.plantId}">Add to Cart</button>
    `;

    // Add event listener to "Add to Cart" button
    const addToCartButton = document.querySelector('.add-to-cart');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', (event) => {
            console.log('Add to Cart button clicked'); // Debugging log
            addToCart(event);
        });
    } else {
        console.error('Add to Cart button not found');
    }
};

// Add the selected plant to the cart
const addToCart = (event) => {
    // Get the plant ID from the button's data attribute
    const plantId = event.target.getAttribute('data-id');
    console.log(`Plant ID ${plantId} added to cart`);

    // Make a POST request to add the plant to the cart
    fetch("http://localhost:3307/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId: plantId, quantity: 1 })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        console.log('Item added to cart:', data);
        // Show confirmation message
        showConfirmationMessage('Plant added to cart successfully!');
    })
    .catch(error => {
        console.error('Error adding item to cart:', error);
        // Show error message
        showConfirmationMessage('Failed to add plant to cart.');
    });
};

// Show a confirmation message to the user
const showConfirmationMessage = (message) => {
    // Get the confirmation message element
    const confirmationMessage = document.getElementById('confirmation-message');
    if (!confirmationMessage) {
        console.error('Element with ID "confirmation-message" not found');
        return;
    }
    // Set the message text and display it
    confirmationMessage.textContent = message;
    confirmationMessage.style.display = 'block';
    // Hide the message after 3 seconds
    setTimeout(() => {
        confirmationMessage.style.display = 'none';
    }, 3000);
};

// Get the plant ID from the URL and fetch its details
const plantId = getPlantIdFromUrl();
if (plantId) {
    fetchPlantDetails(plantId);
} else {
    console.error('No plant ID found in URL');
}