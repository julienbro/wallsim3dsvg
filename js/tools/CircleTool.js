import * as THREE from 'three';

// Classe pour l'outil Cercle
export class CircleTool {
    constructor(app) {
        this.app = app;
        this.active = false;
        this.centerPoint = null;
        this.previewCircle = null;
    }

    activate() {
        this.active = true;
        this.centerPoint = null;
        this.clearPreview();
        document.getElementById('command-output').textContent = 'Cercle : Cliquez pour définir le centre';
        this.app.controls.enabled = false; // Désactiver les contrôles d'orbite
    }

    deactivate() {
        this.active = false;
        this.clearPreview();
        this.centerPoint = null;
        this.app.controls.enabled = true; // Réactiver les contrôles d'orbite
    }

    handleClick(point) {
        if (!this.active) return;

        if (!this.centerPoint) {
            // Premier clic : définir le point central
            this.centerPoint = point.clone();
            document.getElementById('command-output').textContent = 'Cliquez pour définir le rayon du cercle';
            // L'aperçu sera mis à jour par handleMouseMove
        } else {
            // Deuxième clic : finaliser le cercle
            const radius = this.centerPoint.distanceTo(point);
            this.createCircle(this.centerPoint, radius);
            this.app.toolManager.setTool('select'); // Retour à l'outil de sélection
        }
    }

    handleMouseMove(currentPoint) {
        if (!this.active || !this.centerPoint) return;
        this.updatePreview(this.centerPoint, currentPoint);
    }

    updatePreview(center, edgePoint) {
        this.clearPreview();
        const radius = center.distanceTo(edgePoint) || 0.01; // Assurer une valeur non nulle pour la géométrie

        const geometry = new THREE.CircleGeometry(radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // Aperçu en vert
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        this.previewCircle = new THREE.Mesh(geometry, material);
        this.previewCircle.position.copy(center);
        this.previewCircle.position.z = 0.05; // Légèrement au-dessus du plan de travail
        this.app.scene.add(this.previewCircle);
    }

    createCircle(center, radius) {
        this.clearPreview();

        if (radius < 0.01) { // Empêcher les cercles de taille nulle ou trop petite
            document.getElementById('command-output').textContent = 'Cercle trop petit, annulé.';
            this.cancel();
            return;
        }

        // Créer la géométrie du cercle
        const geometry = new THREE.CircleGeometry(radius, 32);
        
        // Créer le matériau du cercle rempli - blanc pur
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95
        });
        const circleMesh = new THREE.Mesh(geometry, material);
        circleMesh.position.copy(center);
        circleMesh.position.z = 0.01; // Sur le plan de travail
        circleMesh.castShadow = true;
        circleMesh.receiveShadow = true;
        circleMesh.userData.type = 'circle';

        // Créer le contour avec des lignes noires
        const edgeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,  // Noir
            linewidth: 2 
        });
        const edges = new THREE.EdgesGeometry(geometry);
        const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
        circleMesh.add(edgeLines);

        this.app.scene.add(circleMesh);
        this.app.objects.push(circleMesh);
        if (this.app.layers && this.app.layers[this.app.currentLayer]) {
            this.app.layers[this.app.currentLayer].objects.push(circleMesh);
        }
        if (this.app.addToHistory) {
            this.app.addToHistory('create', circleMesh);
        }
        if (this.app.uiManager && this.app.uiManager.updateHistoryPanel) {
            this.app.uiManager.updateHistoryPanel();
        }
        document.getElementById('command-output').textContent = 'Cercle créé.';
    }

    clearPreview() {
        if (this.previewCircle) {
            this.app.scene.remove(this.previewCircle);
            if (this.previewCircle.geometry) this.previewCircle.geometry.dispose();
            if (this.previewCircle.material) this.previewCircle.material.dispose();
            this.previewCircle = null;
        }
    }

    cancel() {
        this.deactivate();
        document.getElementById('command-output').textContent = 'Cercle annulé.';
        if (this.app.toolManager) {
            this.app.toolManager.setTool('select');
        }
    }
}