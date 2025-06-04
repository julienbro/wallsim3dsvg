// Importer les classes nécessaires de Three.js
import * as THREE from 'three';

// Outil Polyline
export class PolylineTool {
    constructor(webcad) {
        this.webcad = webcad;
        this.drawing = false;
        this.points = [];
        this.previewLine = null;
    }

    activate() {
        this.webcad.renderer.domElement.style.cursor = 'crosshair';
        
        // Activer l'accrochage par défaut
        this.webcad.snapManager.setSnapType('vertex');
    }

    deactivate() {
        this.webcad.renderer.domElement.style.cursor = 'auto';
        
        // Désactiver l'accrochage
        this.webcad.snapManager.clearSnap();
        
        this.finishPolyline();
    }

    onMouseMove(event) {
        if (!this.drawing) return;
        
        // Mettre à jour la position du dernier point avec la position de la souris
        const worldPoint = this.webcad.getWorldPoint(event);
        
        // Appliquer l'accrochage si actif
        const snappedPoint = this.webcad.snapManager.checkSnapping(worldPoint, event);
        
        this.points[this.points.length - 1].copy(snappedPoint);
        
        // Mettre à jour la ligne de prévisualisation
        if (this.previewLine) {
            this.previewLine.geometry.setFromPoints(this.points);
        }
    }

    onMouseDown(event) {
        if (this.drawing) {
            // Si déjà en train de dessiner, terminer le polygone
            this.finishPolyline();
        } else {
            // Commencer un nouveau polygone
            this.startPolyline(event);
        }
    }

    startPolyline(event) {
        this.drawing = true;
        this.points = [];
        
        // Créer une nouvelle objet de type BufferGeometry pour la ligne
        const geometry = new THREE.BufferGeometry();
        
        // Créer le matériau avec la couleur noire
        const material = new THREE.LineBasicMaterial({ 
            color: 0x000000,  // Noir
            linewidth: 2 
        });
        
        // Créer la ligne avec la géométrie et le matériau
        this.previewLine = new THREE.Line(geometry, material);
        this.webcad.scene.add(this.previewLine);
        
        // Ajouter le premier point
        const worldPoint = this.webcad.getWorldPoint(event);
        this.points.push(worldPoint);
        
        // Mettre à jour la géométrie de la ligne avec le premier point
        this.previewLine.geometry.setFromPoints(this.points);
    }
    
    finishPolyline() {
        if (!this.drawing) return;
        
        this.drawing = false;
        
        // Enlever la ligne de prévisualisation
        this.webcad.scene.remove(this.previewLine);
        this.previewLine = null;
        
        // Ajouter l'objet ligne final à l'historique
        this.webcad.addToHistory('create', this.points);
        
        // Réinitialiser les points
        this.points = [];
    }
}