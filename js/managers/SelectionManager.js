import * as THREE from 'three';

export class SelectionManager {
    constructor(app) {
        this.app = app;
        this.selectedObjects = [];
        this.raycaster = new THREE.Raycaster();
        
        // Écouteur d'événements pour les clics de souris
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.app.renderer.domElement.addEventListener('click', (e) => this.handleClick(e));
        this.app.renderer.domElement.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    }

    handleClick(event) {
        const mouse = new THREE.Vector2();
        const rect = this.app.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(mouse, this.app.camera);
        const intersects = this.raycaster.intersectObjects(this.app.objects, true);
        
        if (intersects.length > 0) {
            let handled = false;
            
            // Vérifier d'abord si on clique sur une cotation en mode dimension
            if (this.app.currentTool === 'dimension' && this.app.drawingManager && this.app.drawingManager.dimensionTool) {
                const dimensionTool = this.app.drawingManager.dimensionTool;
                
                // Chercher une cotation dans les objets intersectés
                for (const intersect of intersects) {
                    if (dimensionTool.handleDimensionClick(intersect.object)) {
                        handled = true;
                        break;
                    }
                }
            }
            
            // Si ce n'est pas une cotation ou qu'on n'est pas en mode dimension, sélection normale
            if (!handled) {
                const clickedObject = this.getTopLevelObject(intersects[0].object);
                
                if (event.shiftKey || event.ctrlKey) {
                    // Multi-sélection
                    const index = this.selectedObjects.indexOf(clickedObject);
                    if (index > -1) {
                        this.deselectObject(clickedObject);
                    } else {
                        this.addToSelection(clickedObject);
                    }
                } else {
                    // Sélection simple
                    this.selectObject(clickedObject);
                }
            }
        } else if (!event.shiftKey && !event.ctrlKey) {
            // Clic dans le vide, désélectionner tout
            this.clearSelection();
            
            // Si on est en mode édition de cotation, annuler l'édition
            if (this.app.currentTool === 'dimension' && this.app.drawingManager && this.app.drawingManager.dimensionTool) {
                const dimensionTool = this.app.drawingManager.dimensionTool;
                if (dimensionTool.selectedDimensionGroup) {
                    dimensionTool.cancelDimensionEdit();
                }
            }
        }
        
        if (this.onSelectionChange) {
            this.onSelectionChange(this.selectedObjects);
        }
    }

    handleRightClick(event) {
        event.preventDefault(); // Empêcher le menu contextuel par défaut
        
        const mouse = new THREE.Vector2();
        const rect = this.app.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(mouse, this.app.camera);
        const intersects = this.raycaster.intersectObjects(this.app.objects, true);
        
        if (intersects.length > 0) {
            // Vérifier si on fait un clic droit sur une cotation
            if (this.app.drawingManager && this.app.drawingManager.dimensionTool) {
                const dimensionTool = this.app.drawingManager.dimensionTool;
                
                // Chercher une cotation dans les objets intersectés
                for (const intersect of intersects) {
                    if (dimensionTool.handleRightClick(event, intersect.object)) {
                        return; // Une cotation a été trouvée et gérée
                    }
                }
            }
        }
        
        // Si ce n'est pas une cotation, vous pouvez ajouter d'autres comportements de clic droit ici
    }

    getTopLevelObject(object) {
        // Trouver l'objet de niveau supérieur (groupe ou objet principal)
        while (object.parent && object.parent.isObject3D) {
            object = object.parent;
        }
        return object;
    }

    selectObject(object) {
        if (this.selectedObjects.indexOf(object) === -1) {
            this.selectedObjects.push(object);
            object.material.emissive.setHex(0x444444); // Changer la couleur pour indiquer la sélection
        }
    }

    deselectObject(object) {
        const index = this.selectedObjects.indexOf(object);
        if (index !== -1) {
            this.selectedObjects.splice(index, 1);
            object.material.emissive.setHex(0x000000); // Réinitialiser la couleur
        }
    }

    clearSelection() {
        this.selectedObjects.forEach(object => {
            object.material.emissive.setHex(0x000000); // Réinitialiser la couleur
        });
        this.selectedObjects = [];
    }

    addToSelection(object) {
        this.selectObject(object);
    }

    removeFromSelection(object) {
        this.deselectObject(object);
    }
}