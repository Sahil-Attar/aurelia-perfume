// Shared functionality across all pages

const CART_KEY = "aurelia_cart";
const COUPON_KEY = "aurelia_coupon";
const SHIPPING_FEE = 50;

// Scent Aura X WhatsApp business phone number
const WHATSAPP_PHONE = "919021336695";

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

// Update cart count badge in navbar & mobile drawer
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    const badge = document.getElementById("cart-count-badge");
    if (badge) {
        badge.textContent = count;
    }
    const mobileCounter = document.querySelector(".mobile-drawer-cart-count");
    if (mobileCounter) {
        mobileCounter.textContent = count;
    }
}

// Update copyright year dynamically on all pages
function updateCopyrightYear() {
    const yearEls = document.querySelectorAll("#current-year, .current-year");
    const currentYear = new Date().getFullYear();
    yearEls.forEach(el => {
        el.textContent = currentYear;
    });
}

// Add to Cart from product details or cards
function addToCart(productId) {
    let cart = getCart();
    const selectEl = document.getElementById(`var-${productId}`);
    let variationId = "3ml";

    if (selectEl) {
        variationId = selectEl.value;
    }

    addToCartWithQty(productId, variationId, 1);
}

// Add to Cart with specific quantity
function addToCartWithQty(productId, variationId, qty) {
    let cart = getCart();
    const product = getProductById(productId);
    const variation = getProductVariation(productId, variationId);

    const safeVarId = variation ? variation.id : (variationId || "3ml");
    const safeVarName = variation ? variation.name : safeVarId;
    const safePrice = variation ? variation.price : (product && product.variations ? product.variations[0].price : 399);
    const safeName = product ? product.name : "Attar Fragrance";
    const safeImg = (product && product.imageUrl) ? product.imageUrl : "assets/images/prod-oud-royal.jpg";
    const cartItemId = `${productId}_${safeVarId}`;

    const existingIndex = cart.findIndex(item =>
        (item.cartItemId && item.cartItemId === cartItemId) ||
        (String(item.id).toLowerCase() === String(productId).toLowerCase() && String(item.variationId).toLowerCase() === String(safeVarId).toLowerCase())
    );

    const parsedQty = Math.max(1, parseInt(qty) || 1);

    if (existingIndex > -1) {
        cart[existingIndex].quantity = (parseInt(cart[existingIndex].quantity) || 0) + parsedQty;
        cart[existingIndex].name = safeName;
        cart[existingIndex].variationName = safeVarName;
        cart[existingIndex].price = safePrice;
        cart[existingIndex].imageUrl = safeImg;
        cart[existingIndex].cartItemId = cartItemId;
    } else {
        cart.push({
            cartItemId: cartItemId,
            id: productId,
            name: safeName,
            variationId: safeVarId,
            variationName: safeVarName,
            price: safePrice,
            imageUrl: safeImg,
            quantity: parsedQty
        });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    showAddedToCartModal(cart);
}

// Show Added to Cart Popup Modal
function showAddedToCartModal(cartItems) {
    let backdrop = document.getElementById("cart-modal-backdrop");
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "cart-modal-backdrop";
        backdrop.className = "cart-modal-backdrop";
        backdrop.innerHTML = `
            <div class="cart-modal-card" role="dialog" aria-modal="true" aria-labelledby="cart-modal-title">
                <div class="cart-modal-header">
                    <h3 id="cart-modal-title" class="cart-modal-header-title">
                        <span class="cart-modal-header-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </span>
                        <span>Added to Cart</span>
                    </h3>
                    <button type="button" class="cart-modal-close-btn" aria-label="Close" onclick="closeCartModal()">&times;</button>
                </div>
                
                <div id="cart-modal-items-list" class="cart-modal-items">
                    <!-- Injected Cart Items for Desktop/Tablet -->
                </div>
                
                <div class="cart-modal-actions">
                    <a href="cart.html" class="cart-modal-btn-view">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        <span>View Cart</span>
                    </a>
                    <a href="shop.html" class="cart-modal-btn-continue" onclick="closeCartModal()">
                        <span>Continue Shopping</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);
        
        // Close on backdrop click (outside modal card)
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) {
                closeCartModal();
            }
        });
    }

    // Populate products list for Desktop / Laptop / Tablet
    const itemsListEl = document.getElementById("cart-modal-items-list");
    if (itemsListEl) {
        const items = cartItems || getCart();
        let itemsHtml = "";
        items.forEach(item => {
            const itemQty = parseInt(item.quantity) || 1;
            const itemPrice = (item.price || 0) * itemQty;
            const varText = item.variationName || item.variationId || "3ml";
            itemsHtml += `
                <div class="cart-modal-item">
                    <img src="${item.imageUrl || 'assets/images/prod-oud-royal.jpg'}" alt="${item.name || 'Product'}" class="cart-modal-item-img">
                    <div class="cart-modal-item-info">
                        <div class="cart-modal-item-name">${item.name || 'Attar'}</div>
                        <div class="cart-modal-item-meta">${varText} &bull; Qty: ${itemQty}</div>
                    </div>
                    <div class="cart-modal-item-price">${formatCurrency(itemPrice)}</div>
                </div>
            `;
        });
        itemsListEl.innerHTML = itemsHtml;
    }

    // Show modal with animation
    backdrop.style.display = "flex";
    setTimeout(() => {
        backdrop.classList.add("show");
    }, 10);
}

// Close Added to Cart Modal
function closeCartModal() {
    const backdrop = document.getElementById("cart-modal-backdrop");
    if (backdrop) {
        backdrop.classList.remove("show");
        setTimeout(() => {
            backdrop.style.display = "none";
        }, 250);
    }
}

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    updateCopyrightYear();
    initMobileNav();
    initFaqAccordion();
});

// Mobile Navigation Drawer Toggle
function initMobileNav() {
    const toggleBtn = document.getElementById("mobile-nav-toggle-btn");
    const drawer = document.getElementById("mobile-nav-drawer");
    const closeBtn = document.getElementById("mobile-nav-close-btn");
    
    if (!toggleBtn || !drawer) return;

    const openMenu = () => {
        drawer.classList.add("open");
        document.body.style.overflow = "hidden";
    };

    const closeMenu = () => {
        drawer.classList.remove("open");
        document.body.style.overflow = "";
    };

    toggleBtn.addEventListener("click", openMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);

    drawer.addEventListener("click", (e) => {
        if (e.target === drawer) closeMenu();
    });

    // Close when clicking mobile nav links
    const navLinks = drawer.querySelectorAll(".mobile-nav-list a");
    navLinks.forEach(link => {
        link.addEventListener("click", closeMenu);
    });
}

// FAQ Accordion Keyboard & Click Logic
function initFaqAccordion() {
    const faqButtons = document.querySelectorAll(".faq-question-btn");
    faqButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const faqItem = btn.closest(".faq-item");
            const isCurrentlyActive = faqItem.classList.contains("active");

            // Close other items in the same container if desired
            document.querySelectorAll(".faq-item").forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove("active");
                    const qBtn = item.querySelector(".faq-question-btn");
                    if (qBtn) qBtn.setAttribute("aria-expanded", "false");
                }
            });

            if (isCurrentlyActive) {
                faqItem.classList.remove("active");
                btn.setAttribute("aria-expanded", "false");
            } else {
                faqItem.classList.add("active");
                btn.setAttribute("aria-expanded", "true");
            }
        });
    });
}

