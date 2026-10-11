// Set your deployed Web App URL here after you deploy your Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwsT7yWwrh20W25pU3DZ5-wGbiyr200hFlYdAQ4xbVyXNjRntPCixvi6u5YkrU5N4Q/exec";

// Default rich product collection matching the luxury Scent Aura X line & design
const DEFAULT_PRODUCTS = [
    {
        id: "oud-royal",
        name: "Oud Royal",
        category: "Oud Attars",
        subCategory: "Rich, Woody & Long Lasting",
        description: "An authentic regal masterpiece featuring aged Cambodian agarwood, rare spices, smoky leather, and warm amber resin. Alcohol-free pure concentrated perfume oil.",
        label: "OUD ROYAL",
        isBestseller: true,
        imageUrl: "assets/images/prod-oud-royal.jpg",
        variations: [
            { id: "3ml", name: "3ml", price: 499 },
            { id: "6ml", name: "6ml", price: 899 },
            { id: "12ml", name: "12ml", price: 1699 }
        ]
    },
    {
        id: "white-musk",
        name: "White Musk",
        category: "Musk Attars",
        subCategory: "Soft, Clean & Refreshing",
        description: "A serene, velvet-smooth scent layered with powdery white florals, creamy clean musk, and subtle vanilla undertones. Perfect for everyday elegance and spiritual calm.",
        label: "WHITE MUSK",
        isBestseller: true,
        imageUrl: "assets/images/prod-white-musk.jpg",
        variations: [
            { id: "3ml", name: "3ml", price: 399 },
            { id: "6ml", name: "6ml", price: 749 },
            { id: "12ml", name: "12ml", price: 1399 }
        ]
    },
    {
        id: "amber-oud",
        name: "Amber Oud",
        category: "Oud Attars",
        subCategory: "Warm, Sweet & Elegant",
        description: "Golden liquid sunlight combining velvety benzoin amber with refined oriental wood accords and caramel warmth. Deep, rich, and unforgettable.",
        label: "AMBER OUD",
        isBestseller: true,
        imageUrl: "assets/images/prod-amber-oud.jpg",
        variations: [
            { id: "3ml", name: "3ml", price: 449 },
            { id: "6ml", name: "6ml", price: 799 },
            { id: "12ml", name: "12ml", price: 1499 }
        ]
    },
    {
        id: "rose-attar",
        name: "Rose Attar",
        category: "Floral Attars",
        subCategory: "Floral & Romantic",
        description: "Traditional Ruh Gulab distilled from thousands of fresh Damascena rose petals hydro-distilled into pure sandalwood base. Timeless romantic purity.",
        label: "ROSE ATTAR",
        isBestseller: true,
        imageUrl: "assets/images/prod-rose-attar.jpg",
        variations: [
            { id: "3ml", name: "3ml", price: 399 },
            { id: "6ml", name: "6ml", price: 749 },
            { id: "12ml", name: "12ml", price: 1399 }
        ]
    },
    {
        id: "kasturi-musk",
        name: "Kasturi Musk",
        category: "Musk Attars",
        subCategory: "Bold & Long Lasting",
        description: "Exotic and deep botanical kasturi deer-musk aroma accord blended with earthy amber crystals and fresh citrus undertones. Distinctive presence that commands admiration.",
        label: "KASTURI MUSK",
        isBestseller: true,
        imageUrl: "assets/images/prod-kasturi-musk.jpg",
        variations: [
            { id: "3ml", name: "3ml", price: 429 },
            { id: "6ml", name: "6ml", price: 799 },
            { id: "12ml", name: "12ml", price: 1499 }
        ]
    },
    {
        id: "chocolate_musk",
        name: "Chocolate Musk",
        category: "Sweet & Earthy",
        subCategory: "Warm, Sweet & Earthy",
        description: "Top notes of sweet chocolate, creamy vanilla, and spicy cinnamon gracefully melting into warm musk, floral jasmine, and earthy patchouli. 100% alcohol-free.",
        label: "CHOCOLATE MUSK",
        isBestseller: false,
        imageUrl: "assets/images/prod-white-musk.jpg",
        variations: [
            { id: "3ml", name: "3ml", price: 49 },
            { id: "6ml", name: "6ml", price: 99 }
        ]
    }
];

let products = [...DEFAULT_PRODUCTS];
let isProductsLoaded = false;

// Fetch products from Google Sheets API with graceful fallback to curated products
async function loadProducts() {
    if (isProductsLoaded && products.length > DEFAULT_PRODUCTS.length) return products;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        
        const response = await fetch(API_URL, { signal: controller });
        clearTimeout(timeoutId);
        
        const json = await response.json();
        if (json.status === "success" && Array.isArray(json.data) && json.data.length > 0) {
            // Merge sheet products with our rich default items if sheet only has 1 test item
            const fetchedList = json.data.map(item => {
                if (!item.imageUrl) {
                    const match = DEFAULT_PRODUCTS.find(d => 
                        String(d.id).toLowerCase() === String(item.id).toLowerCase() || 
                        d.name.toLowerCase() === (item.name || "").toLowerCase()
                    );
                    item.imageUrl = match ? match.imageUrl : "assets/images/prod-oud-royal.jpg";
                }
                return item;
            });

            // Combine fetched products with default items that aren't duplicates
            const combined = [...fetchedList];
            DEFAULT_PRODUCTS.forEach(dp => {
                const dpId = String(dp.id).toLowerCase().replace(/_/g, '-');
                if (!combined.some(p => {
                    const pId = String(p.id).toLowerCase().replace(/_/g, '-');
                    return pId === dpId || String(p.name).toLowerCase() === String(dp.name).toLowerCase();
                })) {
                    combined.push(dp);
                }
            });
            products = combined;
            isProductsLoaded = true;
            return products;
        }
    } catch (e) {
        console.warn("Using offline / curated product catalogue:", e);
    }

    if (!products || products.length === 0) {
        products = [...DEFAULT_PRODUCTS];
    }
    isProductsLoaded = true;
    return products;
}

// Helper to get product by ID with resilient matching (handles number/string, underscore vs dash, name match)
function getProductById(id) {
    if (id === undefined || id === null || id === "") return null;
    const strId = String(id).trim().toLowerCase();
    const cleanId = strId.replace(/_/g, '-');

    const searchPool = (products && products.length > 0) ? products : DEFAULT_PRODUCTS;
    let found = searchPool.find(p => {
        if (!p) return false;
        const pId = String(p.id || '').trim().toLowerCase();
        const pCleanId = pId.replace(/_/g, '-');
        const pName = String(p.name || '').trim().toLowerCase();
        return pId === strId || pCleanId === cleanId || pName === strId || pName === cleanId;
    });

    if (!found) {
        found = DEFAULT_PRODUCTS.find(p => {
            const pId = String(p.id || '').trim().toLowerCase();
            const pCleanId = pId.replace(/_/g, '-');
            const pName = String(p.name || '').trim().toLowerCase();
            return pId === strId || pCleanId === cleanId || pName === strId || pName === cleanId;
        });
    }

    return found || null;
}

// Helper to get variation details
function getProductVariation(productId, variationId) {
    const product = getProductById(productId);
    if (!product || !product.variations || product.variations.length === 0) {
        return { id: variationId || "3ml", name: variationId || "3ml", price: 399 };
    }
    
    if (!variationId) return product.variations[0];
    
    const vStr = String(variationId).trim().toLowerCase();
    const found = product.variations.find(v => 
        String(v.id || '').trim().toLowerCase() === vStr || 
        String(v.name || '').trim().toLowerCase() === vStr
    );
    
    return found || product.variations[0];
}
