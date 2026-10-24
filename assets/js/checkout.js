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
    
// Verified Indian States and Union Territories list for country authenticity
const VALID_INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

let isPincodeVerified = false;
let verifiedPostOffices = [];

// Fetch postal records from India Post API
async function verifyIndianPincode(pincode) {
    const pinInput = document.getElementById("pincode");
    const pinSpinner = document.getElementById("pincode-spinner");
    const pinFeedback = document.getElementById("pincode-feedback");
    const pinStatus = document.getElementById("pincode-status");
    const cityInput = document.getElementById("city");
    const stateInput = document.getElementById("state");

    if (!pinInput || !/^[1-8][0-9]{5}$/.test(pincode)) {
        isPincodeVerified = false;
        verifiedPostOffices = [];
        return false;
    }

    if (pinSpinner) pinSpinner.style.display = "inline-block";
    if (pinStatus) pinStatus.textContent = "Verifying with India Post...";

    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (pinSpinner) pinSpinner.style.display = "none";

        if (Array.isArray(data) && data[0] && data[0].Status === "Success" && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
            isPincodeVerified = true;
            verifiedPostOffices = data[0].PostOffice;
            const primaryOffice = verifiedPostOffices[0];

            // Auto-fill City/District & State
            if (cityInput && (!cityInput.value.trim() || cityInput.dataset.autofilled === "true")) {
                cityInput.value = primaryOffice.District || primaryOffice.Division || primaryOffice.Name;
                cityInput.dataset.autofilled = "true";
                cityInput.classList.remove("is-invalid");
                cityInput.classList.add("is-valid");
            }
            if (stateInput && (!stateInput.value.trim() || stateInput.dataset.autofilled === "true")) {
                stateInput.value = primaryOffice.State;
                stateInput.dataset.autofilled = "true";
                stateInput.classList.remove("is-invalid");
                stateInput.classList.add("is-valid");
            }

            pinInput.classList.remove("is-invalid");
            pinInput.classList.add("is-valid");
            if (pinStatus) {
                pinStatus.textContent = `✓ ${primaryOffice.District}, ${primaryOffice.State}`;
                pinStatus.className = "text-success fw-semibold";
            }
            return true;
        } else {
            isPincodeVerified = false;
            verifiedPostOffices = [];
            pinInput.classList.remove("is-valid");
            pinInput.classList.add("is-invalid");
            if (pinFeedback) pinFeedback.textContent = "Invalid PIN code. Not found in India Post records.";
            if (pinStatus) {
                pinStatus.textContent = "✗ Invalid Indian PIN code";
                pinStatus.className = "text-danger";
            }
            return false;
        }
    } catch (err) {
        if (pinSpinner) pinSpinner.style.display = "none";
        // Graceful fallback in case India Post API has network latency
        isPincodeVerified = true;
        pinInput.classList.remove("is-invalid");
        if (pinStatus) pinStatus.textContent = "";
        return true;
    }
}

// Place order on WhatsApp
async function placeOrder(event) {
    if (event) event.preventDefault();
    
    const cart = getCart();
    if (!cart || cart.length === 0) {
        alert("Your cart is empty. Please add items to checkout.");
        window.location.href = "shop.html";
        return;
    }
    
    const form = document.getElementById("checkout-form");
    const fullNameInput = document.getElementById("fullName");
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");
    const addressInput = document.getElementById("address");
    const cityInput = document.getElementById("city");
    const stateInput = document.getElementById("state");
    const pinInput = document.getElementById("pincode");
    const pinFeedback = document.getElementById("pincode-feedback");

    const fullName = fullNameInput ? fullNameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const emailRaw = emailInput ? emailInput.value.trim() : "";
    const email = emailRaw || "N/A";
    const address = addressInput ? addressInput.value.trim() : "";
    const city = cityInput ? cityInput.value.trim() : "";
    const state = stateInput ? stateInput.value.trim() : "";
    const pincode = pinInput ? pinInput.value.trim() : "";

    let hasErrors = false;

    // 1. Full name validation
    if (!fullName || fullName.length < 2) {
        fullNameInput.classList.add("is-invalid");
        hasErrors = true;
    } else {
        fullNameInput.classList.remove("is-invalid");
        fullNameInput.classList.add("is-valid");
    }

    // 2. Strict mobile validation: 10 digits only
    if (!/^[0-9]{10}$/.test(phone)) {
        phoneInput.classList.add("is-invalid");
        hasErrors = true;
    } else {
        phoneInput.classList.remove("is-invalid");
        phoneInput.classList.add("is-valid");
    }

    // 3. Email validation: ONLY if user entered something
    if (emailRaw) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
            emailInput.classList.add("is-invalid");
            emailInput.classList.remove("is-valid");
            hasErrors = true;
        } else {
            emailInput.classList.remove("is-invalid");
            emailInput.classList.add("is-valid");
        }
    } else {
        // Empty optional email: clear any error or success highlights
        emailInput.classList.remove("is-invalid");
        emailInput.classList.remove("is-valid");
    }

    // 4. Street Address validation
    if (!address || address.length < 5) {
        addressInput.classList.add("is-invalid");
        hasErrors = true;
    } else {
        addressInput.classList.remove("is-invalid");
        addressInput.classList.add("is-valid");
    }

    // 5. Pincode validation: must be 6 digits and start with 1-8
    if (!/^[1-8][0-9]{5}$/.test(pincode)) {
        pinInput.classList.add("is-invalid");
        pinInput.classList.remove("is-valid");
        if (pinFeedback) pinFeedback.textContent = "Please enter a valid 6-digit Indian PIN code.";
        hasErrors = true;
    } else if (!isPincodeVerified) {
        // Verify online with India Post
        const verified = await verifyIndianPincode(pincode);
        if (!verified) {
            hasErrors = true;
        }
    }

    // 6. City / District validation: minimum 2 characters, no pure numbers
    if (!city || city.length < 2 || /^\d+$/.test(city)) {
        cityInput.classList.add("is-invalid");
        cityInput.classList.remove("is-valid");
        hasErrors = true;
    } else {
        cityInput.classList.remove("is-invalid");
        cityInput.classList.add("is-valid");
    }

    // 7. State validation: check against Indian States/UTs or verified postal state
    const normalizedState = state.toLowerCase().replace(/[^a-z]/g, "");
    const isValidState = VALID_INDIAN_STATES.some(s => s.toLowerCase().replace(/[^a-z]/g, "").includes(normalizedState) || normalizedState.includes(s.toLowerCase().replace(/[^a-z]/g, "")));

    if (!state || state.length < 3 || /^\d+$/.test(state) || (!isValidState && verifiedPostOffices.length === 0)) {
        stateInput.classList.add("is-invalid");
        stateInput.classList.remove("is-valid");
        hasErrors = true;
    } else {
        stateInput.classList.remove("is-invalid");
        stateInput.classList.add("is-valid");
    }

    if (hasErrors) {
        form.classList.add('was-validated');
        const firstInvalid = form.querySelector('.is-invalid, :invalid');
        if (firstInvalid) firstInvalid.focus();
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
    const form = document.getElementById("checkout-form");
    if (form) {
        renderCheckoutSummary();
        form.addEventListener("submit", placeOrder);

        // Real-time restriction: Numbers only and maximum 10 digits for mobile
        const phoneInput = document.getElementById("phone");
        if (phoneInput) {
            phoneInput.addEventListener("input", (e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                if (e.target.value.length === 10) {
                    phoneInput.classList.remove("is-invalid");
                    phoneInput.classList.add("is-valid");
                } else {
                    phoneInput.classList.remove("is-valid");
                }
            });
        }

        // Pincode restriction: Numbers only, maximum 6 digits, auto-query India Post on 6 digits
        const pinInput = document.getElementById("pincode");
        if (pinInput) {
            pinInput.addEventListener("input", async (e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                const code = e.target.value;

                if (code.length === 6) {
                    await verifyIndianPincode(code);
                } else {
                    isPincodeVerified = false;
                    pinInput.classList.remove("is-valid");
                    const pinStatus = document.getElementById("pincode-status");
                    if (pinStatus) pinStatus.textContent = "";
                }
            });
        }

        // Real-time email validation: Only validates if user types something
        const emailInput = document.getElementById("email");
        if (emailInput) {
            emailInput.addEventListener("input", (e) => {
                const val = e.target.value.trim();
                if (!val) {
                    emailInput.classList.remove("is-invalid");
                    emailInput.classList.remove("is-valid");
                } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                    emailInput.classList.remove("is-invalid");
                    emailInput.classList.add("is-valid");
                } else {
                    emailInput.classList.remove("is-valid");
                    emailInput.classList.add("is-invalid");
                }
            });
        }

        // City & State input change resets autofill flag
        const cityInput = document.getElementById("city");
        if (cityInput) {
            cityInput.addEventListener("input", () => {
                cityInput.dataset.autofilled = "false";
                if (cityInput.value.trim().length >= 2) {
                    cityInput.classList.remove("is-invalid");
                }
            });
        }

        const stateInput = document.getElementById("state");
        if (stateInput) {
            stateInput.addEventListener("input", () => {
                stateInput.dataset.autofilled = "false";
                if (stateInput.value.trim().length >= 3) {
                    stateInput.classList.remove("is-invalid");
                }
            });
        }
    }

    await loadProducts();
    if (document.getElementById("checkout-form")) {
        renderCheckoutSummary();
    }
});
