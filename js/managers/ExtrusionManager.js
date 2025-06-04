import * as THREE from 'three';

export class ExtrusionManager {
    constructor(app) {
        this.app = app;
        this.isExtruding = false;
        this.extrudeStartPoint = null;
        this.extrudeObject = null;
        this.extrudePreview = null;
    }
    
    handleExtrusion(event) {
        if (!this.isExtruding) {
            const intersects = this.app.raycaster.intersectObjects(this.app.objects);
            if (intersects.length > 0) {
                const object = intersects[0].object;
                
                if (this.canExtrude(object)) {
                    this.startExtrusion(object, intersects[0].point);
                } else {
                    document.getElementById('command-output').textContent = 'Cet objet ne peut pas être extrudé';
                }
            }
        } else {
            this.finishExtrusion(event);
        }
    }
    
    canExtrude(object) {
        return object.geometry && 
               object instanceof THREE.Mesh &&
               (object.geometry instanceof THREE.PlaneGeometry || 
                object.geometry instanceof THREE.CircleGeometry ||
                object.geometry instanceof THREE.ShapeGeometry ||
                (object.userData && object.userData.type === 'surface'));
    }
    
    startExtrusion(object, startPoint) {
        this.isExtruding = true;
        this.extrudeObject = object;
        this.extrudeStartPoint = startPoint.clone();
        
        this.app.controls.enabled = false;
        this.createExtrusionPreview(object);
        
        document.getElementById('command-output').textContent = 'Cliquez et déplacez pour définir la hauteur d\'extrusion';
    }
    
    createExtrusionPreview(object) {
        let shape;
        
        if (object.geometry instanceof THREE.PlaneGeometry) {
            const width = object.geometry.parameters.width;
            const height = object.geometry.parameters.height;
            shape = new THREE.Shape();
            shape.moveTo(-width/2, -height/2);
            shape.lineTo(width/2, -height/2);
            shape.lineTo(width/2, height/2);
            shape.lineTo(-width/2, height/2);
            shape.lineTo(-width/2, -height/2);
        } else if (object.geometry instanceof THREE.CircleGeometry) {
            const radius = object.geometry.parameters.radius;
            shape = new THREE.Shape();
            shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
        } else if (object.geometry instanceof THREE.ShapeGeometry || 
                   (object.userData && object.userData.type === 'surface')) {
            // Pour les surfaces créées automatiquement, extraire la forme depuis la géométrie
            shape = this.extractShapeFromGeometry(object.geometry, object.position);
        }
        
        if (shape) {
            const extrudeSettings = {
                depth: 0.1,
                bevelEnabled: false
            };
            
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            // Utiliser MeshPhongMaterial pour supporter les ombres
            const material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.1,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.95
            });
            
            this.extrudePreview = new THREE.Mesh(geometry, material);
            this.extrudePreview.position.copy(object.position);
            this.extrudePreview.castShadow = true;
            this.extrudePreview.receiveShadow = true;
            
            const edges = new THREE.EdgesGeometry(geometry);
            const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
                color: 0x000000,
                linewidth: 2,
                opacity: 1,
                transparent: false
            }));
            this.extrudePreview.add(lines);
            
            this.app.scene.add(this.extrudePreview);
            object.visible = false;
        }
    }
    
    extractShapeFromGeometry(geometry, position) {
        try {
            // Extraire les points de la géométrie
            const vertices = geometry.attributes.position.array;
            const shape = new THREE.Shape();
            
            if (vertices.length >= 6) { // Au moins 3 points (x,y,z pour chaque)
                // Déplacer au premier point (relatif à la position de l'objet)
                shape.moveTo(vertices[0] - position.x, vertices[1] - position.y);
                
                // Tracer les lignes vers les autres points
                for (let i = 3; i < vertices.length; i += 3) {
                    shape.lineTo(vertices[i] - position.x, vertices[i + 1] - position.y);
                }
                
                // Fermer la forme
                shape.closePath();
            }
            
            return shape;
        } catch (error) {
            console.warn('Erreur lors de l\'extraction de la forme:', error);
            return null;
        }
    }
    
    updateExtrusionPreview(event) {
        if (!this.extrudePreview || !this.isExtruding) return;
        
        const rect = this.app.renderer.domElement.getBoundingClientRect();
        const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        const height = Math.max(0.1, Math.abs(mouseY * 20));
        
        const shape = this.getShapeFromObject(this.extrudeObject);
        if (shape) {
            const extrudeSettings = {
                depth: height,
                bevelEnabled: false
            };
            
            const newGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            this.extrudePreview.geometry.dispose();
            this.extrudePreview.geometry = newGeometry;
            
            if (this.extrudePreview.children.length > 0) {
                const oldLines = this.extrudePreview.children[0];
                this.extrudePreview.remove(oldLines);
                oldLines.geometry.dispose();
            }
            
            const edges = new THREE.EdgesGeometry(newGeometry);
            const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
                color: 0x000000,
                linewidth: 2,
                opacity: 1,
                transparent: false
            }));
            this.extrudePreview.add(lines);
            
            document.getElementById('command-output').textContent = `Hauteur: ${height.toFixed(2)} cm (Cliquez pour valider, Échap pour annuler)`;
        }
    }
    
    getShapeFromObject(object) {
        let shape;
        
        if (object.geometry instanceof THREE.PlaneGeometry) {
            const width = object.geometry.parameters.width;
            const height = object.geometry.parameters.height;
            shape = new THREE.Shape();
            shape.moveTo(-width/2, -height/2);
            shape.lineTo(width/2, -height/2);
            shape.lineTo(width/2, height/2);
            shape.lineTo(-width/2, height/2);
            shape.lineTo(-width/2, -height/2);
        } else if (object.geometry instanceof THREE.CircleGeometry) {
            const radius = object.geometry.parameters.radius;
            shape = new THREE.Shape();
            shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
        } else if (object.geometry instanceof THREE.ShapeGeometry || 
                   (object.userData && object.userData.type === 'surface')) {
            // Pour les surfaces créées automatiquement
            shape = this.extractShapeFromGeometry(object.geometry, object.position);
        }
        
        return shape;
    }
    
    finishExtrusion(event) {
        if (!this.extrudePreview) return;
        
        const index = this.app.objects.indexOf(this.extrudeObject);
        if (index > -1) {
            this.app.scene.remove(this.extrudeObject);
            this.app.objects.splice(index, 1);
        }
        
        // Utiliser MeshPhongMaterial pour supporter les ombres
        const material = new THREE.MeshPhongMaterial({
            color: this.extrudeObject.material.color.getHex(),
            side: THREE.DoubleSide
        });
        this.extrudePreview.material = material;
        
        const edges = new THREE.EdgesGeometry(this.extrudePreview.geometry);
        const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 2
        }));
        this.extrudePreview.add(lines);
        
        // Activer les ombres sur l'objet extrudé
        this.extrudePreview.castShadow = true;
        this.extrudePreview.receiveShadow = true;
        
        // S'assurer que tous les enfants peuvent aussi projeter/recevoir des ombres
        this.extrudePreview.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        this.app.objects.push(this.extrudePreview);
        
        // Vérifier que les layers existent avant d'y accéder
        if (this.app.layers && this.app.layers.length > 0) {
            const layerIndex = this.app.currentLayer || 0;
            if (this.app.layers[layerIndex] && this.app.layers[layerIndex].objects) {
                this.app.layers[layerIndex].objects.push(this.extrudePreview);
            }
        }
        
        this.app.addToHistory('extrude', this.extrudePreview);
        
        if (this.app.uiManager) {
            this.app.uiManager.updateHistoryPanel();
        }
        
        this.extrudePreview = null;
        this.extrudeObject = null;
        this.isExtruding = false;
        this.app.controls.enabled = true;
        
        document.getElementById('command-output').textContent = 'Extrusion terminée';
    }
    
    cancelExtrusion() {
        if (this.isExtruding) {
            if (this.extrudePreview) {
                this.app.scene.remove(this.extrudePreview);
                this.extrudePreview.geometry.dispose();
                this.extrudePreview.material.dispose();
                this.extrudePreview = null;
            }
            
            if (this.extrudeObject) {
                this.extrudeObject.visible = true;
            }
            
            this.isExtruding = false;
            this.extrudeObject = null;
            this.app.controls.enabled = true;
            
            document.getElementById('command-output').textContent = 'Extrusion annulée';
        }
    }
    
    createExtrudedGeometry(shape, depth) {
        // Utiliser MeshStandardMaterial avec des propriétés pour apparaître blanc
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0.0,
            emissive: 0xffffff,
            emissiveIntensity: 0.15,
            side: THREE.DoubleSide
        });
        
        return new THREE.Mesh(geometry, material);
    }
}
