import * as THREE from 'three';

export class SnapManager {
    constructor(app) {
        this.app = app;
        this.snapToEndpoints = true;
        this.snapToMidpoints = true;
        this.snapToQuarters = true;
        this.snapToThirds = true;
        this.snapDistance = 10;
        this.snapIndicator = null;
        this.tooltip = null;
        this.isSnappedToAxis = null;
        this.currentSnapType = null;
        
        this.createSnapIndicator();
        this.createTooltip();
    }
    
    createSnapIndicator() {
        const geometry = new THREE.RingGeometry(0.5, 0.8, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
        });
        this.snapIndicator = new THREE.Mesh(geometry, material);
        this.snapIndicator.visible = false;
        this.snapIndicator.renderOrder = 1000;
        this.app.scene.add(this.snapIndicator);
        
        // Créer un indicateur plus visible pour les polylignes
        const dotGeometry = new THREE.SphereGeometry(1, 8, 8);
        const dotMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            depthTest: false,
            depthWrite: false
        });
        this.snapDot = new THREE.Mesh(dotGeometry, dotMaterial);
        this.snapDot.visible = false;
        this.snapDot.renderOrder = 1001;
        this.app.scene.add(this.snapDot);
    }
    
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'drawing-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);
    }
    
    checkSnapping(worldPoint, event) {
        // Réinitialiser le type d'accrochage
        this.currentSnapType = null;
        
        // Activer l'accrochage pour tous les outils de dessin
        const drawingTools = ['line', 'polyline', 'arc', 'rect', 'circle'];
        const shouldSnap = this.snapToEndpoints && 
            (this.app.drawingManager.isDrawing || drawingTools.includes(this.app.currentTool));
        
        if (shouldSnap) {
            const snapPoint = this.checkSnapPoints(worldPoint, event);
            if (snapPoint) {
                this.showSnapIndicator(snapPoint);
                // Retourner directement le point d'accrochage sans modification
                return snapPoint;
            } else {
                this.hideSnapIndicator();
            }
        } else {
            this.hideSnapIndicator();
        }
        
        // Appliquer l'accrochage à la grille seulement si pas d'accrochage spécifique
        if (this.app.snapEnabled && !this.snapIndicator.visible) {
            worldPoint.x = Math.round(worldPoint.x / this.app.gridSize) * this.app.gridSize;
            worldPoint.y = Math.round(worldPoint.y / this.app.gridSize) * this.app.gridSize;
        }
        
        return worldPoint;
    }
    
    checkSnapPoints(currentPoint, mouseEvent) {
        const rect = this.app.renderer.domElement.getBoundingClientRect();
        const mouse2D = new THREE.Vector2(
            ((mouseEvent.clientX - rect.left) / rect.width) * 2 - 1,
            -((mouseEvent.clientY - rect.top) / rect.height) * 2 + 1
        );
        
        let nearestPoint = null;
        let minDistance = this.snapDistance;
        let snapType = null;
        
        // Vérifier d'abord les points de la polyligne en cours de création
        if (this.app.drawingManager.isDrawing && 
            this.app.drawingManager.drawingMode === 'polyline' && 
            this.app.drawingManager.drawingPoints.length > 0) {
            
            this.app.drawingManager.drawingPoints.forEach((point, index) => {
                const result = this.checkPointDistance(point, mouse2D, rect);
                if (result.distance < minDistance) {
                    minDistance = result.distance;
                    nearestPoint = point.clone();
                    snapType = `Point ${index + 1} de la polyligne`;
                }
            });
        }
        
        this.app.objects.forEach(obj => {
            // Points d'extrémité
            if (this.snapToEndpoints) {
                const endpoints = this.getObjectEndpoints(obj);
                endpoints.forEach(point => {
                    const result = this.checkPointDistance(point, mouse2D, rect);
                    
                    if (result.distance < minDistance) {
                        minDistance = result.distance;
                        nearestPoint = point.clone();
                        snapType = 'Extrémité';
                    }
                });
            }
            
            // Points intermédiaires pour les lignes
            if (obj instanceof THREE.Line && obj.geometry.attributes.position) {
                const positions = obj.geometry.attributes.position;
                
                // Pour chaque segment de ligne
                for (let i = 0; i < positions.count - 1; i++) {
                    const p1 = new THREE.Vector3(
                        positions.getX(i),
                        positions.getY(i),
                        positions.getZ(i)
                    );
                    const p2 = new THREE.Vector3(
                        positions.getX(i + 1),
                        positions.getY(i + 1),
                        positions.getZ(i + 1)
                    );
                    
                    // Appliquer la transformation de l'objet
                    p1.applyMatrix4(obj.matrixWorld);
                    p2.applyMatrix4(obj.matrixWorld);
                    
                    // Point milieu
                    if (this.snapToMidpoints) {
                        const midPoint = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
                        const result = this.checkPointDistance(midPoint, mouse2D, rect);
                        if (result.distance < minDistance) {
                            minDistance = result.distance;
                            nearestPoint = midPoint.clone();
                            snapType = 'Milieu (1/2)';
                        }
                    }
                    
                    // Points aux quarts
                    if (this.snapToQuarters) {
                        const quarter1 = new THREE.Vector3().lerpVectors(p1, p2, 0.25);
                        const quarter3 = new THREE.Vector3().lerpVectors(p1, p2, 0.75);
                        
                        let result = this.checkPointDistance(quarter1, mouse2D, rect);
                        if (result.distance < minDistance) {
                            minDistance = result.distance;
                            nearestPoint = quarter1.clone();
                            snapType = '1/4';
                        }
                        
                        result = this.checkPointDistance(quarter3, mouse2D, rect);
                        if (result.distance < minDistance) {
                            minDistance = result.distance;
                            nearestPoint = quarter3.clone();
                            snapType = '3/4';
                        }
                    }
                    
                    // Points aux tiers
                    if (this.snapToThirds) {
                        const third1 = new THREE.Vector3().lerpVectors(p1, p2, 0.333);
                        const third2 = new THREE.Vector3().lerpVectors(p1, p2, 0.667);
                        
                        let result = this.checkPointDistance(third1, mouse2D, rect);
                        if (result.distance < minDistance) {
                            minDistance = result.distance;
                            nearestPoint = third1.clone();
                            snapType = '1/3';
                        }
                        
                        result = this.checkPointDistance(third2, mouse2D, rect);
                        if (result.distance < minDistance) {
                            minDistance = result.distance;
                            nearestPoint = third2.clone();
                            snapType = '2/3';
                        }
                    }
                }
            }
        });
        
        this.currentSnapType = snapType;
        return nearestPoint;
    }
    
    checkPointDistance(point3D, mouse2D, rect) {
        const screenPoint = point3D.clone();
        screenPoint.project(this.app.camera);
        
        const dx = (screenPoint.x - mouse2D.x) * rect.width / 2;
        const dy = (screenPoint.y - mouse2D.y) * rect.height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return { distance, screenPoint };
    }
    
    getObjectEndpoints(obj) {
        const endpoints = [];
        
        if (obj.geometry) {
            if (obj instanceof THREE.Line || obj instanceof THREE.LineLoop) {
                const positions = obj.geometry.attributes.position;
                for (let i = 0; i < positions.count; i++) {
                    const point = new THREE.Vector3(
                        positions.getX(i),
                        positions.getY(i),
                        positions.getZ(i)
                    );
                    point.applyMatrix4(obj.matrixWorld);
                    endpoints.push(point);
                }
            } else if (obj instanceof THREE.Mesh) {
                const box = new THREE.Box3().setFromObject(obj);
                endpoints.push(
                    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
                    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
                    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
                    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
                    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
                    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
                    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
                    new THREE.Vector3(box.max.x, box.max.y, box.max.z)
                );
                
                if (obj.geometry instanceof THREE.CircleGeometry) {
                    endpoints.push(obj.position.clone());
                }
            }
        }
        
        // Ajouter les points de la polyligne en cours de création pour permettre l'accrochage au dernier point
        if (this.app.drawingManager.isDrawing && 
            this.app.drawingManager.drawingMode === 'polyline' && 
            this.app.drawingManager.drawingPoints.length > 0) {
            
            const lastPoint = this.app.drawingManager.drawingPoints[this.app.drawingManager.drawingPoints.length - 1];
            endpoints.push(lastPoint.clone());
        }
        
        return endpoints;
    }
    
    showSnapIndicator(point) {
        this.snapIndicator.position.copy(point);
        this.snapIndicator.position.z += 0.1;
        this.snapIndicator.visible = true;
        this.snapIndicator.lookAt(this.app.camera.position);
        
        // Afficher aussi le point rouge pour les polylignes
        if (this.app.drawingManager.drawingMode === 'polyline') {
            this.snapDot.position.copy(point);
            this.snapDot.position.z += 0.2;
            this.snapDot.visible = true;
        }
        
        // Afficher le type d'accrochage dans l'info-bulle
        if (this.currentSnapType) {
            this.showSnapTooltip(point, this.currentSnapType);
        }
    }
    
    hideSnapIndicator() {
        this.snapIndicator.visible = false;
        this.snapDot.visible = false;
        this.currentSnapType = null;
        this.hideSnapTooltip();
    }
    
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'drawing-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);
    }
    
    checkSnapping(worldPoint, event) {
        // Réinitialiser le type d'accrochage
        this.currentSnapType = null;
        
        // Activer l'accrochage pour tous les outils de dessin
        const drawingTools = ['line', 'polyline', 'arc', 'rect', 'circle'];
        const shouldSnap = this.snapToEndpoints && 
            (this.app.drawingManager.isDrawing || drawingTools.includes(this.app.currentTool));
        
        if (shouldSnap) {
            const snapPoint = this.checkSnapPoints(worldPoint, event);
            if (snapPoint) {
                this.showSnapIndicator(snapPoint);
                // Retourner directement le point d'accrochage sans modification
                return snapPoint;
            } else {
                this.hideSnapIndicator();
            }
        } else {
            this.hideSnapIndicator();
        }
        
        // Appliquer l'accrochage à la grille seulement si pas d'accrochage spécifique
        if (this.app.snapEnabled && !this.snapIndicator.visible) {
            worldPoint.x = Math.round(worldPoint.x / this.app.gridSize) * this.app.gridSize;
            worldPoint.y = Math.round(worldPoint.y / this.app.gridSize) * this.app.gridSize;
        }
        
        return worldPoint;
    }
    
    checkSnapPoints(currentPoint, mouseEvent) {
        const rect = this.app.renderer.domElement.getBoundingClientRect();
        const mouse2D = new THREE.Vector2(
            ((mouseEvent.clientX - rect.left) / rect.width) * 2 - 1,
            -((mouseEvent.clientY - rect.top) / rect.height) * 2 + 1
        );
        
        let nearestPoint = null;
        let minDistance = this.snapDistance;
        let snapType = null;
        
        // Vérifier d'abord les points de la polyligne en cours de création
        if (this.app.drawingManager.isDrawing && 
            this.app.drawingManager.drawingMode === 'polyline' && 
            this.app.drawingManager.drawingPoints.length > 0) {
            
            this.app.drawingManager.drawingPoints.forEach((point, index) => {
                const result = this.checkPointDistance(point, mouse2D, rect);
                if (result.distance < minDistance) {
                    minDistance = result.distance;
                    nearestPoint = point.clone();
                    snapType = `Point ${index + 1} de la polyligne`;
                }
            });
        }
        
        this.app.objects.forEach(obj => {
            // Points d'extrémité
            if (this.snapToEndpoints) {
                const endpoints = this.getObjectEndpoints(obj);
                endpoints.forEach(point => {
                    const result = this.checkPointDistance(point, mouse2D, rect);
                    
                    if (result.distance < minDistance) {
                        minDistance = result.distance;
                        nearestPoint = point.clone();
                        snapType = 'Extrémité';
                    }
                });
            }
            
            // Points intermédiaires pour les lignes
            if (obj instanceof THREE.Line && obj.geometry.attributes.position) {
                const positions = obj.geometry.attributes.position;
                
                // Pour chaque segment de ligne
                for (let i = 0; i < positions.count - 1; i++) {
                    const p1 = new THREE.Vector3(
                        positions.getX(i),
                        positions.getY(i),
                        positions.getZ(i)
                    );
                    const p2 = new THREE.Vector3(
                        positions.getX(i + 1),
                        positions.getY(i + 1),
                        positions.getZ(i + 1)
                    );
                    
                    // Appliquer la transformation de l'objet
                    p1.applyMatrix4(obj.matrixWorld);
                    p2.applyMatrix4(obj.matrixWorld);
                    
                    // Point milieu
                    if (this.snapToMidpoints) {
                        const midPoint = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
                        const result = this.checkPointDistance(midPoint, mouse2D, rect);
                        if (result.distance < minDistance) {
                            minDistance = result.distance;
                            nearestPoint = midPoint.clone();
                            snapType = 'Milieu (1/2)';
                        }
                    }
                    
                    // Points aux quarts
                    if (this.snapToQuarters) {
                        const quarter1 = new THREE.Vector3().lerpVectors(p1, p2, 0.25);
                        const quarter3 = new THREE.Vector3().lerpVectors(p1, p2, 0.75);
                        
                        let result = this.checkPointDistance(quarter1, mouse2D, rect);
                        if (result.distance < minDistance) {
                            minDistance = result.distance;
                            nearestPoint = quarter1.clone();
                            snapType = '1/4';
                        }
                        
                        result = this.checkPointDistance(quarter3, mouse2D, rect);
                        if (result.distance < minDistance) {
                            minDistance = result.distance;
                            nearestPoint = quarter3.clone();
                            snapType = '3/4';
                        }
                    }
                    
                    // Points aux tiers
                    if (this.snapToThirds) {
                        const third1 = new THREE.Vector3().lerpVectors(p1, p2, 0.333);
                        const third2 = new THREE.Vector3().lerpVectors(p1, p2, 0.667);
                        
                        let result = this.checkPointDistance(third1, mouse2D, rect);
                        if (result.distance < minDistance) {
                            minDistance = result.distance;
                            nearestPoint = third1.clone();
                            snapType = '1/3';
                        }
                        
                        result = this.checkPointDistance(third2, mouse2D, rect);
                        if (result.distance < minDistance) {
                            minDistance = result.distance;
                            nearestPoint = third2.clone();
                            snapType = '2/3';
                        }
                    }
                }
            }
        });
        
        this.currentSnapType = snapType;
        return nearestPoint;
    }
    
    checkPointDistance(point3D, mouse2D, rect) {
        const screenPoint = point3D.clone();
        screenPoint.project(this.app.camera);
        
        const dx = (screenPoint.x - mouse2D.x) * rect.width / 2;
        const dy = (screenPoint.y - mouse2D.y) * rect.height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return { distance, screenPoint };
    }
    
    getObjectEndpoints(obj) {
        const endpoints = [];
        
        if (obj.geometry) {
            if (obj instanceof THREE.Line || obj instanceof THREE.LineLoop) {
                const positions = obj.geometry.attributes.position;
                for (let i = 0; i < positions.count; i++) {
                    const point = new THREE.Vector3(
                        positions.getX(i),
                        positions.getY(i),
                        positions.getZ(i)
                    );
                    point.applyMatrix4(obj.matrixWorld);
                    endpoints.push(point);
                }
            } else if (obj instanceof THREE.Mesh) {
                const box = new THREE.Box3().setFromObject(obj);
                endpoints.push(
                    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
                    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
                    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
                    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
                    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
                    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
                    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
                    new THREE.Vector3(box.max.x, box.max.y, box.max.z)
                );
                
                if (obj.geometry instanceof THREE.CircleGeometry) {
                    endpoints.push(obj.position.clone());
                }
            }
        }
        
        // Ajouter les points de la polyligne en cours de création pour permettre l'accrochage au dernier point
        if (this.app.drawingManager.isDrawing && 
            this.app.drawingManager.drawingMode === 'polyline' && 
            this.app.drawingManager.drawingPoints.length > 0) {
            
            const lastPoint = this.app.drawingManager.drawingPoints[this.app.drawingManager.drawingPoints.length - 1];
            endpoints.push(lastPoint.clone());
        }
        
        return endpoints;
    }
    
    showSnapIndicator(point) {
        this.snapIndicator.position.copy(point);
        this.snapIndicator.position.z += 0.1;
        this.snapIndicator.visible = true;
        this.snapIndicator.lookAt(this.app.camera.position);
        
        // Afficher aussi le point rouge pour les polylignes
        if (this.app.drawingManager.drawingMode === 'polyline') {
            this.snapDot.position.copy(point);
            this.snapDot.position.z += 0.2;
            this.snapDot.visible = true;
        }
        
        // Afficher le type d'accrochage dans l'info-bulle
        if (this.currentSnapType) {
            this.showSnapTooltip(point, this.currentSnapType);
        }
    }
    
    hideSnapIndicator() {
        this.snapIndicator.visible = false;
        this.snapDot.visible = false;
        this.currentSnapType = null;
        this.hideSnapTooltip();
    }
    
    showSnapTooltip(point, snapType) {
        if (!this.tooltip) return;
        
        // Projeter le point 3D en coordonnées écran
        const vector = point.clone();
        vector.project(this.app.camera);
        
        const rect = this.app.renderer.domElement.getBoundingClientRect();
        const x = (vector.x + 1) / 2 * rect.width + rect.left;
        const y = -(vector.y - 1) / 2 * rect.height + rect.top;
        
        this.tooltip.innerHTML = `<span style="color: #00ff00;">Accrochage: ${snapType}</span>`;
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${x + 20}px`;
        this.tooltip.style.top = `${y - 30}px`;
    }
    
    hideSnapTooltip() {
        if (this.tooltip && this.currentSnapType) {
            this.tooltip.style.display = 'none';
        }
    }
    
    checkAxisAlignment(startPoint, endPoint) {
        const dx = Math.abs(endPoint.x - startPoint.x);
        const dy = Math.abs(endPoint.y - startPoint.y);
        const dz = Math.abs(endPoint.z - startPoint.z);
        const tolerance = 0.5;
        
        if (dy < tolerance && dz < tolerance && dx > tolerance) {
            return 'X';
        } else if (dx < tolerance && dz < tolerance && dy > tolerance) {
            return 'Y';
        } else if (dx < tolerance && dy < tolerance && dz > tolerance) {
            return 'Z';
        }
        
        return null;
    }
    
    updateTooltip(startPoint, endPoint, mouseEvent) {
        if (!this.tooltip || this.app.drawingManager.drawingMode !== 'line') return;
        
        // Si on est accroché à un point spécifique, afficher uniquement cette info
        if (this.currentSnapType && this.snapIndicator.visible) {
            return; // L'info-bulle d'accrochage est déjà affichée
        }
        
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = angleRad * 180 / Math.PI;
        const normalizedAngle = ((angleDeg % 360) + 360) % 360;
        
        const distance = startPoint.distanceTo(endPoint);
        
        let content = `Angle: ${normalizedAngle.toFixed(1)}°<br>Distance: ${distance.toFixed(2)} cm`;
        
        if (this.isSnappedToAxis) {
            let axisColor = '';
            let axisName = '';
            switch(this.isSnappedToAxis) {
                case 'X':
                    axisColor = '#ff0000';
                    axisName = 'Rouge';
                    break;
                case 'Y':
                    axisColor = '#00ff00';
                    axisName = 'Vert';
                    break;
                case 'Z':
                    axisColor = '#0000ff';
                    axisName = 'Bleu';
                    break;
            }
            content += `<br><span style="color: ${axisColor};">Accroché à l'axe ${axisName}</span>`;
        }
        
        const specialAngles = [0, 45, 90, 135, 180, 225, 270, 315];
        const angleThreshold = 2;
        
        for (let specialAngle of specialAngles) {
            if (Math.abs(normalizedAngle - specialAngle) < angleThreshold) {
                content += `<br><span style="color: #ffff00;">Angle spécial: ${specialAngle}°</span>`;
                break;
            }
        }
        
        this.tooltip.innerHTML = content;
        this.tooltip.style.display = 'block';
        
        if (mouseEvent) {
            const offsetX = 15;
            const offsetY = -50;
            this.tooltip.style.left = `${mouseEvent.clientX + offsetX}px`;
            this.tooltip.style.top = `${mouseEvent.clientY + offsetY}px`;
        }
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
    
    handleKeyboard(event) {
        if (event.key === 'Tab') {
            event.preventDefault();
            this.app.drawingManager.angleSnap = !this.app.drawingManager.angleSnap;
            document.getElementById('snap-indicator').textContent = `Accrochage: ${this.app.drawingManager.angleSnap ? 'ON' : 'OFF'}`;
        } else if (event.key === 'e' || event.key === 'E') {
            this.snapToEndpoints = !this.snapToEndpoints;
            document.getElementById('command-output').textContent = 
                `Accrochage aux extrémités: ${this.snapToEndpoints ? 'Activé' : 'Désactivé'}`;
        } else if (event.key === 'm' || event.key === 'M') {
            // Touche M pour activer/désactiver l'accrochage au milieu
            this.snapToMidpoints = !this.snapToMidpoints;
            document.getElementById('command-output').textContent = 
                `Accrochage au milieu: ${this.snapToMidpoints ? 'Activé' : 'Désactivé'}`;
        } else if (event.key === 'q' || event.key === 'Q') {
            // Touche Q pour activer/désactiver l'accrochage aux quarts
            this.snapToQuarters = !this.snapToQuarters;
            document.getElementById('command-output').textContent = 
                `Accrochage aux quarts: ${this.snapToQuarters ? 'Activé' : 'Désactivé'}`;
        } else if (event.key === 't' || event.key === 'T') {
            // Touche T pour activer/désactiver l'accrochage aux tiers
            this.snapToThirds = !this.snapToThirds;
            document.getElementById('command-output').textContent = 
                `Accrochage aux tiers: ${this.snapToThirds ? 'Activé' : 'Désactivé'}`;
        }
    }
}
