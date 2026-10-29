document.addEventListener("DOMContentLoaded", async () => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    // Ensure products list is initialized
    await loadProducts();
    
    const product = getProductById(productId) || (products && products[0]);
    
    if (product) {
        document.getElementById('product-container').style.display = 'block';
        
        // Update document title
        document.title = `${product.name} | Scent Aura X`;
        
        // Populate static details
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-category').textContent = (product.category || "ATTAR COLLECTION").toUpperCase();
        document.getElementById('product-description').textContent = product.description;
        
        const subtextEl = document.getElementById('product-subtext');
        if (subtextEl) {
            subtextEl.textContent = product.subCategory || "Rich, Long Lasting & Alcohol-Free";
        }
        
        // Image
        const imgEl = document.getElementById('product-img');
        if (imgEl && product.imageUrl) {
            imgEl.onerror = function() {
                this.onerror = null;
                this.src = 'assets/images/prod-oud-royal.jpg';
            };
            imgEl.src = product.imageUrl;
            imgEl.alt = product.name;
        }
        
        // Populate variations pill buttons
        const pillsContainer = document.getElementById('product-variation-pills');
        let selectedVariation = (product.variations && product.variations.length > 0) ? product.variations[0] : { id: "3ml", name: "3ml", price: 399 };
        
        if (pillsContainer && product.variations && product.variations.length > 0) {
            pillsContainer.innerHTML = '';
            
            product.variations.forEach((variation, index) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `pill-size-btn ${index === 0 ? 'active' : ''}`;
                btn.textContent = `${variation.name} - ₹${variation.price}`;
                btn.dataset.id = variation.id;
                
                // Set initial
                if (index === 0) {
                    selectedVariation = variation;
                    document.getElementById('product-price').textContent = `₹${variation.price}`;
                }
                
                // Click handler
                btn.addEventListener('click', () => {
                    pillsContainer.querySelectorAll('.pill-size-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedVariation = variation;
                    document.getElementById('product-price').textContent = `₹${variation.price}`;
                });
                
                pillsContainer.appendChild(btn);
            });
        } else {
            document.getElementById('product-price').textContent = `₹399`;
        }
        
        // Handle Quantity Controls
        const qtyInput = document.getElementById('product-qty');
        const btnMinus = document.getElementById('btn-qty-minus');
        const btnPlus = document.getElementById('btn-qty-plus');
        
        btnMinus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val > 1) {
                qtyInput.value = val - 1;
            }
        });
        
        btnPlus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            qtyInput.value = val + 1;
        });
        
        // Add to Cart Logic
        const btnAddCart = document.getElementById('btn-add-cart');
        if (btnAddCart) {
            btnAddCart.addEventListener('click', () => {
                const qty = parseInt(qtyInput.value) || 1;
                addToCartWithQty(product.id, selectedVariation.id, qty);
            });
        }
        
    } else {
        document.getElementById('product-not-found').style.display = 'block';
    }
});
