// Gestion de l'affichage des éléments utilisés
window.updateUsedElementsDisplay = function() {
    const container = document.getElementById('used-elements-list-display');
    if (!container) {
        console.warn('Container used-elements-list-display non trouvé');
        return;
    }

    // Vérifier si les éléments suivis existent
    if (typeof window.trackedConstructionElements === 'undefined') {
        window.trackedConstructionElements = [];
    }

    // Filtrage simple anti-Hourdis (une seule fois)
    window.trackedConstructionElements = window.trackedConstructionElements.filter(element => {
        if (!element || !element.name) return false;
        const name = element.name.toLowerCase();
        if (name.includes('hourdis') || name.includes('13+6')) {
            return false;
        }
        return true;
    });

    // Regrouper les éléments par nom et catégorie
    const groupedElements = {};
    window.trackedConstructionElements.forEach(element => {
        const key = `${element.name}_${element.category || 'autres'}`;
        if (!groupedElements[key]) {
            groupedElements[key] = {
                name: element.name,
                category: element.category || 'autres',
                dims: element.dims,
                count: 0,
                elements: []
            };
        }
        groupedElements[key].count++;
        groupedElements[key].elements.push(element);
    });

    // Organiser par catégorie
    const byCategory = {};
    Object.values(groupedElements).forEach(group => {
        if (!byCategory[group.category]) {
            byCategory[group.category] = [];
        }
        byCategory[group.category].push(group);
    });

    // Générer le HTML
    let html = '';
    if (Object.keys(byCategory).length === 0) {
        html = '<div class="no-elements">Aucun élément utilisé</div>';
    } else {
        Object.entries(byCategory).forEach(([category, groups]) => {
            html += `<div class="used-category-header">${category.charAt(0).toUpperCase() + category.slice(1)}</div>`;
            
            groups.forEach(group => {
                if (group.dims && 
                    typeof group.dims.x === 'number' && 
                    typeof group.dims.y === 'number' && 
                    typeof group.dims.z === 'number') {
                    
                    const dimText = `${group.dims.x.toFixed(1)}×${group.dims.z.toFixed(1)}×${group.dims.y.toFixed(1)} cm`;
                    html += `
                        <div class="used-element-item" data-element="${group.name}" data-category="${group.category}">
                            <div class="element-info">
                                <div class="element-full-name">${group.name}</div>
                                <div class="element-dimensions">${dimText}</div>
                            </div>
                            ${group.count > 1 ? `<div class="element-count">${group.count}</div>` : ''}
                        </div>
                    `;
                }
            });
        });
    }
    
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

// Fonction pour nettoyer les éléments invalides (simplifiée)
window.cleanupTrackedElements = function() {
    if (typeof window.trackedConstructionElements !== 'undefined') {
        const originalCount = window.trackedConstructionElements.length;
        
        window.trackedConstructionElements = window.trackedConstructionElements.filter(element => {
            // Exclure spécifiquement "Hourdis 13+6"
            if (element && element.name === 'Hourdis 13+6') {
                return false;
            }
            
            return element && 
                   element.name && 
                   element.name.trim() !== '' &&
                   element.dims && 
                   typeof element.dims.x === 'number' && 
                   typeof element.dims.y === 'number' && 
                   typeof element.dims.z === 'number' &&
                   !isNaN(element.dims.x) && 
                   !isNaN(element.dims.y) && 
                   !isNaN(element.dims.z);
        });
        
        const cleanedCount = window.trackedConstructionElements.length;
        console.log(`Nettoyage terminé: ${originalCount - cleanedCount} éléments invalides supprimés`);
        
        // Mettre à jour l'affichage après le nettoyage
        window.updateUsedElementsDisplay();
    }
};

// Fonction spécifique pour supprimer un type d'élément
window.removeElementType = function(elementName) {
    if (typeof window.trackedConstructionElements !== 'undefined') {
        const originalCount = window.trackedConstructionElements.length;
        
        window.trackedConstructionElements = window.trackedConstructionElements.filter(element => {
            return element && element.name !== elementName;
        });
        
        const removedCount = originalCount - window.trackedConstructionElements.length;
        console.log(`${removedCount} élément(s) "${elementName}" supprimé(s)`);
        
        // Mettre à jour l'affichage
        window.updateUsedElementsDisplay();
    }
};

// Initialiser l'affichage au chargement (une seule fois)
document.addEventListener('DOMContentLoaded', () => {
    // Fonction de nettoyage unique
    function cleanHourdis() {
        if (window.trackedConstructionElements) {
            const before = window.trackedConstructionElements.length;
            window.trackedConstructionElements = window.trackedConstructionElements.filter(element => {
                if (!element || !element.name) return true;
                const name = element.name.toLowerCase();
                return !(name.includes('hourdis') || name.includes('13+6'));
            });
            const after = window.trackedConstructionElements.length;
            if (before !== after) {
                console.log(`Nettoyage Hourdis: ${before - after} éléments supprimés`);
            }
        }
        
        if (window.app && window.app.scene) {
            const objectsToDestroy = [];
            window.app.scene.traverse((child) => {
                if (child.userData && child.userData.elementName) {
                    const name = child.userData.elementName.toLowerCase();
                    if (name.includes('hourdis') || name.includes('13+6')) {
                        objectsToDestroy.push(child);
                    }
                }
            });
            objectsToDestroy.forEach(obj => obj.parent && obj.parent.remove(obj));
        }
        
        window.updateUsedElementsDisplay();
    }
    
    // Exécuter une seule fois au chargement
    cleanHourdis();
    
    console.log('Gestionnaire d\'éléments utilisés initialisé');
});
