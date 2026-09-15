const products = [
    {
        id: "aurelia-noir",
        name: "Aurelia Noir",
        category: "Woody",
        price: 799,
        description: "Warm woods, amber and a soft musk finish.",
        label: "NOIR"
    },
    {
        id: "aurelia-musk",
        name: "Aurelia Musk",
        category: "Musk",
        price: 699,
        description: "Clean, soft musk with a subtle floral sweetness.",
        label: "MUSK"
    },
    {
        id: "aurelia-oud",
        name: "Aurelia Oud",
        category: "Oud",
        price: 999,
        description: "Rich oud, spice and resinous notes for evenings.",
        label: "OUD"
    },
    {
        id: "aurelia-citrus",
        name: "Aurelia Citrus",
        category: "Fresh",
        price: 649,
        description: "Bright citrus, clean florals and a fresh dry-down.",
        label: "CITRUS"
    }
];

// Helper to get product by ID
function getProductById(id) {
    return products.find(p => p.id === id);
}
