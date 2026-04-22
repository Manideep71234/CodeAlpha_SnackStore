const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@snackstore.local').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SnackStore@123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'SnackStoreAdminToken';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/snackstore')
  .then(() => console.log('Connected to Database'))
  .catch(err => console.log(err));

async function ensureDefaultAdmin() {
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL, role: 'admin' });
    if (existingAdmin) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await User.create({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin'
    });

    console.log(`Default admin ready: ${ADMIN_EMAIL}`);
}

async function requireAdmin(req, res) {
    const token = String(req.header('x-admin-token') || '').trim();

    if (!token) {
        res.status(401).json({ message: 'Admin credentials are required.' });
        return null;
    }

    if (token !== ADMIN_TOKEN) {
        res.status(403).json({ message: 'Admin access denied.' });
        return null;
    }

    return { email: ADMIN_EMAIL, role: 'admin' };
}

function sanitizeProduct(payload = {}) {
    const imageFit = String(payload.imageFit || 'cover').trim();
    const imagePosition = String(payload.imagePosition || 'center center').trim();
    return {
        name: String(payload.name || '').trim(),
        category: String(payload.category || '').trim(),
        price: Number(payload.price),
        stock: Number(payload.stock || 0),
        description: String(payload.description || '').trim(),
        imageUrl: String(payload.imageUrl || '').trim(),
        imageFit: ['cover', 'contain', 'fill', 'none'].includes(imageFit) ? imageFit : 'cover',
        imagePosition: imagePosition || 'center center'
    };
}

app.get('/api/products', async (req, res) => {
    try {
        const { category, search } = req.query;
        const query = {};

        if (category) {
            query.category = category;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const products = await Product.find(query).sort({ name: 1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories.sort());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ email: normalizedEmail, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully.', role: newUser.role });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        res.json({
            message: 'Login successful.',
            role: user.role,
            email: user.email,
            adminToken: user.role === 'admin' ? ADMIN_TOKEN : ''
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/orders/:email', async (req, res) => {
    try {
        const normalizedEmail = String(req.params.email).trim().toLowerCase();
        const orders = await Order.find({ userEmail: normalizedEmail }).sort({ date: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/admin/products', async (req, res) => {
    try {
        const admin = await requireAdmin(req, res);
        if (!admin) return;
        const products = await Product.find().sort({ category: 1, name: 1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/admin/products', async (req, res) => {
    try {
        const admin = await requireAdmin(req, res);
        if (!admin) return;

        const productData = sanitizeProduct(req.body);
        if (!productData.name || !productData.category || !productData.price || !productData.imageUrl) {
            return res.status(400).json({ message: 'All product fields are required.' });
        }

        const product = await Product.create(productData);
        res.status(201).json({ message: 'Product created successfully.', product });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/admin/products/:id', async (req, res) => {
    try {
        const admin = await requireAdmin(req, res);
        if (!admin) return;

        const productData = sanitizeProduct(req.body);
        const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.json({ message: 'Product updated successfully.', product });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        const admin = await requireAdmin(req, res);
        if (!admin) return;

        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.json({ message: 'Product deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const admin = await requireAdmin(req, res);
        if (!admin) return;

        const orders = await Order.find().sort({ date: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/admin/orders/:id/status', async (req, res) => {
    try {
        const admin = await requireAdmin(req, res);
        if (!admin) return;

        const status = String(req.body.status || '').trim();
        if (!status) {
            return res.status(400).json({ message: 'Status is required.' });
        }

        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        res.json({ message: 'Order status updated.', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { userEmail, items, total, address, addressType, paymentMethod } = req.body;
        if (!userEmail || !Array.isArray(items) || items.length === 0 || !address) {
            return res.status(400).json({ message: 'Missing required order data.' });
        }

        const normalizedEmail = String(userEmail).trim().toLowerCase();
        const normalizedItems = items.map(item => ({
            _id: item._id,
            name: item.name,
            price: item.price,
            qty: item.qty || 1,
            imageUrl: item.imageUrl || ''
        }));

        const computedTotal = normalizedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const finalTotal = Number.isFinite(total) ? total : computedTotal;

        const newOrder = new Order({
            userEmail: normalizedEmail,
            items: normalizedItems,
            total: finalTotal,
            address: String(address).trim(),
            addressType: addressType || 'Home',
            paymentMethod: paymentMethod || 'UPI'
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order placed successfully.', order: newOrder });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', async () => {
    await ensureDefaultAdmin();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
