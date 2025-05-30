import * as THREE from 'three';
import { LineTool } from '../tools/LineTool.js';
import { ParallelTool } from '../tools/ParallelTool.js';
import { TrimTool } from '../tools/TrimTool.js';
import { ExtendTool } from '../tools/ExtendTool.js';
import { HatchTool } from '../tools/HatchTool.js';
import { RectangleTool } from '../tools/RectangleTool.js'; // Import RectangleTool
import { CircleTool } from '../tools/CircleTool.js';     // Import CircleTool

export class DrawingManager {
    constructor(app) {
        this.app = app;
        this.isDrawing = false; // General flag, specific tools might manage their own active state
        this.drawingPoints = [];
        this.tempObject = null;
        this.drawingMode = null; // This will be less used if tools manage their own mode
        this.snapHelpers = [];
        this.angleSnap = true;
        this.angleSnapIncrement = 5;
        this.showSnapGuides = true;
        this.shiftPressed = false;
        this.contextMenu = null;
        
        // Créer les outils
        this.lineTool = new LineTool(app);
        this.parallelTool = new ParallelTool(app);
        this.trimTool = new TrimTool(app);
        this.extendTool = new ExtendTool(app);
        this.hatchTool = new HatchTool(app);
        this.rectangleTool = new RectangleTool(app); // Instantiate RectangleTool
        this.circleTool = new CircleTool(app);       // Instantiate CircleTool
        
        this.createContextMenu();
    }
    
    createContextMenu() {
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'polyline-context-menu';
        this.contextMenu.style.display = 'none';
        this.contextMenu.innerHTML = `
            <div class="context-menu-item" id="close-polyline">
                <i class="fas fa-check-circle"></i> Fermer la polyligne
            </div>
            <div class="context-menu-item" id="finish-polyline">
                <i class="fas fa-stop"></i> Laisser ouverte
            </div>
            <div class="context-menu-item" id="cancel-polyline">
                <i class="fas fa-times"></i> Annuler
            </div>
        `;
        document.body.appendChild(this.contextMenu);
        
        // Gestionnaires d'événements
        document.getElementById('close-polyline').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideContextMenu();
            this.closePolyline();
            this.exitPolylineMode();
        });
        
        document.getElementById('finish-polyline').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideContextMenu();
            this.finishPolyline();
            this.exitPolylineMode();
        });
        
        document.getElementById('cancel-polyline').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideContextMenu();
            this.cancelDrawing();
            this.exitPolylineMode();
        });
        
        // Cacher le menu en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
    }
    
    exitPolylineMode() {
        // Retourner à l'outil de sélection
        this.app.toolManager.setTool('select');
        document.getElementById('command-output').textContent = 'Polyligne terminée';
    }
    
    showContextMenu(x, y) {
        if (this.isDrawing && this.drawingMode === 'polyline' && this.drawingPoints.length >= 2) {
            this.contextMenu.style.left = `${x}px`;
            this.contextMenu.style.top = `${y}px`;
            this.contextMenu.style.display = 'block';
        }
    }
    
    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
    }
    
    closePolyline() {
        if (this.isDrawing && this.drawingMode === 'polyline' && this.drawingPoints.length >= 3) {
            // Ajouter le premier point à la fin pour fermer la polyligne
            this.drawingPoints.push(this.drawingPoints[0].clone());
            
            // Créer directement une surface fermée
            this.createSurfaceFromPoints(this.drawingPoints);
            
            // Créer aussi la polyligne fermée
            this.finishPolyline();
        }
    }
    
    handleDrawing(point) {
        const cmdOutput = document.getElementById('command-output');
        let adjustedPoint = point;
        
        switch(this.app.currentTool) {
            case 'line':
                this.lineTool.handleClick(adjustedPoint);
                break;
            case 'rect': // Delegate to RectangleTool
                this.rectangleTool.handleClick(adjustedPoint);
                break;
            case 'circle': // Delegate to CircleTool
                this.circleTool.handleClick(adjustedPoint);
                break;
            case 'parallel':
                this.parallelTool.handleClick(adjustedPoint);
                break;
                
            case 'trim':
                this.trimTool.handleClick(adjustedPoint);
                break;
                
            case 'extend':
                this.extendTool.handleClick(adjustedPoint);
                break;
                
            case 'hatch':
                this.hatchTool.handleClick(adjustedPoint);
                break;
                
            case 'polyline':
                // Keep existing polyline logic for now, or refactor to PolylineTool
                if (!this.isDrawing) { // isDrawing here refers to polyline's state
                    this.startDrawing('polyline'); // This sets this.isDrawing = true for polyline
                    this.drawingPoints.push(adjustedPoint);
                    cmdOutput.textContent = 'Cliquez pour le point suivant (clic droit pour terminer)';
                } else {
                    this.drawingPoints.push(adjustedPoint);
                    this.updatePolyline(); // This is for the tempObject of polyline
                    cmdOutput.textContent = 'Cliquez pour le point suivant (clic droit pour terminer)';
                }
                break;
                
            case 'arc':
                if (!this.isDrawing) {
                    this.startDrawing('arc');
                    this.drawingPoints.push(adjustedPoint);
                    cmdOutput.textContent = 'Cliquez pour le point de passage de l\'arc';
                } else if (this.drawingPoints.length === 1) {
                    this.drawingPoints.push(adjustedPoint);
                    cmdOutput.textContent = 'Cliquez pour le point final de l\'arc';
                } else {
                    this.drawingPoints.push(adjustedPoint);
                    this.finishArc();
                }
                break;
                
            case 'box':
            case 'sphere':
            case 'cylinder':
                this.createObject(adjustedPoint);
                break;
        }
    }
    
    startDrawing(mode) {
        // Deactivate all tools first to ensure clean state
        this.lineTool.deactivate();
        this.parallelTool.deactivate();
        this.trimTool.deactivate();
        this.extendTool.deactivate();
        this.hatchTool.deactivate();
        this.rectangleTool.deactivate();
        this.circleTool.deactivate();

        this.isDrawing = false; // Reset general drawing flag
        this.drawingMode = mode; // Store current mode for context
        this.drawingPoints = []; // Clear points for modes that use this (like polyline)
        
        if (this.tempObject) { // Clear any old tempObject from DrawingManager itself
            this.app.scene.remove(this.tempObject);
            this.tempObject = null;
        }

        // Activate the specific tool
        if (mode === 'line') {
            this.lineTool.activate();
        } else if (mode === 'parallel') {
            this.parallelTool.activate();
        } else if (mode === 'trim') {
            this.trimTool.activate();
        } else if (mode === 'extend') {
            this.extendTool.activate();
        } else if (mode === 'hatch') {
            this.hatchTool.activate();
        } else if (mode === 'rect') {
            this.rectangleTool.activate();
        } else if (mode === 'circle') {
            this.circleTool.activate();
        } else if (mode === 'polyline') {
            this.isDrawing = true; // Polyline uses DrawingManager's isDrawing flag
            this.app.controls.enabled = false;
            document.getElementById('command-output').textContent = 'Cliquez pour le premier point de la polyligne';
        } else {
            // For other modes like box, sphere, cylinder that might be single-click
            this.isDrawing = true;
            this.app.controls.enabled = false;
        }
    }
    
    updateDrawingPreview(currentPoint, event) {
        // console.log(`DM.updateDrawingPreview: tool=${this.app.currentTool}, currentPoint=(${currentPoint?.x.toFixed(2)}, ${currentPoint?.y.toFixed(2)})`);

        // Delegate to active tool if it has a mouse move handler
        if (this.app.currentTool === 'line' && this.lineTool.active && this.lineTool.isDrawing) {
            // console.log("DM: Delegating to LineTool.updatePreview");
            this.lineTool.updatePreview(currentPoint);
            return;
        } else if (this.app.currentTool === 'rect' && this.rectangleTool.active) {
            // console.log("DM: Delegating to RectangleTool.handleMouseMove, active:", this.rectangleTool.active, "startPoint:", !!this.rectangleTool.startPoint);
            this.rectangleTool.handleMouseMove(currentPoint);
            return;
        } else if (this.app.currentTool === 'circle' && this.circleTool.active) {
            // console.log("DM: Delegating to CircleTool.handleMouseMove, active:", this.circleTool.active, "centerPoint:", !!this.circleTool.centerPoint);
            this.circleTool.handleMouseMove(currentPoint);
            return;
        } else if (this.app.currentTool === 'parallel' && this.parallelTool.active) {
            // console.log("DM: Delegating to ParallelTool.updatePreview");
            this.parallelTool.updatePreview(currentPoint);
            return;
        } else if (this.app.currentTool === 'trim' && this.trimTool.active) {
            // console.log("DM: Delegating to TrimTool.updatePreview");
            this.trimTool.updatePreview(currentPoint);
            return;
        }
        
        // Fallback for polyline or other tools managed directly by DrawingManager's tempObject
        if (!this.isDrawing || (this.drawingMode !== 'polyline' && this.drawingPoints.length === 0)) {
            // console.log("DM.updateDrawingPreview: Not drawing or no points for polyline/generic.");
            return;
        }
        
        if (this.tempObject) {
            this.app.scene.remove(this.tempObject);
            if (this.tempObject.geometry) this.tempObject.geometry.dispose();
            if (this.tempObject.material) this.tempObject.material.dispose();
            this.tempObject = null;
        }
        this.clearSnapHelpers();
        
        // Pour la polyligne, utiliser le point d'accrochage s'il est disponible
        let previewPoint = currentPoint;
        if (this.drawingMode === 'polyline' && this.app.snapManager.snapIndicator.visible && this.app.snapManager.currentSnapType) {
            previewPoint = this.app.snapManager.snapIndicator.position.clone();
            previewPoint.z = currentPoint.z;
        }
        
        switch(this.drawingMode) {
            case 'polyline':
                const points = [...this.drawingPoints, previewPoint];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineDashedMaterial({ 
                    color: 0x000000,
                    linewidth: 3,
                    scale: 1,
                    dashSize: 0.5,  // Traits plus courts
                    gapSize: 0.8,   // Espaces plus courts
                    opacity: 0.5,
                    transparent: true
                });
                this.tempObject = new THREE.Line(geometry, material);
                this.tempObject.computeLineDistances();
                this.app.scene.add(this.tempObject);
                break;
                
            case 'arc':
                if (this.drawingPoints.length === 1) {
                    // Aperçu simple avec une ligne droite en pointillés pour le deuxième point
                    const points = [this.drawingPoints[0], currentPoint];
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineDashedMaterial({ 
                        color: 0x000000,
                        linewidth: 3,
                        scale: 1,
                        dashSize: 2,
                        gapSize: 2,
                        opacity: 0.5,
                        transparent: true
                    });
                    this.tempObject = new THREE.Line(geometry, material);
                    this.tempObject.computeLineDistances();
                    this.app.scene.add(this.tempObject);
                } else if (this.drawingPoints.length === 2) {
                    // Créer un aperçu de l'arc en pointillés
                    const arcGeometry = this.createArcGeometry(this.drawingPoints[0], this.drawingPoints[1], currentPoint);
                    if (arcGeometry) {
                        const material = new THREE.LineDashedMaterial({ 
                            color: 0x000000,
                            linewidth: 3,
                            scale: 1,
                            dashSize: 2,
                            gapSize: 2,
                            opacity: 0.5,
                            transparent: true
                        });
                        this.tempObject = new THREE.Line(arcGeometry, material);
                        this.tempObject.computeLineDistances();
                        this.app.scene.add(this.tempObject);
                    }
                }
                break;
        }
    }
    
    finishLine() {
        if (this.drawingPoints.length >= 2) {
            const geometry = new THREE.BufferGeometry().setFromPoints(this.drawingPoints);
            const material = new THREE.LineBasicMaterial({ 
                color: 0x000000,
                linewidth: 2,
                opacity: 1,
                transparent: false,
                depthTest: true,
                depthWrite: true
            });
            const line = new THREE.Line(geometry, material);
            line.renderOrder = 10;
            line.updateMatrix();
            line.matrixAutoUpdate = true;
            
            this.app.scene.add(line);
            this.app.objects.push(line);
            this.app.layers[this.app.currentLayer].objects.push(line);
            
            // Ajouter à l'historique après création
            this.app.addToHistory('create', line);
            
            if (this.app.uiManager) {
                this.app.uiManager.updateHistoryPanel();
            }
            
            // Vérifier si cette ligne ferme un contour
            this.checkForClosedShape(line);
        }
        
        this.endDrawing();
    }
    
    finishRectangle() {
        if (this.drawingPoints.length >= 2) {
            const p1 = this.drawingPoints[0];
            const p2 = this.drawingPoints[1];
            const width = Math.abs(p2.x - p1.x) || 0.1;
            const height = Math.abs(p2.y - p1.y) || 0.1;
            const centerX = (p1.x + p2.x) / 2;
            const centerY = (p1.y + p2.y) / 2;
            
            const geometry = new THREE.PlaneGeometry(width, height);
            // Utiliser MeshPhongMaterial pour supporter les ombres
            const material = new THREE.MeshPhongMaterial({ 
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
                depthTest: true,
                depthWrite: true
            });
            const rect = new THREE.Mesh(geometry, material);
            rect.position.set(centerX, centerY, 0.001);
            rect.renderOrder = 10;
            rect.castShadow = true;
            rect.receiveShadow = true;
            
            // Ajouter des arêtes noires
            const edges = new THREE.EdgesGeometry(geometry);
            const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
                color: 0x000000,
                linewidth: 2
            }));
            edgeLines.renderOrder = 11;
            rect.add(edgeLines);
            
            rect.userData = {
                type: 'rectangle',
                width: width,
                height: height
            };
            
            this.app.scene.add(rect);
            this.app.objects.push(rect);
            
            // Vérifier que les layers existent
            if (this.app.layers && this.app.layers.length > 0) {
                const layerIndex = this.app.currentLayer || 0;
                if (this.app.layers[layerIndex]) {
                    this.app.layers[layerIndex].objects.push(rect);
                }
            }
            
            this.app.addToHistory('create', rect);
            
            // Mise à jour de l'interface si disponible
            if (this.app.uiManager) {
                this.app.uiManager.updateHistoryPanel();
            }
        }
        
        this.endDrawing();
    }
    
    finishCircle() {
        if (this.drawingPoints.length >= 2) {
            const center = this.drawingPoints[0];
            const radius = center.distanceTo(this.drawingPoints[1]) || 0.1;
            
            const geometry = new THREE.CircleGeometry(radius, 32);
            // Utiliser MeshPhongMaterial pour supporter les ombres
            const material = new THREE.MeshPhongMaterial({ 
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
                depthTest: true,
                depthWrite: true
            });
            const circle = new THREE.Mesh(geometry, material);
            circle.position.copy(center);
            circle.position.z = 0.001;
            circle.renderOrder = 10;
            circle.castShadow = true;
            circle.receiveShadow = true;
            
            // Ajouter des arêtes noires
            const edges = new THREE.EdgesGeometry(geometry);
            const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
                color: 0x000000,
                linewidth: 2
            }));
            edgeLines.renderOrder = 11;
            circle.add(edgeLines);
            
            this.app.scene.add(circle);
            this.app.objects.push(circle);
            
            // Vérifier que les layers existent
            if (this.app.layers && this.app.layers.length > 0) {
                const layerIndex = this.app.currentLayer || 0;
                if (this.app.layers[layerIndex]) {
                    this.app.layers[layerIndex].objects.push(circle);
                }
            }
            
            this.app.addToHistory('create', circle);
            
            // Mise à jour de l'interface si disponible
            if (this.app.uiManager) {
                this.app.uiManager.updateHistoryPanel();
            }
        }
        
        this.endDrawing();
    }
    
    finishPolyline() {
        if (this.drawingPoints.length >= 2) {
            const geometry = new THREE.BufferGeometry().setFromPoints(this.drawingPoints);
            const material = new THREE.LineBasicMaterial({ 
                color: 0x000000,
                linewidth: 2,
                opacity: 1,
                transparent: false,
                depthTest: true,
                depthWrite: true
            });
            const polyline = new THREE.Line(geometry, material);
            polyline.renderOrder = 10;
            polyline.updateMatrix();
            polyline.matrixAutoUpdate = true;
            
            this.app.scene.add(polyline);
            this.app.objects.push(polyline);
            this.app.layers[this.app.currentLayer].objects.push(polyline);
            
            // Ajouter à l'historique après création
            this.app.addToHistory('create', polyline);
            
            if (this.app.uiManager) {
                this.app.uiManager.updateHistoryPanel();
            }
            
            // Vérifier si cette polyligne ferme un contour et créer une surface
            this.checkForClosedShapeAndCreateSurface(polyline);
        }
        
        this.endDrawing();
        this.hideContextMenu();
    }
    
    createObject(position) {
        let geometry, material, mesh;
        
        switch(this.app.currentTool) {
            case 'box':
                geometry = new THREE.BoxGeometry(10, 10, 10);
                material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                mesh.position.z = 5;
                mesh.renderOrder = 10;
                mesh.castShadow = true; // Projette des ombres
                mesh.receiveShadow = true; // Reçoit des ombres
                
                const boxEdges = new THREE.EdgesGeometry(geometry);
                const boxLines = new THREE.LineSegments(boxEdges, new THREE.LineBasicMaterial({ 
                    color: 0x000000,
                    linewidth: 2
                }));
                boxLines.renderOrder = 11;
                mesh.add(boxLines);
                break;
                
            case 'sphere':
                geometry = new THREE.SphereGeometry(5, 32, 16);
                material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                mesh.position.z = 5;
                mesh.renderOrder = 10;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                const sphereEdges = new THREE.EdgesGeometry(geometry);
                const sphereLines = new THREE.LineSegments(sphereEdges, new THREE.LineBasicMaterial({ 
                    color: 0x000000,
                    linewidth: 2
                }));
                sphereLines.renderOrder = 11;
                mesh.add(sphereLines);
                break;
                
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(5, 5, 10, 32);
                material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                mesh.position.z = 5;
                mesh.renderOrder = 10;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                const cylinderEdges = new THREE.EdgesGeometry(geometry);
                const cylinderLines = new THREE.LineSegments(cylinderEdges, new THREE.LineBasicMaterial({ 
                    color: 0x000000,
                    linewidth: 2
                }));
                cylinderLines.renderOrder = 11;
                mesh.add(cylinderLines);
                break;
        }
        
        if (mesh) {
            this.app.scene.add(mesh);
            this.app.objects.push(mesh);
            this.app.layers[this.app.currentLayer].objects.push(mesh);
            this.app.addToHistory('create', mesh);
            this.app.uiManager.updateHistoryPanel();
        }
    }
    
    applyAngleSnap(startPoint, currentPoint) {
        const dx = currentPoint.x - startPoint.x;
        const dy = currentPoint.y - startPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        const snappedAngle = Math.round(currentAngle / this.angleSnapIncrement) * this.angleSnapIncrement;
        const snappedAngleRad = snappedAngle * Math.PI / 180;
        
        const snappedPoint = new THREE.Vector3(
            startPoint.x + distance * Math.cos(snappedAngleRad),
            startPoint.y + distance * Math.sin(snappedAngleRad),
            currentPoint.z
        );
        
        return snappedPoint;
    }
    
    showLineSnapGuides(startPoint, endPoint) {
        const mainAngles = [0, 45, 90, 135, 180, 225, 270, 315];
        const guideLength = 50;
        
        mainAngles.forEach(angle => {
            const angleRad = angle * Math.PI / 180;
            const guideEnd = new THREE.Vector3(
                startPoint.x + guideLength * Math.cos(angleRad),
                startPoint.y + guideLength * Math.sin(angleRad),
                startPoint.z
            );
            
            const points = [startPoint, guideEnd];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            // Utiliser LineDashedMaterial pour des lignes en pointillés
            const material = new THREE.LineDashedMaterial({ 
                color: 0x606060,  // Couleur plus claire
                linewidth: 1,
                scale: 1,
                dashSize: 2,      // Taille des traits
                gapSize: 4,       // Taille des espaces
                opacity: 0.2,     // Plus transparent
                transparent: true,
                depthTest: false,
                depthWrite: false
            });
            
            const guideLine = new THREE.Line(geometry, material);
            guideLine.computeLineDistances(); // Nécessaire pour les lignes en pointillés
            guideLine.renderOrder = 998;
            
            this.app.scene.add(guideLine);
            this.snapHelpers.push(guideLine);
        });
    }
    
    updateLineInfo(startPoint, endPoint) {
        const distance = startPoint.distanceTo(endPoint);
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const normalizedAngle = ((angle % 360) + 360) % 360;
        
        const coordsElement = document.getElementById('coordinates');
        coordsElement.innerHTML = 
            `<span style="color: #ff0000;">Rouge: ${endPoint.x.toFixed(2)} cm</span>, ` +
            `<span style="color: #00ff00;">Vert: ${endPoint.y.toFixed(2)} cm</span>, ` +
            `<span style="color: #0000ff;">Bleu: ${endPoint.z.toFixed(2)} cm</span> | ` +
            `Dist: ${distance.toFixed(2)} cm | Angle: ${normalizedAngle.toFixed(1)}°`;
    }
    
    clearSnapHelpers() {
        this.snapHelpers.forEach(helper => {
            this.app.scene.remove(helper);
            if (helper.geometry) helper.geometry.dispose();
            if (helper.material) helper.material.dispose();
        });
        this.snapHelpers = [];
    }
    
    cancelDrawing() {
        if (this.app.currentTool === 'line' && this.lineTool.active) {
            this.lineTool.cancel();
        } else if (this.app.currentTool === 'rect' && this.rectangleTool.active) {
            this.rectangleTool.cancel();
        } else if (this.app.currentTool === 'circle' && this.circleTool.active) {
            this.circleTool.cancel();
        } else if (this.app.currentTool === 'parallel' && this.parallelTool.active) {
            this.parallelTool.cancel();
        } else if (this.app.currentTool === 'trim' && this.trimTool.active) {
            this.trimTool.cancel();
        } else if (this.app.currentTool === 'extend' && this.extendTool.active) {
            this.extendTool.cancel();
        } else if (this.app.currentTool === 'hatch' && this.hatchTool.active) {
            this.hatchTool.cancel();
        } else if (this.isDrawing) { // For tools like polyline still using this.isDrawing
            if (this.drawingMode === 'polyline' && this.drawingPoints.length >= 0) { // Allow cancel even with 0 points for polyline
                this.hideContextMenu();
            }
            this.endDrawing(); // Generic cleanup
        }
         // Ensure current tool is reset to select if a tool specific cancel doesn't do it.
        if (this.app.toolManager && this.app.currentTool !== 'select' &&
            !['line', 'rect', 'circle', 'parallel', 'trim', 'extend', 'hatch'].includes(this.app.currentTool)) {
            // If it's a mode like polyline that was cancelled by Esc via WebCAD.js
            this.app.toolManager.setTool('select');
        } else if (!this.lineTool.active && !this.rectangleTool.active && !this.circleTool.active &&
                   !this.parallelTool.active && !this.trimTool.active && !this.extendTool.active && !this.hatchTool.active &&
                   !this.isDrawing) { // If all tools are inactive and not in polyline drawing mode
             if (this.app.toolManager && this.app.currentTool !== 'select') {
                this.app.toolManager.setTool('select');
             }
        }
    }
    
    endDrawing() { // This is now more for polyline or generic cases
        this.isDrawing = false;
        // this.drawingMode = null; // Keep drawingMode for context if needed, or clear it
        this.drawingPoints = [];
        
        if (this.tempObject) {
            this.app.scene.remove(this.tempObject);
            if (this.tempObject.geometry) this.tempObject.geometry.dispose();
            if (this.tempObject.material) this.tempObject.material.dispose();
            this.tempObject = null;
        }
        
        this.clearSnapHelpers();
        this.app.snapManager.hideTooltip();
        this.app.controls.enabled = true;
        this.hideContextMenu();
        
        document.getElementById('command-output').textContent = '';
    }
    
    updatePolyline() {
        // Mettre à jour la polyligne temporaire
    }
    
    handleKeyboard(event) {
        // Gestion des raccourcis pour les outils parallèles
        if (this.app.currentTool === 'parallel' && this.parallelTool) {
            if (event.key === '+' || event.key === '=') {
                event.preventDefault();
                this.parallelTool.adjustOffset(1);
                document.getElementById('command-output').textContent = 
                    `Distance: ${this.parallelTool.offset.toFixed(1)}cm (+ pour augmenter, - pour diminuer)`;
            } else if (event.key === '-' || event.key === '_') {
                event.preventDefault();
                this.parallelTool.adjustOffset(-1);
                document.getElementById('command-output').textContent = 
                    `Distance: ${this.parallelTool.offset.toFixed(1)}cm (+ pour augmenter, - pour diminuer)`;
            } else if (event.key === 'Escape') {
                this.parallelTool.cancel();
            }
        }
        
        // Gestion de l'outil trim
        if (this.app.currentTool === 'trim' && this.trimTool) {
            if (event.key === 'Escape') {
                this.trimTool.cancel();
            }
        }
        
        // Gestion de l'outil extend
        if (this.app.currentTool === 'extend' && this.extendTool) {
            if (event.key === 'Enter' && !this.extendTool.boundaryLine && !this.extendTool.skipBoundary) {
                this.extendTool.skipBoundarySelection();
            } else if (event.key === 'Escape') {
                this.extendTool.cancel();
            }
        }
        
        if (event.key === 'Shift') {
            this.shiftPressed = true;
            if (this.isDrawing && this.drawingMode === 'line') {
                document.getElementById('command-output').textContent = 'Accrochage angulaire désactivé temporairement';
            }
        } else if (event.key === 'Enter' && this.isDrawing) {
            if (this.drawingMode === 'polyline') {
                this.finishPolyline();
            }
        }
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.shiftPressed = false;
                if (this.isDrawing && this.drawingMode === 'line') {
                    document.getElementById('command-output').textContent = 'Cliquez pour le second point de la ligne (Shift pour désactiver l\'accrochage)';
                }
            }
        });
    }
    
    createArcGeometry(startPoint, middlePoint, endPoint) {
        try {
            // Calculer le centre et le rayon de l'arc passant par 3 points
            const center = this.calculateCircleCenter(startPoint, middlePoint, endPoint);
            if (!center) return null;
            
            const radius = center.distanceTo(startPoint);
            
            // Calculer les angles de début et de fin
            const startAngle = Math.atan2(startPoint.y - center.y, startPoint.x - center.x);
            const endAngle = Math.atan2(endPoint.y - center.y, endPoint.x - center.x);
            
            // Créer les points de l'arc
            const points = [];
            const segments = 32;
            let angle = startAngle;
            let angleDiff = endAngle - startAngle;
            
            // Normaliser la différence d'angle
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Vérifier le sens de rotation basé sur le point du milieu
            const midAngle = Math.atan2(middlePoint.y - center.y, middlePoint.x - center.x);
            let midAngleDiff = midAngle - startAngle;
            if (midAngleDiff > Math.PI) midAngleDiff -= 2 * Math.PI;
            if (midAngleDiff < -Math.PI) midAngleDiff += 2 * Math.PI;
            
            if ((angleDiff > 0 && midAngleDiff < 0) || (angleDiff < 0 && midAngleDiff > 0)) {
                angleDiff = angleDiff > 0 ? angleDiff - 2 * Math.PI : angleDiff + 2 * Math.PI;
            }
            
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const currentAngle = startAngle + angleDiff * t;
                const x = center.x + radius * Math.cos(currentAngle);
                const y = center.y + radius * Math.sin(currentAngle);
                points.push(new THREE.Vector3(x, y, startPoint.z));
            }
            
            return new THREE.BufferGeometry().setFromPoints(points);
        } catch (error) {
            console.warn('Erreur lors de la création de l\'arc:', error);
            return null;
        }
    }
    
    calculateCircleCenter(p1, p2, p3) {
        // Calculer le centre du cercle passant par 3 points
        const ax = p1.x, ay = p1.y;
        const bx = p2.x, by = p2.y;
        const cx = p3.x, cy = p3.y;
        
        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 0.0001) return null; // Points colinéaires
        
        const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
        const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
        
        return new THREE.Vector3(ux, uy, p1.z);
    }
    
    finishArc() {
        if (this.drawingPoints.length >= 3) {
            const arcGeometry = this.createArcGeometry(this.drawingPoints[0], this.drawingPoints[1], this.drawingPoints[2]);
            if (arcGeometry) {
                const material = new THREE.LineBasicMaterial({ 
                    color: 0x000000,
                    linewidth: 2,
                    opacity: 1,
                    transparent: false,
                    depthTest: true,
                    depthWrite: true
                });
                const arc = new THREE.Line(arcGeometry, material);
                arc.renderOrder = 10;
                arc.updateMatrix();
                arc.matrixAutoUpdate = true;
                
                this.app.scene.add(arc);
                this.app.objects.push(arc);
                this.app.layers[this.app.currentLayer].objects.push(arc);
                this.app.addToHistory('create', arc);
                this.app.uiManager.updateHistoryPanel();
            }
        }
        
        this.endDrawing();
    }
    
    checkForClosedShapeAndCreateSurface(newLine) {
        const tolerance = 0.1; // Tolérance pour considérer deux points comme identiques
        
        // Si c'est une polyligne fermée (premier et dernier point identiques)
        if (newLine.geometry.attributes.position.count >= 4) {
            const positions = newLine.geometry.attributes.position;
            const firstPoint = new THREE.Vector3(
                positions.getX(0),
                positions.getY(0),
                positions.getZ(0)
            );
            const lastPoint = new THREE.Vector3(
                positions.getX(positions.count - 1),
                positions.getY(positions.count - 1),
                positions.getZ(positions.count - 1)
            );
            
            if (firstPoint.distanceTo(lastPoint) < tolerance) {
                // C'est une forme fermée, créer une surface
                const points = [];
                for (let i = 0; i < positions.count - 1; i++) { // Exclure le dernier point dupliqué
                    points.push(new THREE.Vector3(
                        positions.getX(i),
                        positions.getY(i),
                        positions.getZ(i)
                    ));
                }
                this.createSurfaceFromPoints(points);
                return;
            }
        }
        
        // Sinon, vérifier les lignes connectées
        const connectedLines = this.findConnectedLines(newLine, tolerance);
        if (connectedLines.length >= 3) {
            const closedPath = this.buildClosedPath(connectedLines, tolerance);
            if (closedPath && closedPath.length >= 3) {
                this.createSurfaceFromPoints(closedPath);
            }
        }
    }
    
    createSurfaceFromPoints(points) {
        if (points.length < 3) return;
        
        try {
            // Vérifier que tous les points sont approximativement sur le même plan Z
            const avgZ = points.reduce((sum, p) => sum + p.z, 0) / points.length;
            const isFlat = points.every(p => Math.abs(p.z - avgZ) < 0.1);
            
            if (!isFlat) {
                console.warn('Les points ne forment pas une surface plane');
                return;
            }
            
            // Créer une forme 2D à partir du chemin
            const shape = new THREE.Shape();
            
            // Déplacer au premier point
            shape.moveTo(points[0].x, points[0].y);
            
            // Tracer les lignes vers les autres points
            for (let i = 1; i < points.length; i++) {
                shape.lineTo(points[i].x, points[i].y);
            }
            
            // Fermer la forme
            shape.closePath();
            
            // Créer la géométrie de la surface
            const geometry = new THREE.ShapeGeometry(shape);
            // Utiliser MeshPhongMaterial pour supporter les ombres
            const material = new THREE.MeshPhongMaterial({ 
                color: 0xcccccc,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                depthTest: true,
                depthWrite: true
            });
            
            const surface = new THREE.Mesh(geometry, material);
            surface.position.set(0, 0, avgZ + 0.01);
            surface.renderOrder = 5;
            surface.castShadow = true;
            surface.receiveShadow = true;
            
            // Ajouter des contours noirs pour la surface
            const edges = new THREE.EdgesGeometry(geometry);
            const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
                color: 0x000000,
                linewidth: 1,
                opacity: 0.8,
                transparent: true
            }));
            surface.add(edgeLines);
            
            surface.userData = {
                type: 'surface',
                createdFrom: 'closedShape',
                pointCount: points.length,
                originalPoints: points.map(p => p.clone()) // Sauvegarder les points originaux
            };
            
            this.app.scene.add(surface);
            this.app.objects.push(surface);
            this.app.layers[this.app.currentLayer].objects.push(surface);
            
            // Ajouter à l'historique après création
            this.app.addToHistory('create', surface);
            
            if (this.app.uiManager) {
                this.app.uiManager.updateHistoryPanel();
            }
            
            document.getElementById('command-output').textContent = `Surface créée à partir de ${points.length} points (peut être extrudée)`;
        } catch (error) {
            console.warn('Impossible de créer une surface à partir du chemin:', error);
            document.getElementById('command-output').textContent = 'Impossible de créer une surface à partir de ces points';
        }
    }
}
