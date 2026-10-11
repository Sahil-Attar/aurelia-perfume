// Shared functionality across all pages

const CART_KEY = "aurelia_cart";
const COUPON_KEY = "aurelia_coupon";
const SHIPPING_FEE = 50;

// Scent Aura X WhatsApp business phone number
const WHATSAPP_PHONE = "919876543210";

// Predefined coupons
const VALID_COUPONS = {
    "AURELIA10": { type: "percent", value: 10, label: "10% Off" },
    "SCENT10": { type: "percent", value: 10, label: "10% Off" },
    "WELCOME50": { type: "flat", value: 50, label: "₹50 Off" },
    "ATTAR50": { type: "flat", value: 50, label: "₹50 Off" }
};

// Format currency
function formatCurrency(amount) {
    if (typeof amount !== 'number') amount = parseFloat(amount) || 0;
    return "₹" + Math.round(amount);
}

// Get cart from local storage
function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

// Update cart count badge in navbar
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    const badge = document.getElementById("cart-count-badge");
    if (badge) {
        badge.textContent = count;
    }
}

// Add to Cart from product details or cards
function addToCart(productId) {
    let cart = getCart();
    const selectEl = document.getElementById(`var-${productId}`);
    let variationId = "3ml";
    
    if (selectEl) {
        variationId = selectEl.value;
    }
    
    const cartItemId = `${productId}_${variationId}`;
    const existingItem = cart.find(item => item.cartItemId === cartItemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            cartItemId: cartItemId, 
            id: productId, 
            variationId: variationId, 
            quantity: 1 
        });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    showToast("Added to cart");
}

// Add to Cart with specific quantity
function addToCartWithQty(productId, variationId, qty) {
    let cart = getCart();
    const cartItemId = `${productId}_${variationId}`;
    
    const existingItem = cart.find(item => item.cartItemId === cartItemId);
    
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({ 
            cartItemId: cartItemId, 
            id: productId, 
            variationId: variationId, 
            quantity: qty 
        });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    showToast(`Added ${qty} item(s) to cart`);
}

// Update price display when variation changes
function updatePriceDisplay(productId) {
    const selectEl = document.getElementById(`var-${productId}`);
    const priceEl = document.getElementById(`price-${productId}`);
    if (selectEl && priceEl) {
        const variation = getProductVariation(productId, selectEl.value);
        if (variation) {
            priceEl.textContent = formatCurrency(variation.price);
        }
    }
}

// Show toast notification
function showToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    
    const toast = document.createElement("div");
    toast.className = "custom-toast";
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
});
