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
        
        // Setup Gallery Images & Amazon-style Up/Down Selector
        const imgEl = document.getElementById('product-img');
        const thumbsWrapper = document.getElementById('gallery-thumbs-wrapper');
        const thumbsTrack = document.getElementById('gallery-thumbs-track');
        const btnArrowUp = document.getElementById('thumb-arrow-up');
        const btnArrowDown = document.getElementById('thumb-arrow-down');

        const galleryImages = (product.images && product.images.length > 0) 
            ? product.images 
            : (product.imageUrl ? [product.imageUrl] : ['assets/images/prod-oud-royal.jpg']);

        let currentImageIndex = 0;

        const updateMainImage = (index) => {
            if (index < 0 || index >= galleryImages.length) return;
            currentImageIndex = index;
            if (imgEl) {
                imgEl.src = galleryImages[currentImageIndex];
                imgEl.alt = `${product.name} - View ${currentImageIndex + 1}`;
            }

            // Update active state in thumbnail strip
            if (thumbsTrack) {
                const thumbItems = thumbsTrack.querySelectorAll('.gallery-thumb-item');
                thumbItems.forEach((thumb, idx) => {
                    if (idx === currentImageIndex) {
                        thumb.classList.add('active');
                        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        thumb.classList.remove('active');
                    }
                });
            }
        };

        if (imgEl) {
            imgEl.onerror = function() {
                this.onerror = null;
                this.src = 'assets/images/prod-oud-royal.jpg';
            };
            imgEl.src = galleryImages[0];
            imgEl.alt = product.name;
        }

        // Render thumbnails if multiple images exist, or hide arrows if single image
        if (thumbsWrapper && thumbsTrack) {
            if (galleryImages.length > 1) {
                thumbsWrapper.style.display = 'flex';
                thumbsTrack.innerHTML = '';

                galleryImages.forEach((imgUrl, idx) => {
                    const thumbBtn = document.createElement('button');
                    thumbBtn.type = 'button';
                    thumbBtn.className = `gallery-thumb-item ${idx === 0 ? 'active' : ''}`;
                    thumbBtn.setAttribute('aria-label', `Thumbnail image ${idx + 1}`);

                    const thumbImg = document.createElement('img');
                    thumbImg.src = imgUrl;
                    thumbImg.alt = `${product.name} thumb ${idx + 1}`;
                    thumbImg.onerror = function() {
                        this.onerror = null;
                        this.src = 'assets/images/prod-oud-royal.jpg';
                    };

                    thumbBtn.appendChild(thumbImg);

                    // Click or hover to switch main image (Amazon style)
                    thumbBtn.addEventListener('click', () => updateMainImage(idx));
                    thumbBtn.addEventListener('mouseenter', () => updateMainImage(idx));

                    thumbsTrack.appendChild(thumbBtn);
                });

                // Arrow controls (Up / Down)
                if (btnArrowUp) {
                    btnArrowUp.addEventListener('click', () => {
                        const nextIdx = currentImageIndex > 0 ? currentImageIndex - 1 : galleryImages.length - 1;
                        updateMainImage(nextIdx);
                    });
                }

                if (btnArrowDown) {
                    btnArrowDown.addEventListener('click', () => {
                        const nextIdx = currentImageIndex < galleryImages.length - 1 ? currentImageIndex + 1 : 0;
                        updateMainImage(nextIdx);
                    });
                }
            } else {
                thumbsWrapper.style.display = 'none';
            }
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
