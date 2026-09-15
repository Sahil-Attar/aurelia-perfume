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
        
        // Populate variations pill buttons
        const pillsContainer = document.getElementById('product-variation-pills');
        let selectedVariationId = "50ml"; // default
        
        if (pillsContainer && product.variations) {
            pillsContainer.innerHTML = '';
            
            product.variations.forEach((variation, index) => {
                const btn = document.createElement('button');
                btn.className = `pill-btn ${index === 0 ? 'active' : ''}`;
                btn.textContent = variation.name;
                btn.dataset.id = variation.id;
                
                // Set initial active variation
                if (index === 0) {
                    selectedVariationId = variation.id;
                    document.getElementById('product-price').textContent = formatCurrency(variation.price);
                }
                
                // Click handler for pills
                btn.addEventListener('click', () => {
                    // Remove active from all
                    pillsContainer.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
                    // Add active to clicked
                    btn.classList.add('active');
                    
                    selectedVariationId = variation.id;
                    document.getElementById('product-price').textContent = formatCurrency(variation.price);
                });
                
                pillsContainer.appendChild(btn);
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
            addToCartWithQty(product.id, selectedVariationId, qty);
        });
        
    } else {
        document.getElementById('product-not-found').style.display = 'block';
    }
});
