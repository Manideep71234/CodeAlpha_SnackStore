const API_BASE = 'http://localhost:5000/api';
const ORDER_STATUSES = ['Preparing', 'Packed', 'Out for Delivery', 'Delivered'];
const LOCAL_STORAGE_KEYS = {
    products: 'snackstoreLocalProducts',
    users: 'snackstoreLocalUsers',
    orders: 'snackstoreLocalOrders'
};
const LOCAL_ADMIN_EMAIL = 'admin@snackstore.local';
const LOCAL_ADMIN_PASSWORD = 'SnackStore@123';
const LOCAL_ADMIN_TOKEN = 'SnackStoreAdminToken';
const LOCAL_ASSET_PREFIX = 'assets/products/';
const PAGE_MODE = document.body.dataset.page || 'catalogue';
const PENDING_CHECKOUT_KEY = 'snackstorePendingCheckout';

const elements = {
    heroBanner: document.getElementById('hero-banner'),
    productList: document.getElementById('product-list'),
    authSection: document.getElementById('auth-section'),
    cartSection: document.getElementById('cart-section'),
    profileSection: document.getElementById('profile-section'),
    adminSection: document.getElementById('admin-section'),
    appShell: document.getElementById('app-shell'),
    navLinks: document.getElementById('nav-links'),
    adminBtn: document.getElementById('admin-btn'),
    authTitle: document.getElementById('auth-title'),
    authSubtitle: document.getElementById('auth-subtitle'),
    authMessage: document.getElementById('auth-message'),
    authSubmitBtn: document.getElementById('auth-submit-btn'),
    guestLoginBtn: document.getElementById('guest-login-btn'),
    emailInput: document.getElementById('email-input'),
    passwordInput: document.getElementById('password-input'),
    heroTitle: document.getElementById('hero-title'),
    heroSubtitle: document.getElementById('hero-subtitle'),
    searchInput: document.getElementById('search-input'),
    categoryRail: document.getElementById('category-rail'),
    toolbarNote: document.getElementById('toolbar-note'),
    productCount: document.getElementById('product-count'),
    categoryCount: document.getElementById('category-count'),
    cartCountStat: document.getElementById('cart-count-stat'),
    cartBtn: document.getElementById('cart-btn'),
    cartItemsContainer: document.getElementById('cart-items-container'),
    cartTotalPrice: document.getElementById('cart-total-price'),
    cartSummaryText: document.getElementById('cart-summary-text'),
    deliveryAddress: document.getElementById('delivery-address'),
    checkoutBtn: document.getElementById('checkout-btn'),
    ordersContainer: document.getElementById('orders-container'),
    profileEmail: document.getElementById('profile-email'),
    productFormTitle: document.getElementById('product-form-title'),
    productIdInput: document.getElementById('product-id-input'),
    productNameInput: document.getElementById('product-name-input'),
    productCategoryInput: document.getElementById('product-category-input'),
    productPriceInput: document.getElementById('product-price-input'),
    productStockInput: document.getElementById('product-stock-input'),
    productImageInput: document.getElementById('product-image-input'),
    productImageFileInput: document.getElementById('product-image-file-input'),
    productImageFitInput: document.getElementById('product-image-fit-input'),
    productImagePositionInput: document.getElementById('product-image-position-input'),
    productImagePreview: document.getElementById('product-image-preview'),
    productDescriptionInput: document.getElementById('product-description-input'),
    saveProductBtn: document.getElementById('save-product-btn'),
    clearProductBtn: document.getElementById('clear-product-btn'),
    adminProductMessage: document.getElementById('admin-product-message'),
    adminProductsContainer: document.getElementById('admin-products-container'),
    adminOrdersContainer: document.getElementById('admin-orders-container'),
    paymentModal: document.getElementById('payment-modal'),
    closePaymentBtn: document.getElementById('close-payment-btn'),
    confirmPaymentBtn: document.getElementById('confirm-payment-btn'),
    paymentTotal: document.getElementById('payment-total'),
    paymentItems: document.getElementById('payment-items'),
    paymentDetails: document.getElementById('payment-details'),
    paymentNameInput: document.getElementById('payment-name-input'),
    paymentRefInput: document.getElementById('payment-ref-input'),
    paymentExpInput: document.getElementById('payment-exp-input'),
    paymentCvvInput: document.getElementById('payment-cvv-input'),
    foodBurstLayer: document.getElementById('food-burst-layer')
};

const state = {
    mode: 'login',
    userEmail: localStorage.getItem('userEmail') || '',
    userRole: localStorage.getItem('userRole') || 'user',
    cart: JSON.parse(localStorage.getItem('snackstoreCart') || '{}'),
    products: [],
    activeCategory: 'All',
    searchTerm: '',
    selectedAddressType: 'Home',
    adminProducts: [],
    adminOrders: [],
    adminSessionToken: sessionStorage.getItem('snackstoreAdminToken') || '',
    paymentMethod: 'UPI'
};

function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function createLocalId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Unable to read the selected image.'));
        reader.readAsDataURL(file);
    });
}

function resolveImageUrl(imageUrl) {
    const raw = String(imageUrl || '').trim();
    if (!raw) {
        return PLACEHOLDER_IMAGE;
    }

    if (raw.startsWith('data:')) {
        return raw;
    }

    if (/^https?:\/\//i.test(raw)) {
        try {
            const url = new URL(raw);
            if (url.pathname.includes('/assets/products/')) {
                return `${LOCAL_ASSET_PREFIX}${url.pathname.split('/').pop()}`;
            }
        } catch {
            return PLACEHOLDER_IMAGE;
        }
    }

    if (raw.startsWith('/assets/')) {
        return raw.slice(1);
    }

    return raw;
}

function normalizeProduct(product) {
    return {
        ...product,
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        imageUrl: resolveImageUrl(product.imageUrl),
        imageFit: product.imageFit || 'cover',
        imagePosition: product.imagePosition || 'center center'
    };
}

function getImageStyle(product) {
    return {
        objectFit: product.imageFit || 'cover',
        objectPosition: product.imagePosition || 'center center'
    };
}

function getLocalProducts() {
    const stored = readJSON(LOCAL_STORAGE_KEYS.products, null);
    if (Array.isArray(stored) && stored.length) {
        return stored.map(normalizeProduct);
    }

    const seeded = DEFAULT_PRODUCTS.map(normalizeProduct);
    writeJSON(LOCAL_STORAGE_KEYS.products, seeded);
    return seeded;
}

function setLocalProducts(products) {
    const normalized = products
        .map(normalizeProduct)
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    writeJSON(LOCAL_STORAGE_KEYS.products, normalized);
    return normalized;
}

function getLocalUsers() {
    const stored = readJSON(LOCAL_STORAGE_KEYS.users, null);
    if (Array.isArray(stored) && stored.length) {
        if (!stored.some(user => user.email === LOCAL_ADMIN_EMAIL)) {
            stored.unshift({
                email: LOCAL_ADMIN_EMAIL,
                password: LOCAL_ADMIN_PASSWORD,
                role: 'admin'
            });
            setLocalUsers(stored);
        }
        return stored;
    }

    const seeded = [{
        email: LOCAL_ADMIN_EMAIL,
        password: LOCAL_ADMIN_PASSWORD,
        role: 'admin'
    }];
    writeJSON(LOCAL_STORAGE_KEYS.users, seeded);
    return seeded;
}

function setLocalUsers(users) {
    writeJSON(LOCAL_STORAGE_KEYS.users, users);
}

function getLocalOrders() {
    const stored = readJSON(LOCAL_STORAGE_KEYS.orders, null);
    if (Array.isArray(stored)) {
        return stored;
    }

    writeJSON(LOCAL_STORAGE_KEYS.orders, []);
    return [];
}

function setLocalOrders(orders) {
    writeJSON(LOCAL_STORAGE_KEYS.orders, orders);
}

function savePendingCheckout(details) {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(details));
}

function loadPendingCheckout() {
    try {
        const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function clearPendingCheckout() {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
}

const PLACEHOLDER_IMAGE = `${LOCAL_ASSET_PREFIX}placeholder-snack.svg`;
const FOOD_SPARKS = [
    { name: 'Crunch Wrap', emoji: '🌯' },
    { name: 'Chili Chips', emoji: '🌶️' },
    { name: 'Mango Pop', emoji: '🥭' },
    { name: 'Cookie Cloud', emoji: '🍪' },
    { name: 'Cheese Bites', emoji: '🧀' },
    { name: 'Fizz Cola', emoji: '🥤' },
    { name: 'Paneer Puff', emoji: '🥟' },
    { name: 'Sundae Swirl', emoji: '🍦' },
    { name: 'Masala Mix', emoji: '🥜' },
    { name: 'Fries Fiesta', emoji: '🍟' }
];
let foodCursorIndex = 0;
const DEFAULT_PRODUCTS = [
    { _id: 'fallback-chips-classic', name: "Lay's Classic Salted", category: 'Chips', price: 25, stock: 60, description: 'Light, crispy and salted potato chips.', imageUrl: `${LOCAL_ASSET_PREFIX}chips-classic.svg` },
    { _id: 'fallback-pringles-sour-cream', name: 'Pringles Sour Cream', category: 'Chips', price: 120, stock: 40, description: 'Stacked potato crisps with creamy onion flavor.', imageUrl: `${LOCAL_ASSET_PREFIX}pringles-sour-cream.svg` },
    { _id: 'fallback-kurkure-masala-munch', name: 'Kurkure Masala Munch', category: 'Chips', price: 20, stock: 75, description: 'Crunchy corn puffs with masala spice.', imageUrl: `${LOCAL_ASSET_PREFIX}kurkure-masala-munch.svg` },
    { _id: 'fallback-himalayan-salt-chips', name: 'Himalayan Salt Chips', category: 'Chips', price: 30, stock: 55, description: 'Lightly salted ridged chips with a deep crunch.', imageUrl: `${LOCAL_ASSET_PREFIX}himalayan-salt-chips.svg` },
    { _id: 'fallback-choco-chip-cookies', name: 'Choco Chip Cookies', category: 'Cookies', price: 35, stock: 55, description: 'Buttery cookies loaded with chocolate chips.', imageUrl: `${LOCAL_ASSET_PREFIX}choco-chip-cookies.svg` },
    { _id: 'fallback-oatmeal-raisin-cookies', name: 'Oatmeal Raisin Cookies', category: 'Cookies', price: 40, stock: 30, description: 'Soft baked oats and raisins in every bite.', imageUrl: `${LOCAL_ASSET_PREFIX}oatmeal-raisin-cookies.svg` },
    { _id: 'fallback-aloo-bhujia-mix', name: 'Aloo Bhujia Mix', category: 'Namkeen', price: 55, stock: 45, description: 'Classic spicy aloo bhujia namkeen.', imageUrl: `${LOCAL_ASSET_PREFIX}aloo-bhujia-mix.svg` },
    { _id: 'fallback-moong-dal-crunch', name: 'Moong Dal Crunch', category: 'Namkeen', price: 65, stock: 35, description: 'Roasted moong dal with savory seasoning.', imageUrl: `${LOCAL_ASSET_PREFIX}moong-dal-crunch.svg` },
    { _id: 'fallback-thums-up', name: 'Thums Up', category: 'Cool Drinks', price: 45, stock: 80, description: 'Bold cola with extra fizz.', imageUrl: `${LOCAL_ASSET_PREFIX}thums-up.svg` },
    { _id: 'fallback-sprite-lemon', name: 'Sprite Lemon', category: 'Cool Drinks', price: 40, stock: 75, description: 'Refreshing lemon-lime soft drink.', imageUrl: `${LOCAL_ASSET_PREFIX}sprite-lemon.svg` },
    { _id: 'fallback-mango-fruit-drink', name: 'Mango Fruit Drink', category: 'Cool Drinks', price: 35, stock: 65, description: 'Sweet and chilled mango drink.', imageUrl: `${LOCAL_ASSET_PREFIX}mango-fruit-drink.svg` },
    { _id: 'fallback-orange-splash', name: 'Orange Splash', category: 'Cool Drinks', price: 38, stock: 52, description: 'Bright citrus drink with a refreshing finish.', imageUrl: `${LOCAL_ASSET_PREFIX}orange-splash.svg` },
    { _id: 'fallback-veggie-burger', name: 'Veggie Burger', category: 'Fast Foods', price: 129, stock: 35, description: 'Grilled veggie patty with fresh toppings.', imageUrl: `${LOCAL_ASSET_PREFIX}veggie-burger.svg` },
    { _id: 'fallback-cheese-pizza-slice', name: 'Cheese Pizza Slice', category: 'Fast Foods', price: 149, stock: 25, description: 'Cheesy pizza with rich tomato sauce.', imageUrl: `${LOCAL_ASSET_PREFIX}cheese-pizza-slice.svg` },
    { _id: 'fallback-crispy-french-fries', name: 'Crispy French Fries', category: 'Fast Foods', price: 99, stock: 50, description: 'Golden and crispy fries with seasoning.', imageUrl: `${LOCAL_ASSET_PREFIX}crispy-french-fries.svg` },
    { _id: 'fallback-spicy-wrap', name: 'Spicy Wrap', category: 'Fast Foods', price: 119, stock: 28, description: 'Loaded wrap with fresh veg and spicy sauce.', imageUrl: `${LOCAL_ASSET_PREFIX}spicy-wrap.svg` },
    { _id: 'fallback-dark-chocolate-bar', name: 'Dark Chocolate Bar', category: 'Chocolate', price: 80, stock: 45, description: 'Rich dark cocoa chocolate bar.', imageUrl: `${LOCAL_ASSET_PREFIX}dark-chocolate-bar.svg` },
    { _id: 'fallback-milk-chocolate-bites', name: 'Milk Chocolate Bites', category: 'Chocolate', price: 60, stock: 60, description: 'Creamy milk chocolate mini bites.', imageUrl: `${LOCAL_ASSET_PREFIX}milk-chocolate-bites.svg` },
    { _id: 'fallback-vanilla-ice-cream-cup', name: 'Vanilla Ice Cream Cup', category: 'Ice Cream', price: 70, stock: 35, description: 'Classic vanilla scoop cup.', imageUrl: `${LOCAL_ASSET_PREFIX}vanilla-ice-cream-cup.svg` },
    { _id: 'fallback-chocolate-sundae', name: 'Chocolate Sundae', category: 'Ice Cream', price: 95, stock: 25, description: 'Creamy sundae with chocolate drizzle.', imageUrl: `${LOCAL_ASSET_PREFIX}chocolate-sundae.svg` }
];

function isAdmin() {
    return state.userRole === 'admin' && Boolean(state.adminSessionToken);
}

function getAdminHeaders() {
    if (!isAdmin()) {
        return {};
    }

    return {
        'x-admin-token': state.adminSessionToken
    };
}

function setSectionVisibility(showApp) {
    elements.authSection.style.display = showApp ? 'none' : 'block';
    elements.appShell.style.display = showApp ? 'block' : 'none';
    elements.navLinks.style.display = showApp ? 'flex' : 'none';
}

function formatCurrency(value) {
    return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}

function makeQueryString(params = {}) {
    const entries = Object.entries(params).filter(([, value]) => value && value !== 'All');
    if (!entries.length) {
        return '';
    }

    return `?${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')}`;
}

function saveCart() {
    localStorage.setItem('snackstoreCart', JSON.stringify(state.cart));
}

function saveAdminAuth() {
    if (isAdmin()) {
        sessionStorage.setItem('snackstoreAdminToken', state.adminSessionToken);
    } else {
        sessionStorage.removeItem('snackstoreAdminToken');
    }
}

function getCartItems() {
    return Object.entries(state.cart).map(([id, item]) => ({ id, ...item }));
}

function getCartTotals() {
    const items = getCartItems();
    const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
    const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    return { itemCount, total };
}

function setAuthMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.authMode === mode));
    elements.authTitle.textContent = mode === 'register' ? 'Create your account' : 'Welcome back';
    elements.authSubtitle.textContent = mode === 'register'
        ? 'Register once and use the same login for future orders.'
        : 'Login to continue your snack journey.';
    elements.authSubmitBtn.textContent = mode === 'register' ? 'Register' : 'Login';
    elements.authSubmitBtn.dataset.mode = mode;
}

function setActiveCategory(category) {
    state.activeCategory = category;
    if (category !== 'All') {
        state.searchTerm = '';
        elements.searchInput.value = '';
    }
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.classList.toggle('active', button.dataset.filter === category);
    });
    renderProducts();
}

function showAuth() {
    setSectionVisibility(false);
    elements.authMessage.textContent = '';
    elements.authMessage.style.color = '';
}

function showApp() {
    setSectionVisibility(true);
    elements.cartSection.style.display = 'none';
    elements.profileSection.style.display = 'none';
    elements.adminSection.style.display = 'none';
    closePaymentModal();
    updateBanner();
    if (PAGE_MODE === 'catalogue') {
        renderProducts();
    }
    updateCartUI();
    syncAdminButton();
}

function showCart() {
    setSectionVisibility(true);
    elements.profileSection.style.display = 'none';
    elements.adminSection.style.display = 'none';
    closePaymentModal();
    elements.cartSection.style.display = 'block';
    elements.productList.parentElement.style.display = PAGE_MODE === 'catalogue' ? 'block' : 'none';
    elements.cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateCartUI();
}

async function showProfile() {
    setSectionVisibility(true);
    elements.cartSection.style.display = 'none';
    elements.adminSection.style.display = 'none';
    closePaymentModal();
    elements.profileSection.style.display = 'block';
    elements.productList.parentElement.style.display = PAGE_MODE === 'catalogue' ? 'block' : 'none';
    elements.profileEmail.textContent = state.userEmail ? `Signed in as ${state.userEmail}` : '';
    await fetchOrders();
    elements.profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function showAdmin() {
    if (!isAdmin()) {
        alert('Admin access required.');
        return;
    }

    setSectionVisibility(true);
    elements.cartSection.style.display = 'none';
    elements.profileSection.style.display = 'none';
    closePaymentModal();
    elements.adminSection.style.display = 'block';
    elements.productList.parentElement.style.display = PAGE_MODE === 'catalogue' ? 'block' : 'none';
    elements.adminSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    await Promise.all([loadAdminProducts(), loadAdminOrders()]);
}

function updatePaymentForm() {
    const isCash = state.paymentMethod === 'Cash on Delivery';
    elements.paymentNameInput.style.display = isCash ? 'none' : 'block';
    elements.paymentRefInput.style.display = isCash ? 'none' : 'block';
    elements.paymentExpInput.style.display = isCash ? 'none' : 'block';
    elements.paymentCvvInput.style.display = isCash ? 'none' : 'block';
}

function openPaymentModal() {
    const totals = getCartTotals();
    elements.paymentTotal.textContent = formatCurrency(totals.total);
    elements.paymentItems.textContent = String(totals.itemCount);
    const pendingCheckout = loadPendingCheckout() || {};
    const cartItems = getCartItems();
    const details = [
        `Email: ${state.userEmail || 'Guest'}`,
        `Address type: ${pendingCheckout.addressType || state.selectedAddressType}`,
        `Address: ${pendingCheckout.address || elements.deliveryAddress.value || 'Not set'}`,
        `Method: ${pendingCheckout.paymentMethod || state.paymentMethod}`,
        `Items: ${cartItems.map(item => `${item.name} x${item.qty}`).join(', ') || 'No items'}`
    ];
    if (elements.paymentDetails) {
        elements.paymentDetails.innerHTML = details.map(line => `<div class="payment-detail-line">${line}</div>`).join('');
    }
    elements.paymentModal.style.display = 'grid';
    updatePaymentForm();
}

function closePaymentModal() {
    elements.paymentModal.style.display = 'none';
}

function spawnFoodBurst(x, y) {
    if (!elements.foodBurstLayer) return;

    const foodItem = FOOD_SPARKS[foodCursorIndex % FOOD_SPARKS.length];
    foodCursorIndex += 1;
    const burst = document.createElement('div');
    burst.className = 'food-burst';
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    burst.innerHTML = `<span class="food-burst-symbol">${foodItem.emoji}</span><span>${foodItem.name}</span>`;
    elements.foodBurstLayer.appendChild(burst);

    window.setTimeout(() => burst.remove(), 1400);
}

function syncAdminButton() {
    elements.adminBtn.style.display = isAdmin() ? 'inline-flex' : 'none';
}

function goToPage(page) {
    window.location.href = page;
}

function updateBanner() {
    if (state.userEmail === 'Guest') {
        elements.heroTitle.textContent = 'Welcome, guest explorer.';
        elements.heroSubtitle.textContent = 'Browse the whole store, fill your cart, and get inspired before logging in to checkout.';
    } else if (isAdmin()) {
        elements.heroTitle.textContent = 'SnackStore admin studio.';
        elements.heroSubtitle.textContent = 'Manage products, refresh the menu, and keep deliveries moving through every stage.';
    } else {
        elements.heroTitle.textContent = 'Craving something delicious?';
        elements.heroSubtitle.textContent = 'Pick from crunchy snacks, chilled drinks, and hot favorites with a cleaner, faster store experience.';
    }
}

function getActiveFilters() {
    return {
        category: state.activeCategory,
        search: state.searchTerm.trim()
    };
}

function buildCategoryRail(categories) {
    const railCategories = ['All', ...categories];
    elements.categoryRail.innerHTML = railCategories.map(category => (
        `<button class="chip ${category === 'All' ? 'active' : ''}" type="button" data-filter="${category}">${category}</button>`
    )).join('');
}

function matchesFilters(product) {
    const matchesCategory = state.activeCategory === 'All' || product.category === state.activeCategory;
    const term = state.searchTerm.trim().toLowerCase();
    const matchesSearch = !term
        || product.name.toLowerCase().includes(term)
        || product.category.toLowerCase().includes(term)
        || (product.description || '').toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
}

function renderProducts() {
    const products = state.products.filter(matchesFilters);
    elements.productCount.textContent = state.products.length;
    elements.categoryCount.textContent = new Set(state.products.map(product => product.category)).size;
    elements.toolbarNote.textContent = state.activeCategory === 'All'
        ? `Showing ${products.length} products`
        : `Showing only ${state.activeCategory.toLowerCase()} items`;

    if (!products.length) {
        elements.productList.innerHTML = '<div class="empty-state">No matching items found. Try a different search or category.</div>';
        return;
    }

    const template = document.getElementById('product-template');
    elements.productList.innerHTML = '';

    products.forEach(product => {
        const card = template.content.cloneNode(true);
        const article = card.querySelector('.product-card');
        const image = card.querySelector('.product-image');
        const category = card.querySelector('.category');
        const stock = card.querySelector('.stock-pill');
        const title = card.querySelector('h3');
        const description = card.querySelector('.product-description');
        const price = card.querySelector('.price');
        const addBtn = card.querySelector('.add-btn');

        image.src = resolveImageUrl(product.imageUrl);
        image.alt = product.name;
        const imageStyle = getImageStyle(product);
        image.style.objectFit = imageStyle.objectFit;
        image.style.objectPosition = imageStyle.objectPosition;
        image.onerror = () => {
            image.src = PLACEHOLDER_IMAGE;
        };

        category.textContent = product.category;
        stock.textContent = `${product.stock || 0} in stock`;
        title.textContent = product.name;
        description.textContent = product.description || 'Freshly picked for your snack run.';
        price.textContent = formatCurrency(product.price);
        addBtn.textContent = state.cart[product._id] ? 'Add one more' : 'Add to Cart';
        addBtn.addEventListener('click', () => addToCart(product._id));

        article.dataset.productId = product._id;
        elements.productList.appendChild(card);
    });
}

async function refreshProducts() {
    await Promise.resolve();
    renderProducts();
}

function renderStatusTrail(status) {
    const activeIndex = ORDER_STATUSES.indexOf(status);
    return `
        <div class="status-grid">
            ${ORDER_STATUSES.map((step, index) => `
                <span class="status-chip ${index <= activeIndex ? 'active' : ''}">${step}</span>
            `).join('')}
        </div>
    `;
}

function addToCart(productId) {
    const product = state.products.find(item => item._id === productId);
    if (!product) {
        return;
    }

    if (!state.cart[productId]) {
        state.cart[productId] = {
            _id: product._id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
            imageFit: product.imageFit,
            imagePosition: product.imagePosition,
            qty: 1
        };
    } else {
        state.cart[productId].qty += 1;
    }

    saveCart();
    updateCartUI();
}

function incrementCartItem(productId) {
    if (!state.cart[productId]) return;
    state.cart[productId].qty += 1;
    saveCart();
    updateCartUI();
}

function decrementCartItem(productId) {
    if (!state.cart[productId]) return;
    state.cart[productId].qty -= 1;
    if (state.cart[productId].qty <= 0) {
        delete state.cart[productId];
    }
    saveCart();
    updateCartUI();
}

function removeFromCart(productId) {
    delete state.cart[productId];
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    const cartItems = getCartItems();
    const totals = getCartTotals();
    elements.cartBtn.textContent = `Cart (${totals.itemCount})`;
    elements.cartCountStat.textContent = totals.itemCount;
    elements.cartTotalPrice.textContent = formatCurrency(totals.total);
    elements.cartSummaryText.textContent = `${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'}`;

    if (!cartItems.length) {
        elements.cartItemsContainer.innerHTML = '<div class="empty-state">Your cart is empty. Add something tasty from the menu above.</div>';
        return;
    }

    elements.cartItemsContainer.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <img src="${item.imageUrl || PLACEHOLDER_IMAGE}" alt="${item.name}" class="cart-item-img" style="object-fit:${item.imageFit || 'cover'};object-position:${item.imagePosition || 'center center'}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <div>
                    <strong>${item.name}</strong>
                    <p>${formatCurrency(item.price)}</p>
                </div>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" type="button" onclick="decrementCartItem('${item.id}')">-</button>
                <strong>${item.qty}</strong>
                <button class="qty-btn" type="button" onclick="incrementCartItem('${item.id}')">+</button>
                <button class="remove-btn" type="button" onclick="removeFromCart('${item.id}')">x</button>
            </div>
        </div>
    `).join('');
}

async function loadProducts() {
    state.products = getLocalProducts();
    if (PAGE_MODE === 'catalogue') {
        buildCategoryRail([...new Set(state.products.map(product => product.category))]);
        renderProducts();
    }

    try {
        const response = await fetch(`${API_BASE}/products`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Failed to load products');
        }

        const allProducts = await response.json();
        if (Array.isArray(allProducts) && allProducts.length > 0) {
            state.products = setLocalProducts(allProducts);
            if (PAGE_MODE === 'catalogue') {
                buildCategoryRail([...new Set(allProducts.map(product => product.category))]);
                renderProducts();
            }
        }
    } catch (error) {
        if (PAGE_MODE === 'catalogue') {
            renderProducts();
        }
    }
}

async function loadAdminProducts() {
    try {
        const response = await fetch(`${API_BASE}/admin/products`, {
            headers: getAdminHeaders(),
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('backend');
        }

        state.adminProducts = (await response.json()).map(normalizeProduct);
    } catch {
        state.adminProducts = getLocalProducts();
        elements.adminProductMessage.textContent = 'Backend unavailable. Showing local inventory.';
        elements.adminProductMessage.style.color = '#1f7a4d';
    }

    renderAdminProducts();
}

async function loadAdminOrders() {
    try {
        const response = await fetch(`${API_BASE}/admin/orders`, {
            headers: getAdminHeaders(),
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('backend');
        }

        state.adminOrders = await response.json();
    } catch {
        state.adminOrders = getLocalOrders();
    }

    renderAdminOrders();
}

function renderAdminProducts() {
    if (!state.adminProducts.length) {
        elements.adminProductsContainer.innerHTML = '<div class="empty-state">No products available. Add the first one using the form on the left.</div>';
        return;
    }

    elements.adminProductsContainer.innerHTML = `
        <div class="admin-product-list">
            ${state.adminProducts.map(product => `
                <div class="admin-row">
                    <div class="admin-product-meta">
                        <img src="${resolveImageUrl(product.imageUrl)}" alt="${product.name}" class="admin-thumb" style="object-fit:${product.imageFit || 'cover'};object-position:${product.imagePosition || 'center center'}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                    </div>
                    <div class="admin-product-copy">
                        <strong>${product.name}</strong>
                        <p>${product.category} | ${formatCurrency(product.price)} | Stock ${product.stock}</p>
                    </div>
                    <div class="admin-row-actions">
                        <button class="btn-secondary" type="button" onclick="editProduct('${product._id}')">Edit</button>
                        <button class="btn-ghost" type="button" onclick="deleteProduct('${product._id}')">Delete</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderAdminOrders() {
    if (!state.adminOrders.length) {
        elements.adminOrdersContainer.innerHTML = '<div class="empty-state">No orders have been placed yet.</div>';
        return;
    }

    elements.adminOrdersContainer.innerHTML = `
        <div class="admin-order-list">
            ${state.adminOrders.map(order => {
                const dateStr = new Date(order.date).toLocaleString();
                const items = order.items.map(item => `${item.name} x${item.qty || 1}`).join(', ');
                return `
                    <div class="admin-row">
                        <div>
                            <strong>${order.userEmail}</strong>
                            <p>${dateStr}</p>
                            <p>${items}</p>
                            <p>${order.addressType} - ${order.address}</p>
                            <p>Payment: ${order.paymentMethod || 'UPI'}</p>
                            <p>${formatCurrency(order.total)}</p>
                        </div>
                        <div class="admin-row-actions">
                            ${ORDER_STATUSES.map(status => `
                                <button class="btn-secondary" type="button" onclick="updateOrderStatus('${order._id}', '${status}')">${status}</button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function clearProductForm() {
    elements.productIdInput.value = '';
    elements.productNameInput.value = '';
    elements.productCategoryInput.value = 'Chips';
    elements.productPriceInput.value = '';
    elements.productStockInput.value = '';
    elements.productImageInput.value = '';
    elements.productImageFileInput.value = '';
    elements.productImageFitInput.value = 'cover';
    elements.productImagePositionInput.value = 'center center';
    elements.productDescriptionInput.value = '';
    elements.productFormTitle.textContent = 'Add a product';
    elements.adminProductMessage.textContent = '';
    if (elements.productImagePreview) {
        elements.productImagePreview.src = PLACEHOLDER_IMAGE;
    }
}

function editProduct(productId) {
    const product = state.adminProducts.find(item => item._id === productId);
    if (!product) return;

    elements.productIdInput.value = product._id;
    elements.productNameInput.value = product.name;
    elements.productCategoryInput.value = product.category;
    elements.productPriceInput.value = product.price;
    elements.productStockInput.value = product.stock;
    elements.productImageInput.value = product.imageUrl;
    elements.productImageFitInput.value = product.imageFit || 'cover';
    elements.productImagePositionInput.value = product.imagePosition || 'center center';
    elements.productDescriptionInput.value = product.description || '';
    elements.productFormTitle.textContent = 'Edit product';
    if (elements.productImagePreview) {
        elements.productImagePreview.src = resolveImageUrl(product.imageUrl);
        elements.productImagePreview.style.objectFit = product.imageFit || 'cover';
        elements.productImagePreview.style.objectPosition = product.imagePosition || 'center center';
    }
    elements.adminSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveProduct() {
    if (!isAdmin()) {
        elements.adminProductMessage.textContent = 'Admin access required.';
        elements.adminProductMessage.style.color = '#c8461d';
        return;
    }

    const uploadedFile = elements.productImageFileInput.files && elements.productImageFileInput.files[0];
    let imageUrl = elements.productImageInput.value.trim();
    if (uploadedFile) {
        imageUrl = await readFileAsDataUrl(uploadedFile);
    }

    const payload = {
        name: elements.productNameInput.value.trim(),
        category: elements.productCategoryInput.value,
        price: Number(elements.productPriceInput.value),
        stock: Number(elements.productStockInput.value || 0),
        imageUrl,
        imageFit: elements.productImageFitInput.value,
        imagePosition: elements.productImagePositionInput.value,
        description: elements.productDescriptionInput.value.trim()
    };

    if (!payload.name || !payload.category || !payload.price || !payload.imageUrl) {
        elements.adminProductMessage.textContent = 'Please complete the required product fields.';
        elements.adminProductMessage.style.color = '#c8461d';
        return;
    }

    const editingId = elements.productIdInput.value;
    const endpoint = editingId ? `${API_BASE}/admin/products/${editingId}` : `${API_BASE}/admin/products`;
    const method = editingId ? 'PUT' : 'POST';

    try {
        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...getAdminHeaders()
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Unable to save product.');
        }

        elements.adminProductMessage.textContent = data.message || 'Saved.';
        elements.adminProductMessage.style.color = '#1f7a4d';
        clearProductForm();
        await Promise.all([loadProducts(), loadAdminProducts()]);
    } catch (error) {
        const localProducts = getLocalProducts();
        const editingId = elements.productIdInput.value;
        const nextProduct = {
            _id: editingId || createLocalId('product'),
            ...payload
        };

        const updatedProducts = editingId
            ? localProducts.map(product => product._id === editingId ? nextProduct : product)
            : [...localProducts, nextProduct];

        state.products = setLocalProducts(updatedProducts);
        state.adminProducts = state.products.slice().sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
        renderProducts();
        renderAdminProducts();
        clearProductForm();
        elements.adminProductMessage.textContent = 'Saved locally because the backend is unavailable.';
        elements.adminProductMessage.style.color = '#1f7a4d';
    }
}

async function deleteProduct(productId) {
    if (!isAdmin()) return;

    if (!confirm('Delete this product?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/products/${productId}`, {
            method: 'DELETE',
            headers: getAdminHeaders()
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Unable to delete product.');
        }

        await Promise.all([loadProducts(), loadAdminProducts()]);
    } catch (error) {
        const remaining = getLocalProducts().filter(product => product._id !== productId);
        state.products = setLocalProducts(remaining);
        state.adminProducts = state.products.slice();
        renderProducts();
        renderAdminProducts();
        alert('Deleted locally because the backend is unavailable.');
    }
}

async function updateOrderStatus(orderId, status) {
    if (!isAdmin()) return;

    try {
        const response = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAdminHeaders()
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Unable to update order status.');
        }

        await Promise.all([loadAdminOrders(), fetchOrders()]);
    } catch (error) {
        const orders = getLocalOrders().map(order => order._id === orderId ? { ...order, status } : order);
        setLocalOrders(orders);
        state.adminOrders = orders;
        renderAdminOrders();
        await fetchOrders();
        alert('Order status updated locally because the backend is unavailable.');
    }
}

async function loginOrRegister() {
    const email = elements.emailInput.value.trim().toLowerCase();
    const password = elements.passwordInput.value;
    const mode = elements.authSubmitBtn.dataset.mode || state.mode;

    if (!email || !password) {
        elements.authMessage.textContent = 'Please fill in both fields.';
        elements.authMessage.style.color = '#c8461d';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${mode === 'register' ? 'register' : 'login'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            elements.authMessage.textContent = data.message || 'Authentication failed.';
            elements.authMessage.style.color = '#c8461d';
            return;
        }

        state.userEmail = data.email || email;
        state.userRole = data.role || 'user';
        localStorage.setItem('userEmail', state.userEmail);
        localStorage.setItem('userRole', state.userRole);

        state.adminSessionToken = data.adminToken || '';
        saveAdminAuth();

        elements.authMessage.textContent = data.message || 'Welcome in.';
        elements.authMessage.style.color = '#1f7a4d';
        syncAdminButton();
        showApp();
        if (state.userRole === 'admin') {
            await showAdmin();
        }
    } catch (error) {
        const localUsers = getLocalUsers();
        if (mode === 'register') {
            if (localUsers.some(user => user.email === email)) {
                elements.authMessage.textContent = 'That email is already registered locally.';
                elements.authMessage.style.color = '#c8461d';
                return;
            }

            localUsers.push({ email, password, role: 'user' });
            setLocalUsers(localUsers);
            elements.authMessage.textContent = 'Registered locally. You can now log in.';
            elements.authMessage.style.color = '#1f7a4d';
            return;
        }

        const localUser = localUsers.find(user => user.email === email && user.password === password);
        if (!localUser) {
            elements.authMessage.textContent = 'Unable to reach the backend and no local account matched your login.';
            elements.authMessage.style.color = '#c8461d';
            return;
        }

        state.userEmail = localUser.email;
        state.userRole = localUser.role || 'user';
        localStorage.setItem('userEmail', state.userEmail);
        localStorage.setItem('userRole', state.userRole);
        state.adminSessionToken = localUser.role === 'admin' ? LOCAL_ADMIN_TOKEN : '';
        saveAdminAuth();

        elements.authMessage.textContent = 'Signed in using local demo mode.';
        elements.authMessage.style.color = '#1f7a4d';
        syncAdminButton();
        showApp();
        if (state.userRole === 'admin') {
            await showAdmin();
        }
    }
}

function guestLogin() {
    state.userEmail = 'Guest';
    state.userRole = 'user';
    localStorage.setItem('userEmail', 'Guest');
    localStorage.setItem('userRole', 'user');
    state.adminSessionToken = '';
    saveAdminAuth();
    syncAdminButton();
    showApp();
}

function processCheckout() {
    if (state.userEmail === 'Guest') {
        alert('Guests can browse, but checkout needs a registered account.');
        showAuth();
        return;
    }

    const cartItems = getCartItems();
    if (!cartItems.length) {
        alert('Your cart is empty.');
        return;
    }

    const address = elements.deliveryAddress.value.trim();
    if (!address) {
        alert('Please enter a delivery address.');
        return;
    }

    savePendingCheckout({
        address,
        addressType: state.selectedAddressType,
        paymentMethod: state.paymentMethod
    });

    if (PAGE_MODE === 'checkout') {
        openPaymentModal();
        return;
    }

    window.location.href = 'checkout.html';
}

async function placeOrder() {
    const cartItems = getCartItems();
    const pendingCheckout = loadPendingCheckout() || {};
    const address = (elements.deliveryAddress.value || pendingCheckout.address || '').trim();
    const totals = getCartTotals();
    const payload = {
        userEmail: state.userEmail,
        items: cartItems.map(item => ({
            _id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            imageUrl: item.imageUrl,
            imageFit: item.imageFit,
            imagePosition: item.imagePosition
        })),
        total: totals.total,
        address,
        addressType: pendingCheckout.addressType || state.selectedAddressType,
        paymentMethod: pendingCheckout.paymentMethod || state.paymentMethod
    };

    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Checkout failed');
        }

        alert('Success. Your order is now being prepared.');
        state.cart = {};
        saveCart();
        elements.deliveryAddress.value = '';
        clearPendingCheckout();
        updateCartUI();
        await showProfile();
    } catch (error) {
        const localOrders = getLocalOrders();
        localOrders.unshift({
            _id: createLocalId('order'),
            userEmail: payload.userEmail,
            items: payload.items,
            total: payload.total,
            address: payload.address,
            addressType: payload.addressType,
            paymentMethod: payload.paymentMethod,
            status: 'Preparing',
            date: new Date().toISOString()
        });
        setLocalOrders(localOrders);

        alert('Order stored locally because the backend is unavailable.');
        state.cart = {};
        saveCart();
        elements.deliveryAddress.value = '';
        clearPendingCheckout();
        updateCartUI();
        await showProfile();
    }
}

function setPaymentMethod(method) {
    state.paymentMethod = method;
    document.querySelectorAll('[data-payment]').forEach(button => {
        button.classList.toggle('active', button.dataset.payment === method);
    });
    updatePaymentForm();
}

async function fetchOrders() {
    if (!state.userEmail || state.userEmail === 'Guest') {
        elements.ordersContainer.innerHTML = '<div class="empty-state">Guests do not have an order history. Please log in to track deliveries.</div>';
        return;
    }

    elements.ordersContainer.innerHTML = '<div class="empty-state">Loading your orders...</div>';

    try {
        const response = await fetch(`${API_BASE}/orders/${state.userEmail}`);
        if (!response.ok) {
            throw new Error('backend');
        }

        const orders = await response.json();

        if (!orders.length) {
            elements.ordersContainer.innerHTML = '<div class="empty-state">You have no past orders yet.</div>';
            return;
        }

        elements.ordersContainer.innerHTML = orders.map(order => {
            const dateStr = new Date(order.date).toLocaleString();
            const items = order.items.map(item => `${item.name} x${item.qty || 1}`).join(', ');

            return `
                <div class="order-card">
                    <div class="order-header">
                        <strong>${dateStr}</strong>
                        <span class="order-status">${order.status}</span>
                    </div>
                    <p class="order-items"><strong>Items:</strong> ${items}</p>
                    <p class="order-items"><strong>Total:</strong> ${formatCurrency(order.total)}</p>
                    <p class="order-items"><strong>Delivery:</strong> ${order.addressType} - ${order.address}</p>
                    <p class="order-items"><strong>Payment:</strong> ${order.paymentMethod || 'UPI'}</p>
                    ${renderStatusTrail(order.status)}
                </div>
            `;
        }).join('');
    } catch (error) {
        const localOrders = getLocalOrders().filter(order => order.userEmail === state.userEmail.toLowerCase());
        if (!localOrders.length) {
            elements.ordersContainer.innerHTML = '<div class="empty-state">You have no past orders yet.</div>';
            return;
        }

        elements.ordersContainer.innerHTML = localOrders.map(order => {
            const dateStr = new Date(order.date).toLocaleString();
            const items = order.items.map(item => `${item.name} x${item.qty || 1}`).join(', ');

            return `
                <div class="order-card">
                    <div class="order-header">
                        <strong>${dateStr}</strong>
                        <span class="order-status">${order.status}</span>
                    </div>
                    <p class="order-items"><strong>Items:</strong> ${items}</p>
                    <p class="order-items"><strong>Total:</strong> ${formatCurrency(order.total)}</p>
                    <p class="order-items"><strong>Delivery:</strong> ${order.addressType} - ${order.address}</p>
                    <p class="order-items"><strong>Payment:</strong> ${order.paymentMethod || 'UPI'}</p>
                    ${renderStatusTrail(order.status)}
                </div>
            `;
        }).join('');
    }
}

function bindEvents() {
    document.getElementById('logo-btn').addEventListener('click', () => {
        goToPage('index.html');
    });

    document.getElementById('cart-btn').addEventListener('click', () => goToPage('cart.html'));
    document.getElementById('profile-btn').addEventListener('click', async () => {
        if (!state.userEmail) {
            showAuth();
            return;
        }

        if (state.userEmail === 'Guest') {
            alert('Guests do not have an order profile. Please log in.');
            return;
        }

        await showProfile();
    });
    elements.adminBtn.addEventListener('click', () => goToPage('admin.html'));

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        state.userEmail = '';
        state.userRole = 'user';
        state.adminSessionToken = '';
        saveAdminAuth();
        state.cart = {};
        saveCart();
        updateCartUI();
        syncAdminButton();
        showAuth();
    });

    document.getElementById('shop-now-btn').addEventListener('click', () => {
        document.querySelector('.product-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('view-cart-btn').addEventListener('click', () => goToPage('cart.html'));
    elements.guestLoginBtn.addEventListener('click', guestLogin);

    document.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        spawnFoodBurst(event.clientX, event.clientY);
    });

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => setAuthMode(tab.dataset.authMode));
    });

    elements.authSubmitBtn.addEventListener('click', loginOrRegister);
    elements.searchInput.addEventListener('input', event => {
        state.searchTerm = event.target.value;
        renderProducts();
    });

    elements.categoryRail.addEventListener('click', event => {
        const button = event.target.closest('[data-filter]');
        if (!button) return;
        setActiveCategory(button.dataset.filter);
    });

    document.querySelectorAll('[data-address]').forEach(button => {
        button.addEventListener('click', () => {
            state.selectedAddressType = button.dataset.address;
            document.querySelectorAll('[data-address]').forEach(btn => btn.classList.toggle('active', btn === button));
        });
    });

    elements.checkoutBtn.addEventListener('click', processCheckout);
    elements.confirmPaymentBtn.addEventListener('click', placeOrder);
    elements.closePaymentBtn.addEventListener('click', closePaymentModal);
    elements.paymentModal.addEventListener('click', event => {
        if (event.target === elements.paymentModal) {
            closePaymentModal();
        }
    });
    document.querySelectorAll('[data-payment]').forEach(button => {
        button.addEventListener('click', () => setPaymentMethod(button.dataset.payment));
    });
    elements.saveProductBtn.addEventListener('click', saveProduct);
    elements.clearProductBtn.addEventListener('click', clearProductForm);
    elements.productImageFileInput.addEventListener('change', async event => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }

        const dataUrl = await readFileAsDataUrl(file);
        elements.productImageInput.value = dataUrl;
        if (elements.productImagePreview) {
            elements.productImagePreview.src = dataUrl;
        }
    });
    elements.productImageInput.addEventListener('input', event => {
        if (elements.productImagePreview) {
            elements.productImagePreview.src = event.target.value.trim() || PLACEHOLDER_IMAGE;
        }
    });
    elements.productImageFitInput.addEventListener('change', () => {
        if (elements.productImagePreview) {
            elements.productImagePreview.style.objectFit = elements.productImageFitInput.value;
        }
    });
    elements.productImagePositionInput.addEventListener('change', () => {
        if (elements.productImagePreview) {
            elements.productImagePreview.style.objectPosition = elements.productImagePositionInput.value;
        }
    });
}

async function bootstrap() {
    bindEvents();
    setAuthMode('login');
    setPaymentMethod('UPI');
    closePaymentModal();
    updateCartUI();

    if (state.userEmail === 'Guest') {
        state.userRole = 'user';
    }

    try {
        await loadProducts();
    } catch (error) {
        elements.productList.innerHTML = '<div class="empty-state">We could not load products right now. Please start the backend server and refresh.</div>';
    }

    syncAdminButton();

    if (PAGE_MODE === 'cart' && !state.userEmail) {
        state.userEmail = 'Guest';
        state.userRole = 'user';
    }

    if (PAGE_MODE === 'cart' && state.userEmail === 'Guest') {
        showApp();
        showCart();
        return;
    }

    if (state.userEmail) {
        showApp();
        if (PAGE_MODE === 'admin' && isAdmin()) {
            await showAdmin();
        } else if (PAGE_MODE === 'cart') {
            showCart();
        } else if (PAGE_MODE === 'checkout') {
            showCart();
            const pendingCheckout = loadPendingCheckout();
            if (pendingCheckout) {
                state.selectedAddressType = pendingCheckout.addressType || state.selectedAddressType;
                state.paymentMethod = pendingCheckout.paymentMethod || state.paymentMethod;
                if (elements.deliveryAddress) {
                    elements.deliveryAddress.value = pendingCheckout.address || '';
                }
                updatePaymentForm();
                openPaymentModal();
            }
        } else if (isAdmin()) {
            await showAdmin();
        } else if (state.userEmail !== 'Guest') {
            await fetchOrders();
        }
    } else {
        showAuth();
    }
}

window.addToCart = addToCart;
window.incrementCartItem = incrementCartItem;
window.decrementCartItem = decrementCartItem;
window.removeFromCart = removeFromCart;
window.processCheckout = processCheckout;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;

window.addEventListener('DOMContentLoaded', bootstrap);
