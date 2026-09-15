document.addEventListener("DOMContentLoaded", () => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    const product = getProductById(productId);
    
    if (product) {
        document.getElementById('product-container').style.display = 'flex';
        
        // Update document title
        document.title = `${product.name} | Aurelia Fragrances`;
        
        // Populate static details
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-category').textContent = product.category;
        document.getElementById('product-description').textContent = product.description;
        
        // Set bottle label and color scheme pseudo element text
        const bottle = document.getElementById('product-bottle');
        if (bottle) {
            bottle.setAttribute('data-label', product.label || product.name.split(' ')[1].toUpperCase());
            // Optionally, add product-specific styling class to the bottle here based on ID
            // e.g. bottle.classList.add(`bottle-${product.id}`);
        }
        
        // Populate variations dropdown
        const selectEl = document.getElementById('product-variation');
        if (selectEl && product.variations) {
            selectEl.innerHTML = '';
            product.variations.forEach(variation => {
                const option = document.createElement('option');
                option.value = variation.id;
                option.textContent = variation.name;
                selectEl.appendChild(option);
            });
            
            // Set initial price
            document.getElementById('product-price').textContent = formatCurrency(product.variations[0].price);
            
            // Listen for changes
            selectEl.addEventListener('change', (e) => {
                const varId = e.target.value;
                const variation = getProductVariation(product.id, varId);
                if (variation) {
                    document.getElementById('product-price').textContent = formatCurrency(variation.price);
                }
            });
        }
        
        // Handle Quantity Controls
        const qtyInput = document.getElementById('product-qty');
        const btnMinus = document.getElementById('btn-qty-minus');
        const btnPlus = document.getElementById('btn-qty-plus');
        
        btnMinus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value);
            if (val > 1) {
                qtyInput.value = val - 1;
            }
        });
        
        btnPlus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value);
            qtyInput.value = val + 1;
        });
        
        // Add to Cart Logic
        const btnAddCart = document.getElementById('btn-add-cart');
        btnAddCart.addEventListener('click', () => {
            const qty = parseInt(qtyInput.value);
            const varId = selectEl ? selectEl.value : null;
            
            // Calling custom version of addToCart that accepts quantity, or modifying main.js
            // Let's call a specific function or rely on main.js addToCart modified to read product-qty if id matches.
            // But since this is a dedicated page, we can write direct cart logic or call a new function in main.js
            addToCartWithQty(product.id, varId, qty);
        });
        
    } else {
        document.getElementById('product-not-found').style.display = 'block';
    }
});
