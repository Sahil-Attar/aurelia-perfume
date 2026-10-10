// Set your deployed Web App URL here after you deploy your Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwsT7yWwrh20W25pU3DZ5-wGbiyr200hFlYdAQ4xbVyXNjRntPCixvi6u5YkrU5N4Q/exec";

let products = [];
let isProductsLoaded = false;

// Fetch products from Google Sheets API
async function loadProducts() {
    if (isProductsLoaded) return products;

    if (API_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
        console.warn("API_URL is not set. Loading fallback static products.");
        // Fallback for development if no URL is provided
        products = [
            {
                id: "royal-oud",
                name: "Royal Oud",
                category: "Woody",
                description: "A rich, opulent fragrance crafted with precious Agarwood, spices, and warm amber. An exquisite scent of luxury.",
                label: "ROYAL OUD",
                imageUrl: "", // Blank uses CSS fallback
                variations: [
                    { id: "3ml", name: "3ml", price: NUll },
                    { id: "6ml", name: "6ml", price: NUll },
                    { id: "12ml", name: "12ml", price: NUll },
                    { id: "50ml", name: "50ml", price: NUll }
                ]
            }
        ];
        isProductsLoaded = true;
        return products;
    }

    try {
        const response = await fetch(API_URL);
        const json = await response.json();
        if (json.status === "success") {
            products = json.data;
            isProductsLoaded = true;
        } else {
            console.error("Error fetching products:", json.message);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }

    return products;
}

// Helper to get product by ID
function getProductById(id) {
    return products.find(p => p.id === id);
}

// Helper to get variation details
function getProductVariation(productId, variationId) {
    const product = getProductById(productId);
    if (product) {
        return product.variations.find(v => v.id === variationId);
    }
    return null;
}
