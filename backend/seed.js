// backend/seed.js
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/snackstore')
  .then(() => console.log('Connected to Database for Seeding...'))
  .catch(err => console.log(err));

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@snackstore.local').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SnackStore@123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'SnackStoreAdminToken';

const newProducts = [
    // --- CHIPS ---
    { name: "Lay's Classic Salted", category: "Chips", price: 25, stock: 60, description: "Light, crispy and salted potato chips.", imageUrl: "assets/products/chips-classic.svg" },
    { name: "Pringles Sour Cream", category: "Chips", price: 120, stock: 40, description: "Stacked potato crisps with creamy onion flavor.", imageUrl: "assets/products/pringles-sour-cream.svg" },
    { name: "Kurkure Masala Munch", category: "Chips", price: 20, stock: 75, description: "Crunchy corn puffs with masala spice.", imageUrl: "assets/products/kurkure-masala-munch.svg" },
    { name: "Himalayan Salt Chips", category: "Chips", price: 30, stock: 55, description: "Lightly salted ridged chips with a deep crunch.", imageUrl: "assets/products/himalayan-salt-chips.svg" },

    // --- COOKIES ---
    { name: "Choco Chip Cookies", category: "Cookies", price: 35, stock: 55, description: "Buttery cookies loaded with chocolate chips.", imageUrl: "assets/products/choco-chip-cookies.svg" },
    { name: "Oatmeal Raisin Cookies", category: "Cookies", price: 40, stock: 30, description: "Soft baked oats and raisins in every bite.", imageUrl: "assets/products/oatmeal-raisin-cookies.svg" },

    // --- NAMKEEN ---
    { name: "Aloo Bhujia Mix", category: "Namkeen", price: 55, stock: 45, description: "Classic spicy aloo bhujia namkeen.", imageUrl: "assets/products/aloo-bhujia-mix.svg" },
    { name: "Moong Dal Crunch", category: "Namkeen", price: 65, stock: 35, description: "Roasted moong dal with savory seasoning.", imageUrl: "assets/products/moong-dal-crunch.svg" },

    // --- COOL DRINKS ---
    { name: "Thums Up", category: "Cool Drinks", price: 45, stock: 80, description: "Bold cola with extra fizz.", imageUrl: "assets/products/thums-up.svg" },
    { name: "Sprite Lemon", category: "Cool Drinks", price: 40, stock: 75, description: "Refreshing lemon-lime soft drink.", imageUrl: "assets/products/sprite-lemon.svg" },
    { name: "Mango Fruit Drink", category: "Cool Drinks", price: 35, stock: 65, description: "Sweet and chilled mango drink.", imageUrl: "assets/products/mango-fruit-drink.svg" },
    { name: "Orange Splash", category: "Cool Drinks", price: 38, stock: 52, description: "Bright citrus drink with a refreshing finish.", imageUrl: "assets/products/orange-splash.svg" },

    // --- FAST FOODS ---
    { name: "Veggie Burger", category: "Fast Foods", price: 129, stock: 35, description: "Grilled veggie patty with fresh toppings.", imageUrl: "assets/products/veggie-burger.svg" },
    { name: "Cheese Pizza Slice", category: "Fast Foods", price: 149, stock: 25, description: "Cheesy pizza with rich tomato sauce.", imageUrl: "assets/products/cheese-pizza-slice.svg" },
    { name: "Crispy French Fries", category: "Fast Foods", price: 99, stock: 50, description: "Golden and crispy fries with seasoning.", imageUrl: "assets/products/crispy-french-fries.svg" },
    { name: "Spicy Wrap", category: "Fast Foods", price: 119, stock: 28, description: "Loaded wrap with fresh veg and spicy sauce.", imageUrl: "assets/products/spicy-wrap.svg" },

    // --- CHOCOLATE ---
    { name: "Dark Chocolate Bar", category: "Chocolate", price: 80, stock: 45, description: "Rich dark cocoa chocolate bar.", imageUrl: "assets/products/dark-chocolate-bar.svg" },
    { name: "Milk Chocolate Bites", category: "Chocolate", price: 60, stock: 60, description: "Creamy milk chocolate mini bites.", imageUrl: "assets/products/milk-chocolate-bites.svg" },

    // --- ICE CREAM ---
    { name: "Vanilla Ice Cream Cup", category: "Ice Cream", price: 70, stock: 35, description: "Classic vanilla scoop cup.", imageUrl: "assets/products/vanilla-ice-cream-cup.svg" },
    { name: "Chocolate Sundae", category: "Ice Cream", price: 95, stock: 25, description: "Creamy sundae with chocolate drizzle.", imageUrl: "assets/products/chocolate-sundae.svg" }
];

const seedDatabase = async () => {
    try {
        await Product.deleteMany({}); // 1. Wipes the current database clean
        console.log("Old data deleted.");
        
        await Product.insertMany(newProducts); // 2. Inserts our new array
        console.log("New products added successfully!");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
        await User.findOneAndUpdate(
            { email: ADMIN_EMAIL },
            { email: ADMIN_EMAIL, password: hashedPassword, role: 'admin' },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        console.log(`Admin account ready: ${ADMIN_EMAIL}`);
        console.log(`Admin token: ${ADMIN_TOKEN}`);
        
        process.exit(); // 3. Stops the script
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedDatabase();
