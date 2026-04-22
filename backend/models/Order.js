const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    items: { type: Array, default: [] },
    total: { type: Number, default: 0 },
    address: { type: String, required: true, trim: true },
    addressType: { type: String, default: 'Home' },
    paymentMethod: { type: String, default: 'UPI' },
    status: { type: String, default: 'Preparing' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
