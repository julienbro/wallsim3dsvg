import * as THREE from 'three';
import { DrawingManager } from './managers/DrawingManager.js'; // Ensure this path is correct and DrawingManager is exported

// Classe pour gérer l'indicateur de nord
export class NorthIndicator {
    constructor(app) {
        this.app = app;
        this.currentAngle = 0; // Angle actuel en degrés
        this.indicator = null;
        this.label = null;
        this.createNorthIndicator();
        this.addToScene();
        console.log('NorthIndicator construit avec succès');
    }
    
    createNorthIndicator() {
        // Créer un groupe pour l'indicateur de nord
        this.indicator = new THREE.Group();
        
        // Forme simplifiée : une flèche plate
        const arrowShape = new THREE.Shape();
        arrowShape.moveTo(0, 15); // Pointe de la flèche
        arrowShape.lineTo(-5, 5); // Côté gauche
        arrowShape.lineTo(-2, 5); // Rentrée gauche
        arrowShape.lineTo(-2, -10); // Base gauche
        arrowShape.lineTo(2, -10); // Base droite
        arrowShape.lineTo(2, 5); // Rentrée droite
        arrowShape.lineTo(5, 5); // Côté droit
        arrowShape.lineTo(0, 15); // Retour à la pointe
        
        const arrowGeometry = new THREE.ExtrudeGeometry(arrowShape, {
            depth: 2,
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.2,
            bevelSegments: 2
        });
        
        const arrowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: false,
            opacity: 1
        });
        
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.z = 1;
        
        // Ajouter seulement la flèche au groupe
        this.indicator.add(arrow);
        
        // Positionner l'indicateur au-dessus du plateau
        this.indicator.position.set(50, 50, 5);
        this.indicator.renderOrder = 1000;
        
        // Créer le label "N"
        this.createNorthLabel();
        
        // Masquer par défaut
        this.indicator.visible = false;
    }
    
    createNorthLabel() {
        // Créer un canvas pour le texte "N"
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Dessiner le "N" avec un style simple
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(0, 0, 64, 64);
        
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', 32, 32);
        
        // Créer la texture
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 1
        });
        
        this.label = new THREE.Sprite(material);
        this.label.scale.set(8, 8, 1);
        this.label.position.set(0, 20, 5);
        this.label.renderOrder = 1001;
        
        this.indicator.add(this.label);
    }
    
    addToScene() {
        if (this.app.scene && this.indicator) {
            this.app.scene.add(this.indicator);
            console.log('Indicateur Nord ajouté à la scène');
        }
    }
    
    // Méthode pour définir l'angle du Nord
    setAngle(degrees) {
        if (this.indicator) {
            this.currentAngle = degrees;
            // Convertir les degrés en radians et appliquer la rotation
            // Rotation autour de l'axe Z (vertical)
            this.indicator.rotation.z = (degrees * Math.PI) / 180;
            console.log(`Indicateur Nord orienté à ${degrees}°`);
            
            // CRITIQUE: S'assurer que le SunlightManager utilise le bon angle
            if (this.app.sunlightManager) {
                // Mettre à jour l'angle du Nord dans le SunlightManager
                this.app.sunlightManager.northAngle = degrees;
                console.log(`SunlightManager.northAngle mis à jour: ${degrees}°`);
                
                // Forcer immédiatement la mise à jour de la position du soleil
                if (typeof this.app.sunlightManager.updateSunPosition === 'function') {
                    console.log('Appel updateSunPosition depuis NorthIndicator avec northAngle:', degrees);
                    this.app.sunlightManager.updateSunPosition();
                } else {
                    console.error('updateSunPosition n\'existe pas dans SunlightManager');
                }
            } else {
                console.error('SunlightManager non trouvé dans NorthIndicator.setAngle');
            }
        }
    }
    
    // Méthode pour obtenir l'angle actuel
    getAngle() {
        return this.currentAngle;
    }
    
    // Méthode pour afficher/masquer l'indicateur
    setVisible(visible) {
        if (this.indicator) {
            this.indicator.visible = visible;
        }
    }
}

// SUPPRESSION DE TOUTES LES FONCTIONS addRectangleDeleteMethods ET AUTRES
// Car elles sont déjà intégrées dans WebCAD.js principal

// SUPPRESSION de createTestShapes car elle n'est plus utilisée

export class WebCAD {
    constructor(containerId, options = {}) {
        console.log('[WebCAD Constructor] Initializing WebCAD...');
        try {
            this.drawingManager = new DrawingManager(this);
            console.log('[WebCAD Constructor] `this.drawingManager` after instantiation:', this.drawingManager);
            if (this.drawingManager) {
                console.log('[WebCAD Constructor] typeof `this.drawingManager.handleKeyboard`:', typeof this.drawingManager.handleKeyboard);
            } else {
                console.error('[WebCAD Constructor] CRITICAL: `this.drawingManager` is null or undefined immediately after `new DrawingManager(this)`.');
            }
        } catch (e) {
            console.error("[WebCAD Constructor] FAILED to instantiate DrawingManager:", e);
            this.drawingManager = null; // Explicitly set to null on failure
        }
        // ...existing code...
        // Ensure event listeners are set up correctly, e.g.:
        // document.addEventListener('keydown', (event) => this.handleKeyboard(event)); // Arrow function preserves 'this'
        // OR
        // document.addEventListener('keydown', this.handleKeyboard.bind(this)); // Explicitly bind 'this'
    }

    // ...existing code...

    // This is the method around line 915 where the error occurs
    handleKeyboard(event) {
        // If an input field is focused, don't process global shortcuts
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
            if (event.key !== 'Escape') {
                return;
            }
        }

        // Pass keyboard events to DrawingManager if it exists and has the method
        if (this.drawingManager && typeof this.drawingManager.handleKeyboard === 'function') {
            try {
                this.drawingManager.handleKeyboard(event);
            } catch (e) {
                console.error('[WebCAD handleKeyboard] Error calling drawingManager.handleKeyboard:', e);
            }
        }

        // Handle global shortcuts
        if (event.ctrlKey && event.key.toLowerCase() === 'z') {
            this.undo();
        } else if (event.ctrlKey && event.key.toLowerCase() === 'y') {
            this.redo();
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
            if (this.selectedObject) {
                if (this.uiManager && typeof this.uiManager.deleteSelected === 'function') {
                    this.uiManager.deleteSelected();
                } else {
                    console.warn('[WebCAD handleKeyboard] UIManager or deleteSelected not available.');
                }
            }
        } else if (event.key === 'Escape') {
            if (this.currentTool !== 'select' && this.setTool) {
                this.setTool('select');
                if (this.uiManager && this.uiManager.updateToolButtons) {
                    this.uiManager.updateToolButtons('select');
                }
            } else if (this.selectedObject) {
                this.deselectObject();
            }
        }
    }

    // ...existing code...
}
