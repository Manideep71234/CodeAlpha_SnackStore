const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: {
        type: String,
        required: true,
        enum: ['Chips', 'Cookies', 'Namkeen', 'Cool Drinks', 'Fast Foods', 'Chocolate', 'Ice Cream']
    },
    price: { type: Number, required: true, min: 1 },
    stock: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    imageFit: { type: String, default: 'cover' },
    imagePosition: { type: String, default: 'center center' }
});

module.exports = mongoose.model('Product', productSchema);
