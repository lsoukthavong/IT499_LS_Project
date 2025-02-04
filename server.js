const express = require('express'); // Import the Express framework
const mysql = require('mysql2'); // Import mysql library to connect to mysql db
const cors = require('cors'); // Import the CORS middleware to enable Cross-Origin Resource Sharing
const http = require('http'); // Import the HTTP module
const WebSocket = require('ws'); // Import the WebSocket library

const jwt = require('jsonwebtoken'); // Import the JSON Web Token library
const bcrypt = require('bcryptjs'); // Import the bcrypt library for hashing passwords

const dotenv = require('dotenv'); // Import the dotenv library

dotenv.config(); // Load environment variables from .env file

const app = express(); // Initialize Express application
const server = http.createServer(app); // Create HTTP server
const wss = new WebSocket.Server({ server }); // Create WebSocket server

const port = process.env.PORT || 5501;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// User registration
app.post('/register', async (req, res) => {
    const { first_name, last_name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)', [first_name, last_name, email, hashedPassword, role || 'customer'], (err, results) => {
        if (err) {
            console.error('Error registering user:', err);
            res.status(500).json({ error: 'Server error' });
            return;
        }
        res.status(201).json({ message: 'User registered successfully' });
    });
});

// User login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            res.status(500).json({ error: 'Server error' });
            return;
        }
        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        const token = jwt.sign({ id: results[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});


// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Middleware to check if the user is staff
const checkIfStaff = (req, res, next) => {
    const userId = req.user.id;

    db.query('SELECT role FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user role:', err);
            res.status(500).json({ error: 'Server error' });
            return;
        }
        if (results.length === 0 || results[0].role !== 'staff') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        next();
    });
};

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

// Fetch plants with optional search query
app.get('/plants', (req, res) => {
    const searchQuery = req.query.search || '';
    const sqlQuery = searchQuery 
        ? 'SELECT * FROM plants WHERE name LIKE ? OR description LIKE ? OR type LIKE ?' 
        : 'SELECT * FROM plants';
    const queryParams = searchQuery ? [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`] : [];

    db.query(sqlQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching plants:', err);
            res.status(500).json({ error: 'Server error' });
            return;
        }
        res.json(results);
    });
});

// Endpoint to fetch selected plant
app.get('/plants/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM plants WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error fetching plant:', err);
            res.status(500).json({ error: 'Server error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Plant not found' });
            return;
        }
        res.json(results[0]);
    });
});

// Endpoint to fetch cart items
app.get('/cart', (req, res) => {
    db.query('SELECT * FROM cart', (err, results) => {
        if (err) {
            console.error('Error fetching cart items:', err);
            res.status(500).json({ error: 'Server error' });
            return;
        }
        res.json(results);
    });
});

// Endpoint to add an item to the cart
app.post('/cart', (req, res) => {
    const { id, name, price, image_url, quantity } = req.body;
    const totalAmount = price * quantity;
    console.log('Adding item to cart:', req.body); // Debugging log
    // Check if the item already exists in the cart
    db.query('SELECT * FROM cart WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error checking cart:', err);
            res.status(500).json({ error: 'Server error' });
            return;
        }
        if (results.length > 0) {
            // Item already exists, update the quantity and total amount
            db.query('UPDATE cart SET cart_quantity = cart_quantity + ?, total_amount = total_amount + ? WHERE id = ?', [quantity, totalAmount, id], (err, results) => {
                if (err) {
                    console.error('Error updating cart:', err);
                    res.status(500).json({ error: 'Server error' });
                    return;
                }
                res.status(200).json({ message: 'Item cart quantity and total amount updated in cart' });
            });
        } else {
            // Item does not exist, insert a new entry
            db.query('INSERT INTO cart (id, name, price, image_url, cart_quantity, total_amount) VALUES (?, ?, ?, ?, ?, ?)', [id, name, price, image_url, quantity, totalAmount], (err, results) => {
                if (err) {
                    console.error('Error adding item to cart:', err);
                    res.status(500).json({ error: 'Server error' });
                    return;
                }
                res.status(201).json({ message: 'Item added to cart' });
            });
        }
    });
});

// Endpoint to remove an item from the cart
app.delete('/cart/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM cart WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error removing item from cart:', err);
            res.status(500).json({ error: 'Server error' });
            return;
        }
        res.json({ message: 'Item removed from cart' });
    });
});

// Endpoint to update the quantity of an item in the cart
app.put('/cart/:id', (req, res) => {
    const { id } = req.params;
    const { quantity, price } = req.body;
    const totalAmount = price * quantity;
    db.query('UPDATE cart SET cart_quantity = ?, total_amount = ? WHERE id = ?', [quantity, totalAmount, id], (err, results) => {
        if (err) {
            console.error('Error updating cart quantity:', err);
            res.status(500).json({ error: 'Server error' });
            return;
        }
        res.json({ message: 'Cart quantity and total amount updated' });
    });
});

// Mock payment endpoint
app.post('/mock-payment', (req, res) => {
    const { amount } = req.body;
    console.log(`Mock payment of $${amount} received.`);
    res.json({ message: 'Payment successful!' });
});


// Endpoint to finalize order
app.post('/finalize-order', authenticateToken, (req, res) => {
    const { cartItems, totalAmount } = req.body;
    const username = req.user.username; // Assuming you have user authentication

    // Insert each item in the cart as a separate order entry
    cartItems.forEach(item => {
        const query = 'INSERT INTO orders (username, plant_name, item_qty, total_amount) VALUES (?, ?, ?, ?)';
        db.query(query, [username, item.name, item.quantity, totalAmount], (err, results) => {
            if (err) {
                console.error('Error finalizing order:', err);
                res.status(500).json({ error: 'Server error' });
                return;
            }
        });
    });

    res.json({ message: 'Order finalized successfully!' });
});

// Endpoint to update inventory
app.put('/plants/:id/inventory', authenticateToken, checkIfStaff, (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    db.query('UPDATE plants SET quantity = ? WHERE id = ?', [quantity, id], (err, results) => {
        if (err) {
            console.error('Error updating plant inventory:', err);
            res.status(500).json({ error: 'Server error' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ error: 'Plant not found' });
            return;
        }
        res.json({ message: 'Plant inventory updated successfully' });
    });
});

// WebSocket server for chat feature
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        console.log('Received:', message);
        
        // Broadcast the message to all clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});