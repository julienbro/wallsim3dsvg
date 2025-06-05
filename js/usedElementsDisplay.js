window.updateUsedElementsDisplay = function() {
    const container = document.getElementById('used-elements-list'); // Or your actual container ID
    if (!container) {
        console.warn('Used elements container not found.');
        return;
    }
    if (!window.trackedConstructionElements) {
        window.trackedConstructionElements = []; // Initialize if undefined
    }
    
    container.innerHTML = ''; // Clear previous list
    
    // Create a set of displayed IDs to prevent duplicates in this rendering pass
    const displayedElementIds = new Set();

    window.trackedConstructionElements.forEach(elementData => {
        // elementData is an object like:
        // { id: "Brique M50_19.00x5.00x9.00", name: "Brique M50", type: "brique", category: "briques", dims: {x,y,z}, mesh }

        if (displayedElementIds.has(elementData.id)) {
            return; // Already displayed this specific element (name + dims combination)
        }
        displayedElementIds.add(elementData.id);

        const item = document.createElement('div');
        item.className = 'used-element-item'; // Add CSS for styling
        
        const dims = elementData.dims || {};
        const dimText = `${dims.x ? dims.x.toFixed(1) : '?'}×${dims.z ? dims.z.toFixed(1) : '?'}×${dims.y ? dims.y.toFixed(1) : '?'} cm`;
        
        // CRITICAL: Use elementData.name for the display
        item.innerHTML = `
            <span class="element-full-name">${elementData.name}</span> 
            <span class="element-dimensions">${dimText}</span>
        `;
        
        item.addEventListener('click', () => {
            if (window.uiManager && window.uiManager.insertElementByType) {
                // Pass the base name, original category, and the specific instance dimensions
                // so insertElementByType can find the base element and potentially re-apply options if that feature is added.
                window.uiManager.insertElementByType(elementData.name, { 
                    category: elementData.category, 
                    dims: elementData.dims
                });
            } else {
                console.warn('UIManager or insertElementByType not available');
            }
        });
        
        container.appendChild(item);
    });
};

// Call it once on load if elements might already be tracked from a saved project
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof window.updateUsedElementsDisplay === 'function') {
            window.updateUsedElementsDisplay();
        }
    });
} else {
    if (typeof window.updateUsedElementsDisplay === 'function') {
         // Ensure it's callable, might be defined later
        setTimeout(() => window.updateUsedElementsDisplay(), 0);
    }
}
