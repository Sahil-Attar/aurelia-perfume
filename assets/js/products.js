// Set your deployed Web App URL here after you deploy your Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwsT7yWwrh20W25pU3DZ5-wGbiyr200hFlYdAQ4xbVyXNjRntPCixvi6u5YkrU5N4Q/exec";

let products = [];
let isProductsLoaded = false;

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

// Fetch products from Google Sheets API with graceful fallback to curated products
async function loadProducts() {
    if (isProductsLoaded && products.length > 0) return products;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch(API_URL, { signal: controller });
        clearTimeout(timeoutId);
        
        const json = await response.json();
        if (json.status === "success" && Array.isArray(json.data) && json.data.length > 0) {
            // Merge sheet products with our rich default items if sheet only has 1 test item
            const fetchedList = json.data.map(item => {
                // If imageUrl is empty, pick matching image from catalogue
                if (!item.imageUrl) {
                    const match = DEFAULT_PRODUCTS.find(d => d.id === item.id || d.name.toLowerCase() === (item.name || "").toLowerCase());
                    item.imageUrl = match ? match.imageUrl : "assets/images/prod-oud-royal.jpg";
                }
                return item;
            });

            // Combine fetched products with default items that aren't duplicates
            const combined = [...fetchedList];
            DEFAULT_PRODUCTS.forEach(dp => {
                if (!combined.some(p => p.id === dp.id)) {
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

    products = [...DEFAULT_PRODUCTS];
    isProductsLoaded = true;
    return products;
}

// Helper to get product by ID
function getProductById(id) {
    if (!products || products.length === 0) {
        return DEFAULT_PRODUCTS.find(p => p.id === id);
    }
    return products.find(p => p.id === id) || DEFAULT_PRODUCTS.find(p => p.id === id);
}

// Helper to get variation details
function getProductVariation(productId, variationId) {
    const product = getProductById(productId);
    if (product && product.variations) {
        return product.variations.find(v => v.id === variationId);
    }
    return null;
}
