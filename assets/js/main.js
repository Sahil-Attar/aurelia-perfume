// Shared functionality across all pages

const CART_KEY = "aurelia_cart";

// Format currency
function formatCurrency(amount) {
    return "₹" + amount.toFixed(2).replace(/\.00$/, "");
}

// Get cart from local storage
function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

// Update cart count badge in navbar
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const badge = document.getElementById("cart-count-badge");
    if (badge) {
        badge.textContent = count;
        // Optionally hide if 0
        // badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// Add to Cart from product cards
function addToCart(productId) {
    let cart = getCart();
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    showToast("Added to cart");
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <strong>${message}</strong>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
});
