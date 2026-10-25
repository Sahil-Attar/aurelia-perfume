// Checkout logic with robust cart calculation, coupon support, postal verification, and WhatsApp order submission

// Verified Indian States and Union Territories list for state validation
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

function getAppliedCoupon() {
    return localStorage.getItem(COUPON_KEY) || "";
}

// Resilient product price resolver matching cart.js and product variations
function getItemUnitPrice(item) {
    const product = typeof getProductById === "function" ? getProductById(item.id) : null;
    const variation = typeof getProductVariation === "function" ? getProductVariation(item.id, item.variationId || "3ml") : null;

    if (variation && typeof variation.price === 'number' && !isNaN(variation.price)) {
        return variation.price;
    }
    if (item.price !== undefined && item.price !== null && !isNaN(parseFloat(item.price))) {
        return parseFloat(item.price);
    }
    if (product && product.variations && product.variations.length > 0 && typeof product.variations[0].price === 'number') {
        return product.variations[0].price;
    }
    return 399;
}

function calculateCheckoutTotals() {
    const cart = getCart();
    let subtotal = 0;
    
    cart.forEach(item => {
        const unitPrice = getItemUnitPrice(item);
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        subtotal += unitPrice * qty;
    });

    const appliedCode = getAppliedCoupon();
    let discount = 0;
    let couponLabel = "";

    if (appliedCode && typeof VALID_COUPONS !== 'undefined' && VALID_COUPONS[appliedCode]) {
        const coupon = VALID_COUPONS[appliedCode];
        couponLabel = coupon.label || appliedCode;
        if (coupon.type === "percent") {
            discount = Math.round(subtotal * (coupon.value / 100));
        } else if (coupon.type === "flat") {
            discount = Math.min(coupon.value, subtotal);
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
        const product = typeof getProductById === "function" ? getProductById(item.id) : null;
        const variation = typeof getProductVariation === "function" ? getProductVariation(item.id, item.variationId || "3ml") : null;
        
        const prodName = (product && product.name) ? product.name : (item.name || "Attar Fragrance");
        const varName = (variation && variation.name) ? variation.name : (item.variationName || item.variationId || "3ml");
        const unitPrice = getItemUnitPrice(item);
        const prodImg = (product && product.imageUrl) ? product.imageUrl : (item.imageUrl || "assets/images/prod-oud-royal.jpg");
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
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

    if (typeof VALID_COUPONS !== 'undefined' && VALID_COUPONS[code]) {
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

// Field validation helpers
function validateCityField() {
    const cityInput = document.getElementById("city");
    if (!cityInput) return true;
    const city = cityInput.value.trim();

    // Must be at least 2 chars, letters/spaces/periods/hyphens, not pure numbers
    const isValid = city.length >= 2 && !/^\d+$/.test(city) && /^[a-zA-Z\s.'-]+$/.test(city);

    if (!isValid) {
        cityInput.classList.add("is-invalid");
        cityInput.classList.remove("is-valid");
        return false;
    } else {
        cityInput.classList.remove("is-invalid");
        cityInput.classList.add("is-valid");
        return true;
    }
}

function validateStateField() {
    const stateInput = document.getElementById("state");
    if (!stateInput) return true;
    const state = stateInput.value.trim();

    const normalizedState = state.toLowerCase().replace(/[^a-z]/g, "");
    const isStateInList = VALID_INDIAN_STATES.some(s => {
        const norm = s.toLowerCase().replace(/[^a-z]/g, "");
        return norm === normalizedState || norm.includes(normalizedState) || normalizedState.includes(norm);
    });

    const isValid = state.length >= 3 && !/^\d+$/.test(state) && (isStateInList || verifiedPostOffices.length > 0);

    if (!isValid) {
        stateInput.classList.add("is-invalid");
        stateInput.classList.remove("is-valid");
        return false;
    } else {
        stateInput.classList.remove("is-invalid");
        stateInput.classList.add("is-valid");
        return true;
    }
}

function validatePincodeFieldSync() {
    const pinInput = document.getElementById("pincode");
    const pinFeedback = document.getElementById("pincode-feedback");
    if (!pinInput) return true;
    const pincode = pinInput.value.trim();

    if (!/^[1-8][0-9]{5}$/.test(pincode)) {
        pinInput.classList.add("is-invalid");
        pinInput.classList.remove("is-valid");
        if (pinFeedback) pinFeedback.textContent = "Please enter a valid 6-digit Indian PIN code.";
        return false;
    }
    return true;
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
        if (fullNameInput) {
            fullNameInput.classList.add("is-invalid");
            fullNameInput.classList.remove("is-valid");
        }
        hasErrors = true;
    } else if (fullNameInput) {
        fullNameInput.classList.remove("is-invalid");
        fullNameInput.classList.add("is-valid");
    }

    // 2. Strict mobile validation: 10 digits only
    if (!/^[0-9]{10}$/.test(phone)) {
        if (phoneInput) {
            phoneInput.classList.add("is-invalid");
            phoneInput.classList.remove("is-valid");
        }
        hasErrors = true;
    } else if (phoneInput) {
        phoneInput.classList.remove("is-invalid");
        phoneInput.classList.add("is-valid");
    }

    // 3. Email validation: strictly required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRaw || !emailRegex.test(emailRaw)) {
        if (emailInput) {
            emailInput.classList.add("is-invalid");
            emailInput.classList.remove("is-valid");
        }
        hasErrors = true;
    } else if (emailInput) {
        emailInput.classList.remove("is-invalid");
        emailInput.classList.add("is-valid");
    }

    // 4. Street Address validation
    if (!address || address.length < 5) {
        if (addressInput) {
            addressInput.classList.add("is-invalid");
            addressInput.classList.remove("is-valid");
        }
        hasErrors = true;
    } else if (addressInput) {
        addressInput.classList.remove("is-invalid");
        addressInput.classList.add("is-valid");
    }

    // 5. Pincode validation: must be 6 digits and start with 1-8
    if (!/^[1-8][0-9]{5}$/.test(pincode)) {
        if (pinInput) {
            pinInput.classList.add("is-invalid");
            pinInput.classList.remove("is-valid");
        }
        if (pinFeedback) pinFeedback.textContent = "Please enter a valid 6-digit Indian PIN code.";
        hasErrors = true;
    } else if (!isPincodeVerified) {
        // Verify online with India Post
        const verified = await verifyIndianPincode(pincode);
        if (!verified) {
            hasErrors = true;
        }
    }

    // 6. City / District validation: minimum 2 characters, no pure numbers, valid letters
    if (!validateCityField()) {
        hasErrors = true;
    }

    // 7. State validation: check against Indian States/UTs or verified postal state
    if (!validateStateField()) {
        hasErrors = true;
    }

    if (hasErrors) {
        if (form) form.classList.add('was-validated');
        const firstInvalid = form ? form.querySelector('.is-invalid, :invalid') : null;
        if (firstInvalid) firstInvalid.focus();
        return;
    }
    
    const totals = calculateCheckoutTotals();
    const orderId = generateOrderId();
    
    // Construct order items list for WhatsApp
    let itemsText = "";
    cart.forEach((item, index) => {
        const prod = typeof getProductById === "function" ? getProductById(item.id) : null;
        const name = prod ? prod.name : (item.name || item.id);
        const variation = typeof getProductVariation === "function" ? getProductVariation(item.id, item.variationId) : null;
        const varName = (variation && variation.name) ? variation.name : (item.variationName || item.variationId || "3ml");
        const unitPrice = getItemUnitPrice(item);
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        itemsText += `${index + 1}. *${name}* (${varName}) x ${qty} = ₹${unitPrice * qty}\n`;
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
    if (typeof updateCartCount === "function") {
        updateCartCount();
    }

    // Open WhatsApp
    const waPhone = typeof WHATSAPP_PHONE !== "undefined" ? WHATSAPP_PHONE : "919021336695";
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;
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
            phoneInput.addEventListener("blur", () => {
                if (/^[0-9]{10}$/.test(phoneInput.value.trim())) {
                    phoneInput.classList.remove("is-invalid");
                    phoneInput.classList.add("is-valid");
                } else {
                    phoneInput.classList.remove("is-valid");
                    phoneInput.classList.add("is-invalid");
                }
            });
        }

        // Full name blur validation
        const fullNameInput = document.getElementById("fullName");
        if (fullNameInput) {
            fullNameInput.addEventListener("blur", () => {
                if (fullNameInput.value.trim().length >= 2) {
                    fullNameInput.classList.remove("is-invalid");
                    fullNameInput.classList.add("is-valid");
                } else {
                    fullNameInput.classList.remove("is-valid");
                    fullNameInput.classList.add("is-invalid");
                }
            });
        }

        // Address blur validation
        const addressInput = document.getElementById("address");
        if (addressInput) {
            addressInput.addEventListener("blur", () => {
                if (addressInput.value.trim().length >= 5) {
                    addressInput.classList.remove("is-invalid");
                    addressInput.classList.add("is-valid");
                } else {
                    addressInput.classList.remove("is-valid");
                    addressInput.classList.add("is-invalid");
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

            pinInput.addEventListener("blur", async () => {
                const code = pinInput.value.trim();
                if (code.length === 6) {
                    if (!isPincodeVerified) {
                        await verifyIndianPincode(code);
                    }
                } else {
                    validatePincodeFieldSync();
                }
            });
        }

        // Real-time and blur email validation (Required field)
        const emailInput = document.getElementById("email");
        if (emailInput) {
            const validateEmail = () => {
                const val = emailInput.value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (val && emailRegex.test(val)) {
                    emailInput.classList.remove("is-invalid");
                    emailInput.classList.add("is-valid");
                    return true;
                } else {
                    emailInput.classList.remove("is-valid");
                    emailInput.classList.add("is-invalid");
                    return false;
                }
            };

            emailInput.addEventListener("input", () => {
                const val = emailInput.value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(val)) {
                    emailInput.classList.remove("is-invalid");
                    emailInput.classList.add("is-valid");
                }
            });

            emailInput.addEventListener("blur", validateEmail);
        }

        // City & State input change and blur validation
        const cityInput = document.getElementById("city");
        if (cityInput) {
            cityInput.addEventListener("input", () => {
                cityInput.dataset.autofilled = "false";
                if (cityInput.value.trim().length >= 2 && !/^\d+$/.test(cityInput.value.trim())) {
                    cityInput.classList.remove("is-invalid");
                }
            });
            cityInput.addEventListener("blur", () => {
                validateCityField();
            });
        }

        const stateInput = document.getElementById("state");
        if (stateInput) {
            stateInput.addEventListener("input", () => {
                stateInput.dataset.autofilled = "false";
                if (stateInput.value.trim().length >= 3 && !/^\d+$/.test(stateInput.value.trim())) {
                    stateInput.classList.remove("is-invalid");
                }
            });
            stateInput.addEventListener("blur", () => {
                validateStateField();
            });
        }
    }

    if (typeof loadProducts === "function") {
        await loadProducts();
    }
    if (document.getElementById("checkout-form")) {
        renderCheckoutSummary();
    }
});
