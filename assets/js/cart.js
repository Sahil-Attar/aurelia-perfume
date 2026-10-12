// Cart page functionality - constants (COUPON_KEY, SHIPPING_FEE, VALID_COUPONS, CART_KEY) are defined in main.js

// Render cart items
function renderCart() {
    const cartContainer = document.getElementById("cart-items-container");
    const emptyState = document.getElementById("empty-cart-state");
    const cartContent = document.getElementById("cart-content");
    
    if (!cartContainer) return;
    
    const cart = getCart();
    
    if (!cart || cart.length === 0) {
        if (emptyState) emptyState.style.display = "block";
        if (cartContent) cartContent.style.display = "none";
        return;
    }
    
    let html = "";
    let subtotal = 0;
    let validItemCount = 0;

    cart.forEach((item, index) => {
        const product = getProductById(item.id);
        const variation = getProductVariation(item.id, item.variationId);

        const prodName = (product && product.name) ? product.name : (item.name || "Attar Fragrance");
        const varName = (variation && variation.name) ? variation.name : (item.variationName || item.variationId || "3ml");
        const unitPrice = (variation && typeof variation.price === 'number') ? variation.price : (item.price || 399);
        const prodImg = (product && product.imageUrl) ? product.imageUrl : (item.imageUrl || "assets/images/prod-oud-royal.jpg");
        const qty = parseInt(item.quantity) || 1;
        const lineTotal = unitPrice * qty;
        
        subtotal += lineTotal;
        validItemCount++;
        
        const cartId = item.cartItemId || `${item.id}_${item.variationId || index}`;

        html += `
            <div class="d-flex align-items-center mb-4 pb-4 border-bottom position-relative">
                <div class="cart-item-image me-3" style="width: 75px; height: 75px; border-radius: 12px; overflow: hidden; background: #FAF6EE; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border-subtle);">
                    <img src="${prodImg}" alt="${prodName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">
                </div>
                <div class="flex-grow-1">
                    <h5 class="mb-1 font-serif" style="font-size: 1.1rem; color: var(--primary-dark);">${prodName} <span class="text-muted fs-6">(${varName})</span></h5>
                    <p class="text-muted mb-2">${formatCurrency(unitPrice)}</p>
                    
                    <div class="d-flex align-items-center">
                        <button class="qty-btn" type="button" onclick="updateQuantity('${cartId}', -1)">-</button>
                        <input type="text" class="qty-input" value="${qty}" readonly>
                        <button class="qty-btn" type="button" onclick="updateQuantity('${cartId}', 1)">+</button>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold mb-3">${formatCurrency(lineTotal)}</div>
                    <button class="btn btn-sm btn-link text-danger text-decoration-none p-0" type="button" onclick="removeFromCart('${cartId}')">Remove</button>
                </div>
            </div>
        `;
    });
    
    if (validItemCount === 0) {
        if (emptyState) emptyState.style.display = "block";
        if (cartContent) cartContent.style.display = "none";
        return;
    }
    
    if (emptyState) emptyState.style.display = "none";
    if (cartContent) cartContent.style.display = "flex"; // For grid/row layout
    
    cartContainer.innerHTML = html;
    updateTotals(subtotal);
}

// Update quantity
function updateQuantity(cartItemId, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => (item.cartItemId || item.id) === cartItemId);
    
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartCount();
        renderCart();
    }
}

// Remove from cart
function removeFromCart(cartItemId) {
    let cart = getCart();
    cart = cart.filter(item => (item.cartItemId || item.id) !== cartItemId);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

// Clear cart
function clearCart() {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(COUPON_KEY);
    updateCartCount();
}

// Apply coupon
function applyCoupon() {
    const inputEl = document.getElementById("coupon-input");
    const messageEl = document.getElementById("coupon-message");
    if (!inputEl) return;
    
    const input = inputEl.value.trim().toUpperCase();
    if (!input) {
        if (messageEl) messageEl.innerHTML = `<span class="text-danger small">Please enter a coupon code.</span>`;
        return;
    }
    
    if (VALID_COUPONS && VALID_COUPONS[input]) {
        localStorage.setItem(COUPON_KEY, input);
        if (messageEl) messageEl.innerHTML = `<span class="text-success small">Coupon applied successfully!</span>`;
        renderCart();
    } else {
        if (messageEl) messageEl.innerHTML = `<span class="text-danger small">Invalid coupon code.</span>`;
    }
}

// Remove coupon
function removeCoupon() {
    localStorage.removeItem(COUPON_KEY);
    const messageEl = document.getElementById("coupon-message");
    if (messageEl) messageEl.innerHTML = "";
    const inputEl = document.getElementById("coupon-input");
    if (inputEl) inputEl.value = "";
    renderCart();
}

// Update Totals (Subtotal, Shipping, Discount, Total)
function updateTotals(subtotal) {
    const appliedCoupon = localStorage.getItem(COUPON_KEY);
    let discount = 0;
    let finalTotal = 0;
    
    const subtotalEl = document.getElementById("summary-subtotal");
    const shippingEl = document.getElementById("summary-shipping");
    const discountEl = document.getElementById("summary-discount");
    const totalEl = document.getElementById("summary-total");
    
    const shippingFee = subtotal > 0 ? SHIPPING_FEE : 0;
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (shippingEl) shippingEl.textContent = formatCurrency(shippingFee);
    
    if (appliedCoupon && typeof VALID_COUPONS !== 'undefined' && VALID_COUPONS[appliedCoupon]) {
        const couponInfo = VALID_COUPONS[appliedCoupon];
        if (couponInfo.type === "percent") {
            discount = subtotal * (couponInfo.value / 100);
        } else if (couponInfo.type === "flat") {
            discount = couponInfo.value;
        }
    }
    
    finalTotal = subtotal + shippingFee - discount;
    if (finalTotal < 0) finalTotal = 0;
    
    if (discountEl) {
        if (discount > 0) {
            discountEl.innerHTML = `
                <span class="text-success">-${formatCurrency(discount)}</span>
                <button class="btn btn-sm btn-link text-muted p-0 ms-2" onclick="removeCoupon()">[Remove]</button>
            `;
            const discountRow = document.getElementById("discount-row");
            if (discountRow) discountRow.style.display = "flex";
        } else {
            const discountRow = document.getElementById("discount-row");
            if (discountRow) discountRow.style.display = "none";
        }
    }
    
    if (totalEl) totalEl.textContent = formatCurrency(finalTotal);
}

async function initCart() {
    if (document.getElementById("cart-items-container")) {
        renderCart();
    }
    if (typeof loadProducts === "function") {
        await loadProducts();
    }
    if (document.getElementById("cart-items-container")) {
        renderCart();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCart);
} else {
    initCart();
}
