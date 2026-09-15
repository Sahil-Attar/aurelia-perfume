const COUPON_KEY = "aurelia_coupon";
const SHIPPING_FEE = 50;

const VALID_COUPONS = {
    "AURELIA10": { type: "percent", value: 10 },
    "WELCOME50": { type: "flat", value: 50 }
};

// Render cart items
function renderCart() {
    const cartContainer = document.getElementById("cart-items-container");
    const cartSummary = document.getElementById("cart-summary-container");
    const emptyState = document.getElementById("empty-cart-state");
    const cartContent = document.getElementById("cart-content");
    
    if (!cartContainer) return;
    
    const cart = getCart();
    
    if (cart.length === 0) {
        emptyState.style.display = "block";
        cartContent.style.display = "none";
        return;
    }
    
    emptyState.style.display = "none";
    cartContent.style.display = "flex"; // For grid/row layout
    
    let html = "";
    let subtotal = 0;
    
    cart.forEach((item, index) => {
        const product = getProductById(item.id);
        if (product) {
            const lineTotal = product.price * item.quantity;
            subtotal += lineTotal;
            
            html += `
                <div class="d-flex align-items-center mb-4 pb-4 border-bottom position-relative">
                    <div class="cart-item-image me-3">
                        <div class="mini-bottle" data-label="${product.label}"></div>
                    </div>
                    <div class="flex-grow-1">
                        <h5 class="mb-1">${product.name}</h5>
                        <p class="text-muted mb-2">${formatCurrency(product.price)}</p>
                        
                        <div class="d-flex align-items-center">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                            <input type="text" class="qty-input" value="${item.quantity}" readonly>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold mb-3">${formatCurrency(lineTotal)}</div>
                        <button class="btn btn-sm btn-link text-danger text-decoration-none p-0" onclick="removeFromCart('${item.id}')">Remove</button>
                    </div>
                </div>
            `;
        }
    });
    
    cartContainer.innerHTML = html;
    updateTotals(subtotal);
}

// Update quantity
function updateQuantity(productId, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);
    
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
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
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
    const input = document.getElementById("coupon-input").value.trim().toUpperCase();
    const messageEl = document.getElementById("coupon-message");
    
    if (!input) {
        messageEl.innerHTML = `<span class="text-danger small">Please enter a coupon code.</span>`;
        return;
    }
    
    if (VALID_COUPONS[input]) {
        localStorage.setItem(COUPON_KEY, input);
        messageEl.innerHTML = `<span class="text-success small">Coupon applied successfully!</span>`;
        renderCart();
    } else {
        messageEl.innerHTML = `<span class="text-danger small">Invalid coupon code.</span>`;
    }
}

// Remove coupon
function removeCoupon() {
    localStorage.removeItem(COUPON_KEY);
    const messageEl = document.getElementById("coupon-message");
    if(messageEl) messageEl.innerHTML = "";
    const inputEl = document.getElementById("coupon-input");
    if(inputEl) inputEl.value = "";
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
    
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (shippingEl) shippingEl.textContent = formatCurrency(SHIPPING_FEE);
    
    if (appliedCoupon && VALID_COUPONS[appliedCoupon]) {
        const couponInfo = VALID_COUPONS[appliedCoupon];
        if (couponInfo.type === "percent") {
            discount = subtotal * (couponInfo.value / 100);
        } else if (couponInfo.type === "flat") {
            discount = couponInfo.value;
        }
    }
    
    finalTotal = subtotal + SHIPPING_FEE - discount;
    if (finalTotal < 0) finalTotal = 0;
    
    if (discountEl) {
        if (discount > 0) {
            discountEl.innerHTML = `
                <span class="text-success">-${formatCurrency(discount)}</span>
                <button class="btn btn-sm btn-link text-muted p-0 ms-2" onclick="removeCoupon()">[Remove]</button>
            `;
            document.getElementById("discount-row").style.display = "flex";
        } else {
            document.getElementById("discount-row").style.display = "none";
        }
    }
    
    if (totalEl) totalEl.textContent = formatCurrency(finalTotal);
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("cart-items-container")) {
        renderCart();
    }
});
