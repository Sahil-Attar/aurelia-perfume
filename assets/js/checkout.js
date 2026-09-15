// Checkout script

function renderCheckoutSummary() {
    const summaryContainer = document.getElementById("checkout-summary-items");
    if (!summaryContainer) return;
    
    const cart = getCart();
    
    if (cart.length === 0) {
        window.location.href = "cart.html";
        return;
    }
    
    let html = "";
    let subtotal = 0;
    
    cart.forEach(item => {
        const product = getProductById(item.id);
        if (product) {
            const lineTotal = product.price * item.quantity;
            subtotal += lineTotal;
            
            html += `
                <div class="d-flex justify-content-between mb-2 small">
                    <span>${product.name} × ${item.quantity}</span>
                    <span>${formatCurrency(lineTotal)}</span>
                </div>
            `;
        }
    });
    
    summaryContainer.innerHTML = html;
    
    // Calculate final totals using logic similar to cart
    const appliedCoupon = localStorage.getItem(COUPON_KEY);
    let discount = 0;
    let finalTotal = 0;
    
    document.getElementById("checkout-subtotal").textContent = formatCurrency(subtotal);
    document.getElementById("checkout-shipping").textContent = formatCurrency(SHIPPING_FEE);
    
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
    
    const discountRow = document.getElementById("checkout-discount-row");
    if (discount > 0) {
        document.getElementById("checkout-discount").textContent = `-${formatCurrency(discount)}`;
        discountRow.style.display = "flex";
    } else {
        discountRow.style.display = "none";
    }
    
    document.getElementById("checkout-total").textContent = formatCurrency(finalTotal);
}

function generateOrderId() {
    const date = new Date();
    const dateString = date.getFullYear().toString() + 
                      (date.getMonth() + 1).toString().padStart(2, '0') + 
                      date.getDate().toString().padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900);
    return `AUR-${dateString}-${random}`;
}

function placeOrder(event) {
    event.preventDefault();
    
    const cart = getCart();
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }
    
    const form = document.getElementById("checkout-form");
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    // Additional validation for pincode and phone
    const phone = document.getElementById("phone").value;
    const pincode = document.getElementById("pincode").value;
    
    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
    }
    
    if (!/^[0-9]{6}$/.test(pincode)) {
        alert("Please enter a valid 6-digit pincode.");
        return;
    }
    
    // Construct Order Object
    const appliedCoupon = localStorage.getItem(COUPON_KEY);
    
    const orderData = {
        orderId: generateOrderId(),
        date: new Date().toISOString(),
        customer: document.getElementById("fullName").value,
        phone: phone,
        email: document.getElementById("email").value || "",
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        pincode: pincode,
        items: cart,
        subtotal: document.getElementById("checkout-subtotal").textContent,
        shipping: document.getElementById("checkout-shipping").textContent,
        couponCode: appliedCoupon || "",
        discount: document.getElementById("checkout-discount") ? document.getElementById("checkout-discount").textContent : "₹0.00",
        total: document.getElementById("checkout-total").textContent,
        paymentMethod: "Cash on Delivery",
        status: "Pending"
    };
    
    // Store in localStorage
    let orders = JSON.parse(localStorage.getItem("aurelia_orders")) || [];
    orders.push(orderData);
    localStorage.setItem("aurelia_orders", JSON.stringify(orders));
    
    // Store latest order for the success page
    localStorage.setItem("aurelia_latest_order", JSON.stringify(orderData));
    
    // Clear cart and coupon
    clearCart();
    
    // Redirect
    window.location.href = "order-success.html";
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("checkout-form")) {
        renderCheckoutSummary();
        document.getElementById("checkout-form").addEventListener("submit", placeOrder);
    }
});
