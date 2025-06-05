import * as THREE from 'three';

export class SnapManager {
    constructor(app) {
        this.app = app;
        this.snapToEndpoints = true;
        this.snapToMidpoints = true;
        this.snapToQuarters = true;
        this.snapToThirds = true;
        this.snapToIntersections = true; // Add intersection snapping
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
        // SIMPLIFICATION : suppression de la répétition de logique
        if (!this.snapToEndpoints || (!this.app.drawingManager.isDrawing && 
            !['line', 'polyline', 'arc', 'rect', 'circle'].includes(this.app.currentTool))) {
            this.hideSnapIndicator();
            // Appliquer l'accrochage à la grille seulement si pas d'accrochage spécifique
            if (this.app.snapEnabled) {
                worldPoint.x = Math.round(worldPoint.x / this.app.gridSize) * this.app.gridSize;
                worldPoint.y = Math.round(worldPoint.y / this.app.gridSize) * this.app.gridSize;
            }
            return worldPoint;
        }

        const snapPoint = this.checkSnapPoints(worldPoint, event);
        if (snapPoint) {
            this.showSnapIndicator(snapPoint);
            return snapPoint;
        } else {
            this.hideSnapIndicator();
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

        // Check intersection points FIRST (highest priority)
        if (this.snapToIntersections) {
            const intersectionPoints = this.findIntersectionPoints(currentPoint, mouse2D, rect);
            intersectionPoints.forEach(intersection => {
                if (intersection.distance < minDistance) {
                    minDistance = intersection.distance;
                    nearestPoint = intersection.point.clone();
                    snapType = 'Intersection';
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

    findIntersectionPoints(currentPoint, mouse2D, rect) {
        const intersectionPoints = [];
        const lines = this.app.objects.filter(obj => 
            obj instanceof THREE.Line && 
            obj.geometry && 
            obj.geometry.attributes.position &&
            obj.visible
        );

        if (lines.length < 2) return intersectionPoints;

        // Get all line segments
        const allSegments = [];
        lines.forEach(line => {
            const positions = line.geometry.attributes.position;
            const worldPoints = [];
            
            for (let i = 0; i < positions.count; i++) {
                const point = new THREE.Vector3().fromBufferAttribute(positions, i);
                point.applyMatrix4(line.matrixWorld);
                worldPoints.push(point);
            }

            for (let i = 0; i < worldPoints.length - 1; i++) {
                allSegments.push({ 
                    p1: worldPoints[i], 
                    p2: worldPoints[i + 1], 
                    parentLine: line 
                });
            }
        });

        // Find intersections between all segment pairs
        for (let i = 0; i < allSegments.length; i++) {
            for (let j = i + 1; j < allSegments.length; j++) {
                const seg1 = allSegments[i];
                const seg2 = allSegments[j];

                // Skip if segments are from the same line and adjacent
                if (seg1.parentLine === seg2.parentLine) {
                    continue;
                }

                const intersectionPoint = this.calculateSegmentIntersection(
                    seg1.p1, seg1.p2, seg2.p1, seg2.p2
                );

                if (intersectionPoint) {
                    const result = this.checkPointDistance(intersectionPoint, mouse2D, rect);
                    if (result.distance < this.snapDistance) {
                        intersectionPoints.push({
                            point: intersectionPoint,
                            distance: result.distance,
                            type: 'intersection'
                        });
                    }
                }
            }
        }

        return intersectionPoints;
    }

    calculateSegmentIntersection(p1, p2, p3, p4) {
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;

        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(den) < 1e-6) {
            return null; // Lines are parallel or collinear
        }

        const tNum = (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4);
        const uNum = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3));

        const t = tNum / den;
        const u = uNum / den;

        // Check if intersection is within both line segments
        const epsilon = 1e-6;
        if (t >= -epsilon && t <= 1 + epsilon && u >= -epsilon && u <= 1 + epsilon) {
            const ix = x1 + t * (x2 - x1);
            const iy = y1 + t * (y2 - y1);
            return new THREE.Vector3(ix, iy, p1.z);
        }

        return null;
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
        
        // Change color based on snap type
        if (this.currentSnapType === 'Intersection') {
            this.snapIndicator.material.color.setHex(0xff00ff); // Magenta for intersections
        } else {
            this.snapIndicator.material.color.setHex(0x00ff00); // Green for other snaps
        }
        
        // Afficher aussi le point rouge pour les polylignes
        if (this.app.drawingManager.drawingMode === 'polyline') {
            this.snapDot.position.copy(point);
            this.snapDot.position.z += 0.2;
            this.snapDot.visible = true;
            
            // Change dot color for intersections too
            if (this.currentSnapType === 'Intersection') {
                this.snapDot.material.color.setHex(0xff00ff);
            } else {
                this.snapDot.material.color.setHex(0xff0000);
            }
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
            this.snapToMidpoints = !this.snapToMidpoints;
            document.getElementById('command-output').textContent = 
                `Accrochage au milieu: ${this.snapToMidpoints ? 'Activé' : 'Désactivé'}`;
        } else if (event.key === 'q' || event.key === 'Q') {
            this.snapToQuarters = !this.snapToQuarters;
            document.getElementById('command-output').textContent = 
                `Accrochage aux quarts: ${this.snapToQuarters ? 'Activé' : 'Désactivé'}`;
        } else if (event.key === 't' || event.key === 'T') {
            this.snapToThirds = !this.snapToThirds;
            document.getElementById('command-output').textContent = 
                `Accrochage aux tiers: ${this.snapToThirds ? 'Activé' : 'Désactivé'}`;
        } else if (event.key === 'i' || event.key === 'I') {
            this.snapToIntersections = !this.snapToIntersections;
            document.getElementById('command-output').textContent = 
                `Accrochage aux intersections: ${this.snapToIntersections ? 'Activé' : 'Désactivé'}`;
        }
    }
    
    findSnapPoints(object, mousePoint, snapDistance) {
        const snapPoints = [];
        
        if (!object.geometry || !object.geometry.attributes.position) {
            return snapPoints;
        }

        const positions = object.geometry.attributes.position;
        
        // Déterminer si c'est un arc (ligne avec beaucoup de segments courbes)
        const isArc = this.isObjectAnArc(object);
        
        // Points de début et fin (toujours disponibles)
        const startPoint = new THREE.Vector3(
            positions.getX(0),
            positions.getY(0),
            positions.getZ(0)
        );
        const endPoint = new THREE.Vector3(
            positions.getX(positions.count - 1),
            positions.getY(positions.count - 1),
            positions.getZ(positions.count - 1)
        );

        // Vérifier les points de début et fin
        if (this.isPointInRange(startPoint, mousePoint, snapDistance)) {
            snapPoints.push({
                point: startPoint,
                type: 'endpoint',
                distance: startPoint.distanceTo(mousePoint),
                label: 'Début'
            });
        }

        if (this.isPointInRange(endPoint, mousePoint, snapDistance)) {
            snapPoints.push({
                point: endPoint,
                type: 'endpoint',
                distance: endPoint.distanceTo(mousePoint),
                label: 'Fin'
            });
        }

        // Pour les arcs, ne pas ajouter les points 1/2 et 2/3
        if (!isArc) {
            // Point central (1/2) pour les lignes droites seulement
            if (positions.count >= 2) {
                const midIndex = Math.floor((positions.count - 1) / 2);
                const midPoint = new THREE.Vector3(
                    positions.getX(midIndex),
                    positions.getY(midIndex),
                    positions.getZ(midIndex)
                );

                if (this.isPointInRange(midPoint, mousePoint, snapDistance)) {
                    snapPoints.push({
                        point: midPoint,
                        type: 'midpoint',
                        distance: midPoint.distanceTo(mousePoint),
                        label: 'Milieu'
                    });
                }
            }

            // Points 1/3 et 2/3 pour les lignes droites seulement
            if (positions.count >= 3) {
                const oneThirdIndex = Math.floor((positions.count - 1) / 3);
                const twoThirdIndex = Math.floor(2 * (positions.count - 1) / 3);

                const oneThirdPoint = new THREE.Vector3(
                    positions.getX(oneThirdIndex),
                    positions.getY(oneThirdIndex),
                    positions.getZ(oneThirdIndex)
                );

                const twoThirdPoint = new THREE.Vector3(
                    positions.getX(twoThirdIndex),
                    positions.getY(twoThirdIndex),
                    positions.getZ(twoThirdIndex)
                );

                if (this.isPointInRange(oneThirdPoint, mousePoint, snapDistance)) {
                    snapPoints.push({
                        point: oneThirdPoint,
                        type: 'thirdpoint',
                        distance: oneThirdPoint.distanceTo(mousePoint),
                        label: '1/3'
                    });
                }

                if (this.isPointInRange(twoThirdPoint, mousePoint, snapDistance)) {
                    snapPoints.push({
                        point: twoThirdPoint,
                        type: 'thirdpoint',
                        distance: twoThirdPoint.distanceTo(mousePoint),
                        label: '2/3'
                    });
                }
            }
        } else {
            // Pour les arcs, ajouter des points spéciaux (centre, quadrants, etc.)
            this.addArcSpecificSnapPoints(object, mousePoint, snapDistance, snapPoints);
        }

        // Points perpendiculaires (traités différemment pour les arcs)
        this.findPerpendicularPoints(object, mousePoint, snapDistance, snapPoints);

        // Trier par distance
        snapPoints.sort((a, b) => a.distance - b.distance);
        
        return snapPoints;
    }

    /**
     * Détermine si un objet est un arc basé sur sa géométrie
     */
    isObjectAnArc(object) {
        if (!object.geometry || !object.geometry.attributes.position) {
            return false;
        }

        const positions = object.geometry.attributes.position;
        
        // Si l'objet a beaucoup de points (typique d'un arc), vérifier s'il forme une courbe
        if (positions.count > 10) {
            // Calculer la variation de l'angle entre segments consécutifs
            let totalAngleChange = 0;
            let segmentCount = 0;
            
            for (let i = 0; i < positions.count - 2; i++) {
                const p1 = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
                const p2 = new THREE.Vector3(positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1));
                const p3 = new THREE.Vector3(positions.getX(i + 2), positions.getY(i + 2), positions.getZ(i + 2));
                
                const v1 = p2.clone().sub(p1).normalize();
                const v2 = p3.clone().sub(p2).normalize();
                
                const angle = Math.acos(Math.max(-1, Math.min(1, v1.dot(v2))));
                totalAngleChange += angle;
                segmentCount++;
            }
            
            const avgAngleChange = totalAngleChange / segmentCount;
            
            // Si l'angle moyen entre segments est significatif, c'est probablement un arc
            return avgAngleChange > 0.1; // ~5.7 degrés
        }
        
        return false;
    }

    /**
     * Ajoute des points d'accrochage spécifiques aux arcs
     */
    addArcSpecificSnapPoints(object, mousePoint, snapDistance, snapPoints) {
        const positions = object.geometry.attributes.position;
        
        // Calculer le centre approximatif de l'arc
        const center = this.calculateArcCenter(object);
        if (center && this.isPointInRange(center, mousePoint, snapDistance)) {
            snapPoints.push({
                point: center,
                type: 'center',
                distance: center.distanceTo(mousePoint),
                label: 'Centre'
            });
        }
        
        // Points aux quarts de l'arc (0°, 90°, 180°, 270° relatifs)
        const quarterPoints = this.calculateArcQuarterPoints(object);
        quarterPoints.forEach((point, index) => {
            if (point && this.isPointInRange(point, mousePoint, snapDistance)) {
                const labels = ['25%', '50%', '75%'];
                snapPoints.push({
                    point: point,
                    type: 'quarter',
                    distance: point.distanceTo(mousePoint),
                    label: labels[index]
                });
            }
        });
    }

    /**
     * Calcule le centre approximatif d'un arc
     */
    calculateArcCenter(object) {
        const positions = object.geometry.attributes.position;
        if (positions.count < 3) return null;
        
        try {
            // Prendre 3 points répartis sur l'arc pour calculer le centre
            const p1 = new THREE.Vector3(positions.getX(0), positions.getY(0), positions.getZ(0));
            const midIndex = Math.floor(positions.count / 2);
            const p2 = new THREE.Vector3(positions.getX(midIndex), positions.getY(midIndex), positions.getZ(midIndex));
            const p3 = new THREE.Vector3(positions.getX(positions.count - 1), positions.getY(positions.count - 1), positions.getZ(positions.count - 1));
            
            return this.calculateCircleCenter(p1, p2, p3);
        } catch (error) {
            return null;
        }
    }

    /**
     * Calcule le centre d'un cercle passant par 3 points
     */
    calculateCircleCenter(p1, p2, p3) {
        const ax = p1.x, ay = p1.y;
        const bx = p2.x, by = p2.y;
        const cx = p3.x, cy = p3.y;
        
        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 0.0001) return null; // Points colinéaires
        
        const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
        const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
        
        return new THREE.Vector3(ux, uy, p1.z);
    }

    /**
     * Calcule les points aux quarts d'un arc
     */
    calculateArcQuarterPoints(object) {
        const positions = object.geometry.attributes.position;
        const quarterPoints = [];
        
        // Pour un arc, calculer les points à 25%, 50% et 75% du parcours
        const indices = [
            Math.floor(positions.count * 0.25),
            Math.floor(positions.count * 0.5),
            Math.floor(positions.count * 0.75)
        ];
        
        indices.forEach(index => {
            if (index < positions.count) {
                quarterPoints.push(new THREE.Vector3(
                    positions.getX(index),
                    positions.getY(index),
                    positions.getZ(index)
                ));
            }
        });
        
        return quarterPoints;
    }

    findPerpendicularPoints(object, mousePoint, snapDistance, snapPoints) {
        if (!object.geometry || !object.geometry.attributes.position) {
            return;
        }

        const positions = object.geometry.attributes.position;
        
        // Vérifier si c'est un arc - si oui, ne pas proposer d'accrochage perpendiculaire aux segments
        const isArc = this.isObjectAnArc(object);
        if (isArc) {
            // Pour les arcs, on peut proposer des points perpendiculaires depuis le centre vers la souris
            const center = this.calculateArcCenter(object);
            if (center) {
                // Calculer le point sur l'arc le plus proche du centre dans la direction de la souris
                const direction = mousePoint.clone().sub(center).normalize();
                const radius = this.calculateArcRadius(object, center);
                if (radius > 0) {
                    const perpendicularPoint = center.clone().add(direction.multiplyScalar(radius));
                    
                    if (this.isPointInRange(perpendicularPoint, mousePoint, snapDistance)) {
                        snapPoints.push({
                            point: perpendicularPoint,
                            type: 'perpendicular',
                            distance: perpendicularPoint.distanceTo(mousePoint),
                            label: 'Perpendiculaire'
                        });
                    }
                }
            }
            return; // Ne pas traiter les segments individuels pour les arcs
        }

        // Pour les lignes droites, garder le comportement existant
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

            // Calculer le point perpendiculaire sur ce segment
            const segmentVector = p2.clone().sub(p1);
            const segmentLength = segmentVector.length();
            
            if (segmentLength < 0.001) continue; // Éviter les segments trop courts

            const mouseVector = mousePoint.clone().sub(p1);
            const projection = mouseVector.dot(segmentVector) / (segmentLength * segmentLength);

            // Le point doit être sur le segment (entre 0 et 1)
            if (projection >= 0 && projection <= 1) {
                const perpendicularPoint = p1.clone().add(segmentVector.multiplyScalar(projection));
                
                if (this.isPointInRange(perpendicularPoint, mousePoint, snapDistance)) {
                    snapPoints.push({
                        point: perpendicularPoint,
                        type: 'perpendicular',
                        distance: perpendicularPoint.distanceTo(mousePoint),
                        label: 'Perpendiculaire'
                    });
                }
            }
        }
    }

    /**
     * Calcule le rayon approximatif d'un arc
     */
    calculateArcRadius(object, center) {
        if (!center || !object.geometry || !object.geometry.attributes.position) {
            return 0;
        }

        const positions = object.geometry.attributes.position;
        const startPoint = new THREE.Vector3(
            positions.getX(0),
            positions.getY(0),
            positions.getZ(0)
        );

        return center.distanceTo(startPoint);
    }

    findNearestSnapPoint(mousePosition) {
        if (!this.enabled) return null;

        const snapDistance = this.snapDistance;
        let bestSnapPoint = null;
        let minDistance = snapDistance;

        // Convertir la position de la souris en coordonnées 3D
        const mousePoint = this.screenToWorld(mousePosition);
        if (!mousePoint) return null;

        this.app.objects.forEach(object => {
            // Ignorer les objets temporaires et les surfaces
            if (object.userData && (object.userData.isTemporary || object.userData.type === 'surface')) {
                return;
            }

            // Vérifier si c'est un arc pour modifier le comportement d'accrochage
            const isArc = this.isObjectAnArc(object);
            
            const snapPoints = this.findSnapPoints(object, mousePoint, snapDistance);
            
            snapPoints.forEach(snapPoint => {
                if (snapPoint.distance < minDistance) {
                    // Pour les arcs, filtrer certains types d'accrochage indésirables
                    if (isArc && this.shouldSkipSnapPointForArc(snapPoint)) {
                        return;
                    }
                    
                    minDistance = snapPoint.distance;
                    bestSnapPoint = snapPoint;
                }
            });
        });

        return bestSnapPoint;
    }

    /**
     * Détermine si un point d'accrochage doit être ignoré pour un arc
     */
    shouldSkipSnapPointForArc(snapPoint) {
        // Pour les arcs, ignorer les points d'accrochage sur les segments intermédiaires
        // qui ne correspondent pas aux points géométriquement significatifs
        if (snapPoint.type === 'perpendicular') {
            // Garder les perpendiculaires calculées depuis le centre
            return false;
        }
        
        // Ignorer les accrochages aux points intermédiaires des segments qui composent l'arc
        // sauf s'ils correspondent aux points remarquables (début, fin, centre, quarts)
        const allowedTypes = ['endpoint', 'center', 'quarter', 'midpoint'];
        return !allowedTypes.includes(snapPoint.type);
    }
}
