import * as THREE from 'three';

export class ViewManager {
    constructor(app) {
        this.app = app;
    }
    
    toggle2D3D() {
        this.app.is3DMode = !this.app.is3DMode;
        document.getElementById('mode-indicator').textContent = `Mode: ${this.app.is3DMode ? '3D' : '2D'}`;
        
        if (!this.app.is3DMode) {
            this.setView('top');
            this.app.controls.enableRotate = false;
            this.app.controls.enabled = false;
            // Désactive visuellement le bouton orbite
            const orbitBtn = document.getElementById('toolbar-view-orbit');
            if (orbitBtn) orbitBtn.classList.remove('active');
        } else {
            this.app.controls.enableRotate = true;
            this.setView('iso');
            // Réactive le bouton orbite (état selon controls.enabled)
            const orbitBtn = document.getElementById('toolbar-view-orbit');
            if (orbitBtn) {
                if (this.app.controls.enabled) {
                    orbitBtn.classList.add('active');
                } else {
                    orbitBtn.classList.remove('active');
                }
            }
        }
    }
    
    setView(view) {
        // Exemples de positions/cibles pour chaque vue
        const views = {
            top:    { position: new THREE.Vector3(0, 0, 200), target: new THREE.Vector3(0, 0, 0) },
            iso:    { position: new THREE.Vector3(150, 150, 150), target: new THREE.Vector3(0, 0, 0) },
            front:  { position: new THREE.Vector3(0, -200, 0), target: new THREE.Vector3(0, 0, 0) },
            back:   { position: new THREE.Vector3(0, 200, 0), target: new THREE.Vector3(0, 0, 0) },
            right:  { position: new THREE.Vector3(200, 0, 0), target: new THREE.Vector3(0, 0, 0) },
            left:   { position: new THREE.Vector3(-200, 0, 0), target: new THREE.Vector3(0, 0, 0) },
        };

        const v = views[view];
        if (!v) {
            console.warn('Vue inconnue:', view);
            return;
        }

        // Utiliser la caméra et les contrôles de l'app
        const camera = this.app.camera;
        const controls = this.app.controls;

        if (camera && v.position && v.target) {
            camera.position.copy(v.position);
            if (controls) {
                controls.target.copy(v.target);
                controls.update();
            }
            camera.lookAt(v.target);
            if (camera.updateProjectionMatrix) camera.updateProjectionMatrix();
        } else {
            console.error('Camera ou cible non définie pour la vue', view);
        }
    }
    
    toggleGrid() {
        // Ne rien faire car il n'y a plus de grille
        document.getElementById('command-output').textContent = 'Grille non disponible';
    }
    
    zoomExtents() {
        if (this.app.objects.length === 0) return;
        
        const box = new THREE.Box3();
        this.app.objects.forEach(obj => {
            box.expandByObject(obj);
        });
        
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.app.camera.fov * (Math.PI / 180);
        const distance = Math.abs(maxDim / Math.sin(fov / 2));
        
        this.app.controls.target.copy(center);
        this.app.camera.position.copy(center);
        this.app.camera.position.z += distance;
        this.app.camera.lookAt(center);
        this.app.controls.update();
    }
}
