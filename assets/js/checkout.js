// Checkout logic with robust cart calculation, coupon support, and WhatsApp order submission

function getAppliedCoupon() {
    return localStorage.getItem(COUPON_KEY) || "";
}

function calculateCheckoutTotals() {
    const cart = getCart();
    let subtotal = 0;
    
    cart.forEach(item => {
        const product = getProductById(item.id);
        const variation = getProductVariation(item.id, item.variationId || "3ml");
        let unitPrice = 399;
        if (variation && typeof variation.price === 'number') {
            unitPrice = variation.price;
        } else if (item.price && typeof item.price === 'number') {
            unitPrice = item.price;
        } else if (product && product.variations && product.variations.length > 0) {
            unitPrice = product.variations[0].price;
        }
        subtotal += unitPrice * (parseInt(item.quantity) || 1);
    });

    const appliedCode = getAppliedCoupon();
    let discount = 0;
    let couponLabel = "";

    if (appliedCode && VALID_COUPONS[appliedCode]) {
        const coupon = VALID_COUPONS[appliedCode];
        couponLabel = coupon.label || appliedCode;
        if (coupon.type === "percent") {
            discount = Math.round(subtotal * (coupon.value / 100));
        } else if (coupon.type === "flat") {
            discount = coupon.value;
        }
    }

    if (discount > subtotal) discount = subtotal;

    const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
    const finalTotal = Math.max(0, subtotal + shipping - discount);

    return {
        subtotal: subtotal,
        shipping: shipping,
        discount: discount,
        appliedCode: appliedCode,
        couponLabel: couponLabel,
        total: finalTotal
    };
}

function renderCheckoutSummary() {
    const summaryContainer = document.getElementById("checkout-items");
    if (!summaryContainer) return;
    
    const cart = getCart();
    
    if (!cart || cart.length === 0) {
        window.location.href = "cart.html";
        return;
    }
    
    let html = "";
    
    cart.forEach(item => {
        const product = getProductById(item.id);
        const variation = getProductVariation(item.id, item.variationId || "3ml");
        
        const prodName = (product && product.name) ? product.name : (item.name || "Attar Fragrance");
        const varName = (variation && variation.name) ? variation.name : (item.variationName || item.variationId || "3ml");
        const unitPrice = (variation && typeof variation.price === 'number') ? variation.price : (item.price || 399);
        const prodImg = (product && product.imageUrl) ? product.imageUrl : (item.imageUrl || "assets/images/prod-oud-royal.jpg");
        const qty = parseInt(item.quantity) || 1;
        const lineTotal = unitPrice * qty;

        html += `
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div class="d-flex align-items-center gap-2">
                    <img src="${prodImg}" alt="${prodName}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-subtle);">
                    <div>
                        <div class="fw-bold small text-dark">${prodName}</div>
                        <div class="text-muted" style="font-size: 0.76rem;">Size: ${varName} | Qty: ${qty}</div>
                    </div>
                </div>
                <span class="fw-bold text-dark small">${formatCurrency(lineTotal)}</span>
            </div>
        `;
    });
    
    summaryContainer.innerHTML = html;
    
    // Calculate and populate financial rows
    const totals = calculateCheckoutTotals();
    
    const subtotalEl = document.getElementById("summary-subtotal");
    const shippingEl = document.getElementById("summary-shipping");
    const discountEl = document.getElementById("summary-discount");
    const discountRow = document.getElementById("discount-row");
    const totalEl = document.getElementById("summary-total");
    
    if (subtotalEl) subtotalEl.textContent = formatCurrency(totals.subtotal);
    if (shippingEl) shippingEl.textContent = formatCurrency(totals.shipping);
    
    if (discountEl && discountRow) {
        if (totals.discount > 0) {
            discountEl.innerHTML = `
                <span class="text-success fw-bold">-${formatCurrency(totals.discount)}</span>
                <span class="badge bg-light text-success ms-1">${totals.appliedCode}</span>
                <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-2 text-decoration-none" onclick="removeCheckoutCoupon()">✕</button>
            `;
            discountRow.style.display = "flex";
        } else {
            discountRow.style.display = "none";
        }
    }
    
    if (totalEl) totalEl.textContent = formatCurrency(totals.total);
}

// Coupon Handling in Checkout
function applyCheckoutCoupon() {
    const inputEl = document.getElementById("checkout-coupon-input");
    const msgEl = document.getElementById("checkout-coupon-message");
    if (!inputEl) return;
    
    const code = inputEl.value.trim().toUpperCase();
    if (!code) {
        if (msgEl) msgEl.innerHTML = `<span class="text-danger small">Please enter a coupon code.</span>`;
        return;
    }

    if (VALID_COUPONS[code]) {
        localStorage.setItem(COUPON_KEY, code);
        if (msgEl) msgEl.innerHTML = `<span class="text-success small">Coupon <strong>${code}</strong> applied!</span>`;
        inputEl.value = "";
        renderCheckoutSummary();
    } else {
        if (msgEl) msgEl.innerHTML = `<span class="text-danger small">Invalid coupon code. Try SCENT10 or WELCOME50</span>`;
    }
}

function removeCheckoutCoupon() {
    localStorage.removeItem(COUPON_KEY);
    const msgEl = document.getElementById("checkout-coupon-message");
    if (msgEl) msgEl.innerHTML = "";
    renderCheckoutSummary();
}

function generateOrderId() {
    const date = new Date();
    const dateString = date.getFullYear().toString() + 
                      (date.getMonth() + 1).toString().padStart(2, '0') + 
                      date.getDate().toString().padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900);
    return `SAX-${dateString}-${random}`;
}

// Place Order and Send Form Data via WhatsApp
function placeOrder(event) {
    if (event) event.preventDefault();
    
    const cart = getCart();
    if (cart.length === 0) {
        alert("Your cart is empty.");
        window.location.href = "shop";
        return;
    }
    
    const form = document.getElementById("checkout-form");
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        // Scroll to first invalid field
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
    }
    
    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = (document.getElementById("email") ? document.getElementById("email").value.trim() : "") || "N/A";
    const address = document.getElementById("address").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const pincode = document.getElementById("pincode").value.trim();
    
    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit mobile number.");
        document.getElementById("phone").focus();
        return;
    }
    
    if (!/^[0-9]{6}$/.test(pincode)) {
        alert("Please enter a valid 6-digit pincode.");
        document.getElementById("pincode").focus();
        return;
    }
    
    const totals = calculateCheckoutTotals();
    const orderId = generateOrderId();
    
    // Construct order items list for WhatsApp
    let itemsText = "";
    cart.forEach((item, index) => {
        const prod = getProductById(item.id);
        const name = prod ? prod.name : item.id;
        const variation = getProductVariation(item.id, item.variationId) || { name: item.variationId || "3ml", price: 0 };
        itemsText += `${index + 1}. *${name}* (${variation.name}) x ${item.quantity} = ₹${variation.price * item.quantity}\n`;
    });

    // Construct full WhatsApp message with all delivery details and totals
    let waMessage = `✨ *NEW ORDER: #${orderId}* ✨\n`;
    waMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
    waMessage += `👤 *CUSTOMER DETAILS*\n`;
    waMessage += `• *Name:* ${fullName}\n`;
    waMessage += `• *Mobile:* ${phone}\n`;
    if (email && email !== "N/A") waMessage += `• *Email:* ${email}\n`;
    waMessage += `\n📍 *SHIPPING ADDRESS*\n`;
    waMessage += `${address}\n`;
    waMessage += `${city}, ${state} - ${pincode}\n`;
    waMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
    waMessage += `🛍️ *ORDERED ITEMS*\n`;
    waMessage += itemsText;
    waMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
    waMessage += `💰 *ORDER SUMMARY*\n`;
    waMessage += `• Subtotal: ₹${totals.subtotal}\n`;
    waMessage += `• Shipping: ₹${totals.shipping}\n`;
    if (totals.discount > 0) {
        waMessage += `• Discount (${totals.appliedCode}): -₹${totals.discount}\n`;
    }
    waMessage += `• *TOTAL AMOUNT: ₹${totals.total}*\n`;
    waMessage += `• *Payment Method:* Order via WhatsApp\n`;
    waMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
    waMessage += `Please confirm my order and share delivery / payment updates. Thank you!`;

    // Save order data in sessionStorage/localStorage for success screen
    const orderData = {
        orderId: orderId,
        date: new Date().toISOString(),
        customer: fullName,
        phone: phone,
        email: email,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        items: cart,
        subtotal: formatCurrency(totals.subtotal),
        shipping: formatCurrency(totals.shipping),
        couponCode: totals.appliedCode,
        discount: formatCurrency(totals.discount),
        total: formatCurrency(totals.total),
        paymentMethod: "Order on WhatsApp",
        status: "Pending"
    };

    sessionStorage.setItem("latest_order", JSON.stringify(orderData));

    // Clear cart & coupon
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(COUPON_KEY);
    updateCartCount();

    // Open WhatsApp
    const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(waMessage)}`;
    window.open(waUrl, '_blank');

    // Redirect to Order Success screen
    setTimeout(() => {
        window.location.href = "order-success.html";
    }, 400);
}

document.addEventListener("DOMContentLoaded", async () => {
    if (document.getElementById("checkout-form")) {
        renderCheckoutSummary();
        document.getElementById("checkout-form").addEventListener("submit", placeOrder);
    }
    await loadProducts();
    if (document.getElementById("checkout-form")) {
        renderCheckoutSummary();
    }
});
