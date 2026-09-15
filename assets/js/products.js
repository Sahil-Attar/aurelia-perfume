const products = [
    {
        id: "aurelia-noir",
        name: "Aurelia Noir",
        category: "Woody",
        description: "Warm woods, amber and a soft musk finish.",
        label: "NOIR",
        variations: [
            { id: "50ml", name: "50ml", price: 799 },
            { id: "100ml", name: "100ml", price: 1299 }
        ]
    },
    {
        id: "aurelia-musk",
        name: "Aurelia Musk",
        category: "Musk",
        description: "Clean, soft musk with a subtle floral sweetness.",
        label: "MUSK",
        variations: [
            { id: "50ml", name: "50ml", price: 699 },
            { id: "100ml", name: "100ml", price: 1199 }
        ]
    },
    {
        id: "aurelia-oud",
        name: "Aurelia Oud",
        category: "Oud",
        description: "Rich oud, spice and resinous notes for evenings.",
        label: "OUD",
        variations: [
            { id: "50ml", name: "50ml", price: 999 },
            { id: "100ml", name: "100ml", price: 1499 }
        ]
    },
    {
        id: "aurelia-citrus",
        name: "Aurelia Citrus",
        category: "Fresh",
        description: "Bright citrus, clean florals and a fresh dry-down.",
        label: "CITRUS",
        variations: [
            { id: "50ml", name: "50ml", price: 649 },
            { id: "100ml", name: "100ml", price: 1149 }
        ]
    }
];

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
