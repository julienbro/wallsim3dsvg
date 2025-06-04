// Gestion de l'affichage des éléments utilisés
window.updateUsedElementsDisplay = function() {
    const container = document.getElementById('used-elements-list');
    if (!container) return;

    const elements = window.trackedConstructionElements || [];
    
    if (elements.length === 0) {
        container.innerHTML = '<div class="empty-used-elements">Aucun élément utilisé</div>';
        return;
    }

    // Grouper les éléments par type et catégorie
    const grouped = {};
    elements.forEach(elem => {
        const key = `${elem.category}_${elem.name}`;
        if (!grouped[key]) {
            grouped[key] = {
                category: elem.category,
                name: elem.name,
                dims: elem.dims,
                count: 0,
                items: []
            };
        }
        grouped[key].count++;
        grouped[key].items.push(elem);
    });

    // Grouper par catégorie
    const byCategory = {};
    Object.values(grouped).forEach(group => {
        if (!byCategory[group.category]) {
            byCategory[group.category] = [];
        }
        byCategory[group.category].push(group);
    });

    // Créer le HTML
    let html = '';
    const categoryNames = {
        briques: 'Briques',
        blocs: 'Blocs',
        linteaux: 'Linteaux',
        isolants: 'Isolants',
        planchers: 'Planchers',
        autres: 'Autres'
    };

    Object.entries(byCategory).forEach(([category, groups]) => {
        html += `<div class="used-category-header">${categoryNames[category] || category}</div>`;
        groups.forEach(group => {
            const dims = group.dims;
            const dimText = `${dims.x.toFixed(1)}×${dims.z.toFixed(1)}×${dims.y.toFixed(1)} cm`;
            html += `
                <div class="used-element-item" data-element="${group.name}" data-category="${group.category}">
                    <div class="element-info">
                        <div class="element-full-name">${group.name}</div>
                        <div class="element-dimensions">${dimText}</div>
                    </div>
                    ${group.count > 1 ? `<div class="element-count">${group.count}</div>` : ''}
                </div>
            `;
        });
    });
    container.innerHTML = html;

    // Ajouter les gestionnaires de clic
    container.querySelectorAll('.used-element-item').forEach(item => {
        item.addEventListener('click', () => {
            const elementName = item.getAttribute('data-element');
            const elementCategory = item.getAttribute('data-category');
            
            // Utiliser UIManager pour insérer l'élément
            if (window.app && window.app.uiManager && window.app.uiManager.insertElementByType) {
                window.app.uiManager.insertElementByType(elementName, { category: elementCategory });
            }
        });
    });
};

// Initialiser l'affichage au chargement
document.addEventListener('DOMContentLoaded', () => {
    window.updateUsedElementsDisplay();
});

function updateUsedElementsDisplay() {
    const displayList = document.getElementById('used-elements-list-display');
    if (!displayList) return;
    
    displayList.innerHTML = '';

    // Count by SPECIFIC element name (not generic type)
    const counts = {};
    window.trackedConstructionElements.forEach(elementObj => {
        if (elementObj && elementObj.name) {
            // Use the specific name like "Linteau Béton L120"
            const key = elementObj.name;
            counts[key] = (counts[key] || 0) + 1;
        }
    });

    if (Object.keys(counts).length === 0) {
        displayList.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #999; font-size: 12px;">Aucun élément utilisé dans le modèle</p>`;
        return;
    }

    for (const elementName in counts) {
        // Use the specific element name to get display info
        const info = elementDisplayInfo[elementName] || elementDisplayInfo['unknown'];
        const count = counts[elementName];
        
        // Find the element data to get dimensions
        const elementData = window.trackedConstructionElements.find(el => el.name === elementName);
        const dims = elementData?.dims;
        let dimText = '';
        if (dims) {
            dimText = `${dims.x || '?'}×${dims.y || '?'}×${dims.z || '?'} cm`;
        }
        
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = `
            padding: 8px; text-align: center; background: #f9f9f9; 
            border: 1px solid #eee; border-radius: 4px; font-size: 11px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer; min-height: 60px;
        `;
        itemDiv.setAttribute('data-elementname', elementName);
        // --- SUPPRESSION DE L'ICÔNE ---
        itemDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 2px;">${info.name}</div>
            <div style="font-size: 9px; color: #666; margin-bottom: 2px;">${dimText}</div>
            <div style="font-size: 10px; color: #777;">(x${count})</div>
        `;
        itemDiv.onmouseenter = function() { this.style.background = '#e8f4fd'; };
        itemDiv.onmouseleave = function() { this.style.background = '#f9f9f9'; };
        
        // Click to insert the same element again
        itemDiv.onclick = function() {
            if (window.app && window.app.uiManager && window.app.uiManager.insertElementByType) {
                window.app.uiManager.insertElementByType(elementName);
                console.log(`Insertion de l'élément: ${elementName}`);
            } else {
                console.warn('UIManager non disponible pour insérer l\'élément');
            }
        };
        
        displayList.appendChild(itemDiv);
    }
}
