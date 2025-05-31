import * as THREE from 'three';
import { LineTool } from '../tools/LineTool.js';
import { ParallelTool } from '../tools/ParallelTool.js';
import { TrimTool } from '../tools/TrimTool.js';
import { ExtendTool } from '../tools/ExtendTool.js';
import { HatchTool } from '../tools/HatchTool.js';
import { RectangleTool } from '../tools/RectangleTool.js';
import { CircleTool } from '../tools/CircleTool.js';
import { SurfaceTool } from '../tools/SurfaceTool.js'; // Import SurfaceTool

export class DrawingManager {
    constructor(app) {
        this.app = app;
        this.isDrawing = false;
        this.drawingPoints = [];
        this.tempObject = null;
        this.drawingMode = null;
        this.snapHelpers = [];
        this.angleSnap = true;
        this.angleSnapIncrement = 5;
        this.showSnapGuides = true;
        this.shiftPressed = false;
        this.contextMenu = null;
        this.polylineTooltip = null; // Nouvelle propriété pour l'infobulle
        this.polylineArcMode = false; // Nouvelle propriété pour le mode arc
        
        // Créer les outils
        this.lineTool = new LineTool(app);
        this.parallelTool = new ParallelTool(app);
        this.trimTool = new TrimTool(app);
        this.extendTool = new ExtendTool(app);
        this.hatchTool = new HatchTool(app);
        this.rectangleTool = new RectangleTool(app); // Instantiate RectangleTool
        this.circleTool = new CircleTool(app);       // Instantiate CircleTool
        this.surfaceTool = new SurfaceTool(app);     // Instantiate SurfaceTool
        
        this.createContextMenu();
        this.createPolylineTooltip();
    }
    
    createContextMenu() {
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'polyline-context-menu';
        this.contextMenu.style.display = 'none';
        this.contextMenu.innerHTML = `
            <div class="context-menu-item" id="undo-point">
                <i class="fas fa-undo"></i> Annuler le point précédent
            </div>
            <div class="context-menu-item" id="arc-mode">
                <i class="fas fa-bezier-curve"></i> Mode Arc
            </div>
            <div class="context-menu-item" id="close-polyline">
                <i class="fas fa-check-circle"></i> Fermer la polyligne
            </div>
            <div class="context-menu-item" id="finish-polyline">
                <i class="fas fa-stop"></i> Fin
            </div>
            <div class="context-menu-item" id="cancel-polyline">
                <i class="fas fa-times"></i> Annuler
            </div>
        `;
        document.body.appendChild(this.contextMenu);
        
        // Gestionnaires d'événements
        document.getElementById('undo-point').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideContextMenu();
            this.undoLastPoint();
        });
        
        document.getElementById('arc-mode').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideContextMenu();
            this.togglePolylineArcMode();
        });
        
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
    
    createPolylineTooltip() {
        this.polylineTooltip = document.createElement('div');
        this.polylineTooltip.id = 'polyline-tooltip';
        this.polylineTooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-family: Arial, sans-serif;
            pointer-events: none;
            z-index: 1000;
            display: none;
            white-space: nowrap;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(this.polylineTooltip);
    }
    
    exitPolylineMode() {
        // Retourner à l'outil de sélection
        this.app.toolManager.setTool('select');
        document.getElementById('command-output').textContent = 'Polyligne terminée';
    }
    
    showContextMenu(x, y) {
        if (this.isDrawing && this.drawingMode === 'polyline' && this.drawingPoints.length >= 1) {
            // Activer/désactiver l'option "Annuler le point précédent" selon le nombre de points
            const undoPointItem = document.getElementById('undo-point');
            if (this.drawingPoints.length <= 1) {
                undoPointItem.style.opacity = '0.5';
                undoPointItem.style.pointerEvents = 'none';
            } else {
                undoPointItem.style.opacity = '1';
                undoPointItem.style.pointerEvents = 'auto';
            }
            
            // Activer/désactiver l'option "Fermer la polyligne" selon le nombre de points
            const closePolylineItem = document.getElementById('close-polyline');
            if (this.drawingPoints.length < 3) {
                closePolylineItem.style.opacity = '0.5';
                closePolylineItem.style.pointerEvents = 'none';
            } else {
                closePolylineItem.style.opacity = '1';
                closePolylineItem.style.pointerEvents = 'auto';
            }
            
            // Mettre à jour le texte du mode arc
            const arcModeItem = document.getElementById('arc-mode');
            if (this.polylineArcMode) {
                arcModeItem.innerHTML = '<i class="fas fa-minus"></i> Mode Ligne';
            } else {
                arcModeItem.innerHTML = '<i class="fas fa-bezier-curve"></i> Mode Arc';
            }
            
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
    
    undoLastPoint() {
        if (this.isDrawing && this.drawingMode === 'polyline' && this.drawingPoints.length > 1) {
            // Nettoyer d'abord les objets temporaires de preview
            if (this.tempObject) {
                this.app.scene.remove(this.tempObject);
                if (this.tempObject.geometry) this.tempObject.geometry.dispose();
                if (this.tempObject.material) this.tempObject.material.dispose();
                this.tempObject = null;
            }
            
            // Vérifier si on doit annuler un arc entier
            let pointsToRemove = 1;
            let segmentsToRemove = 1;
            
            // Vérifier si le dernier segment ajouté était un arc
            // On peut le détecter en vérifiant si plusieurs segments consécutifs ont été ajoutés d'un coup
            if (this.lastArcSegmentCount && this.lastArcSegmentCount > 1) {
                // C'était un arc, on doit retirer tous les points de l'arc
                pointsToRemove = this.lastArcSegmentCount;
                segmentsToRemove = this.lastArcSegmentCount - 1; // Un arc de N points a N-1 segments
            }
            
            // Supprimer les segments de ligne correspondants
            const segmentsRemoved = this.removeLastPolylineSegments(segmentsToRemove);
            
            // Ajuster le nombre de points à retirer si nécessaire
            if (segmentsRemoved < segmentsToRemove && this.lastArcSegmentCount) {
                // Si on n'a pas pu supprimer tous les segments attendus, ajuster
                pointsToRemove = segmentsRemoved + 1;
            }
            
            // Retirer les points correspondants
            for (let i = 0; i < pointsToRemove; i++) {
                if (this.drawingPoints.length > 1) {
                    this.drawingPoints.pop();
                }
            }
            
            // Réinitialiser le compteur d'arc
            this.lastArcSegmentCount = null;
            
            // Nettoyer les guides d'accrochage
            this.clearSnapHelpers();
            
            // Forcer un rendu pour s'assurer que tous les changements sont visibles
            this.app.renderer.render(this.app.scene, this.app.camera);
            
            // Mettre à jour l'affichage pour continuer le dessin
            const totalDistance = this.calculatePolylineDistance(this.drawingPoints);
            const cmdOutput = document.getElementById('command-output');
            if (this.drawingPoints.length === 1) {
                cmdOutput.textContent = 'Cliquez pour le point suivant (clic droit pour options)';
            } else {
                cmdOutput.textContent = `Distance totale: ${totalDistance.toFixed(2)} cm - Cliquez pour le point suivant (clic droit pour options)`;
            }
            
            console.log(`Points annulés: ${pointsToRemove}. Points restants: ${this.drawingPoints.length}. Continuation du dessin.`);
        }
    }

    removeLastPolylineSegments(count) {
        let removed = 0;
        const pointsToCheck = Math.min(count + 1, this.drawingPoints.length);
        
        // Créer une liste des segments à supprimer en vérifiant les connexions avec les derniers points
        const segmentsToRemove = [];
        
        for (let i = this.app.objects.length - 1; i >= 0 && removed < count; i--) {
            const obj = this.app.objects[i];
            if (obj instanceof THREE.Line && 
                obj.geometry && 
                obj.geometry.attributes.position &&
                obj.geometry.attributes.position.count === 2 &&
                obj.material instanceof THREE.LineBasicMaterial &&
                obj !== this.tempObject) {
                
                const positions = obj.geometry.attributes.position;
                const segmentStart = new THREE.Vector3(
                    positions.getX(0),
                    positions.getY(0),
                    positions.getZ(0)
                );
                const segmentEnd = new THREE.Vector3(
                    positions.getX(1),
                    positions.getY(1),
                    positions.getZ(1)
                );
                
                // Vérifier si ce segment fait partie des derniers segments de la polyligne
                for (let j = this.drawingPoints.length - 1; j >= Math.max(0, this.drawingPoints.length - pointsToCheck); j--) {
                    if (j > 0) {
                        const point1 = this.drawingPoints[j - 1];
                        const point2 = this.drawingPoints[j];
                        
                        if ((segmentStart.distanceTo(point1) < 0.01 && segmentEnd.distanceTo(point2) < 0.01) ||
                            (segmentStart.distanceTo(point2) < 0.01 && segmentEnd.distanceTo(point1) < 0.01)) {
                            segmentsToRemove.push({index: i, object: obj});
                            removed++;
                            break;
                        }
                    }
                }
            }
        }
        
        // Supprimer les segments trouvés
        // Trier par index décroissant pour éviter les problèmes d'index lors de la suppression
        segmentsToRemove.sort((a, b) => b.index - a.index);
        
        for (const segment of segmentsToRemove) {
            // Retirer de la scène
            this.app.scene.remove(segment.object);
            
            // Retirer des objets
            this.app.objects.splice(segment.index, 1);
            
            // Retirer du layer
            const layerObjects = this.app.layers[this.app.currentLayer].objects;
            const layerIndex = layerObjects.indexOf(segment.object);
            if (layerIndex !== -1) {
                layerObjects.splice(layerIndex, 1);
            }
            
            // Ajouter à l'historique
            this.app.addToHistory('delete', segment.object);
            
            // Nettoyer la géométrie
            if (segment.object.geometry) segment.object.geometry.dispose();
            if (segment.object.material) segment.object.material.dispose();
        }
        
        return removed;
    }
    
    findLastPolylineSegment() {
        // Chercher le dernier segment de polyligne créé (ligne solide, pas en pointillés)
        // Il faut chercher spécifiquement le segment qui se termine par le dernier point de la polyligne
        if (this.drawingPoints.length < 2) return -1;
        
        const currentLastPoint = this.drawingPoints[this.drawingPoints.length - 1];
        const currentSecondLastPoint = this.drawingPoints[this.drawingPoints.length - 2];
        
        for (let i = this.app.objects.length - 1; i >= 0; i--) {
            const obj = this.app.objects[i];
            if (obj instanceof THREE.Line && 
                obj.geometry && 
                obj.geometry.attributes.position &&
                obj.geometry.attributes.position.count === 2 &&
                obj.material instanceof THREE.LineBasicMaterial && // Ligne solide, pas en pointillés
                obj !== this.tempObject) { // S'assurer que ce n'est pas l'objet temporaire
                
                const positions = obj.geometry.attributes.position;
                const segmentStart = new THREE.Vector3(
                    positions.getX(0),
                    positions.getY(0),
                    positions.getZ(0)
                );
                const segmentEnd = new THREE.Vector3(
                    positions.getX(1),
                    positions.getY(1),
                    positions.getZ(1)
                );
                
                // Vérifier si ce segment correspond exactement au dernier segment de la polyligne
                // (du avant-dernier point vers le dernier point)
                if ((segmentStart.distanceTo(currentSecondLastPoint) < 0.01 && 
                     segmentEnd.distanceTo(currentLastPoint) < 0.01) ||
                    (segmentStart.distanceTo(currentLastPoint) < 0.01 && 
                     segmentEnd.distanceTo(currentSecondLastPoint) < 0.01)) {
                    return i;
                }
            }
        }
        return -1;
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
    
    showPolylineTooltip(x, y, distance, segmentDistance = null, angle = null, relativeAngle = null, radius = null) {
        if (!this.polylineTooltip) return;
        
        let content = `Distance totale: ${distance.toFixed(2)} cm`;
        if (segmentDistance !== null) {
            content += `<br>Segment: ${segmentDistance.toFixed(2)} cm`;
        }
        if (angle !== null) {
            content += `<br>Angle: ${angle.toFixed(1)}°`;
        }
        if (relativeAngle !== null) {
            content += `<br>Angle relatif: ${relativeAngle.toFixed(1)}°`;
        }
        if (radius !== null) {
            content += `<br>Rayon: ${radius.toFixed(2)} cm`;
        }
        
        this.polylineTooltip.innerHTML = content;
        this.polylineTooltip.style.left = `${x + 15}px`;
        this.polylineTooltip.style.top = `${y - 10}px`;
        this.polylineTooltip.style.display = 'block';
    }
    
    hidePolylineTooltip() {
        if (this.polylineTooltip) {
            this.polylineTooltip.style.display = 'none';
        }
    }
    
    calculatePolylineDistance(points, includePreviewPoint = null) {
        if (points.length < 2) return 0;
        
        let totalDistance = 0;
        const allPoints = includePreviewPoint ? [...points, includePreviewPoint] : points;
        
        for (let i = 0; i < allPoints.length - 1; i++) {
            totalDistance += allPoints[i].distanceTo(allPoints[i + 1]);
        }
        
        return totalDistance;
    }
    
    handleDrawing(point) {
        const cmdOutput = document.getElementById('command-output');
        let adjustedPoint = point;

        // Guard against invalid point input
        if (!adjustedPoint || typeof adjustedPoint.x === 'undefined' || typeof adjustedPoint.y === 'undefined' || typeof adjustedPoint.z === 'undefined') {
            console.warn('DrawingManager.handleDrawing: Received invalid point.', adjustedPoint);
            return;
        }
        
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
                
            case 'surface': // Add surface tool case
                this.surfaceTool.handleClick(adjustedPoint);
                break;
                
            case 'polyline':
                if (!this.isDrawing || this.drawingMode !== 'polyline') {
                    this.startDrawing('polyline');
                    this.polylineArcMode = false; // Réinitialiser le mode arc
                    this.polylineArcPoints = [];
                }

                if (this.polylineArcMode) {
                    // Mode arc de la polyligne
                    if (!this.polylineArcPoints) {
                        this.polylineArcPoints = [];
                    }
                    
                    // Si c'est le premier point de l'arc et qu'on a déjà des points dans la polyligne
                    if (this.polylineArcPoints.length === 0 && this.drawingPoints.length > 0) {
                        // Utiliser le dernier point de la polyligne comme point de départ
                        this.polylineArcPoints.push(this.drawingPoints[this.drawingPoints.length - 1].clone());
                        this.polylineArcPoints.push(adjustedPoint);
                        cmdOutput.textContent = 'Arc: Déplacez la souris pour ajuster le rayon et cliquez pour valider';
                    } else if (this.polylineArcPoints.length === 0) {
                        // Pas de points dans la polyligne, utiliser le point cliqué comme départ
                        this.polylineArcPoints.push(adjustedPoint);
                        cmdOutput.textContent = 'Arc: Cliquez pour le point final de l\'arc';
                    } else if (this.polylineArcPoints.length === 1) {
                        this.polylineArcPoints.push(adjustedPoint);
                        cmdOutput.textContent = 'Arc: Déplacez la souris pour ajuster le rayon et cliquez pour valider';
                    } else if (this.polylineArcPoints.length === 2) {
                        // Créer l'arc avec le point de passage basé sur la position de la souris
                        const startPoint = this.polylineArcPoints[0];
                        const endPoint = this.polylineArcPoints[1];
                        const middlePoint = this.calculateArcMiddlePoint(startPoint, endPoint, adjustedPoint);
                        
                        const arcGeometry = this.createArcGeometry(startPoint, middlePoint, endPoint);
                        
                        if (arcGeometry) {
                            // Extraire les points de l'arc
                            const positions = arcGeometry.attributes.position;
                            let startIndex = 0;
                            let arcPointCount = 0;
                            
                            // Si on a déjà des points et que le premier point de l'arc est le même que le dernier de la polyligne
                            if (this.drawingPoints.length > 0) {
                                const lastPolyPoint = this.drawingPoints[this.drawingPoints.length - 1];
                                const firstArcPoint = new THREE.Vector3(
                                    positions.getX(0),
                                    positions.getY(0),
                                    positions.getZ(0)
                                );
                                if (lastPolyPoint.distanceTo(firstArcPoint) < 0.01) {
                                    startIndex = 1; // Skip le premier point pour éviter le doublon
                                }
                            }
                            
                            // Ajouter les points de l'arc à la polyligne
                            for (let i = startIndex; i < positions.count; i++) {
                                const point = new THREE.Vector3(
                                    positions.getX(i),
                                    positions.getY(i),
                                    positions.getZ(i)
                                );
                                this.drawingPoints.push(point);
                                arcPointCount++;
                            }
                            
                            // Mémoriser le nombre de points ajoutés pour cet arc
                            this.lastArcSegmentCount = arcPointCount;
                            
                            // Créer les segments de ligne pour l'arc
                            const segmentStartIndex = this.drawingPoints.length - arcPointCount;
                            for (let i = segmentStartIndex; i < this.drawingPoints.length - 1; i++) {
                                const p1 = this.drawingPoints[i];
                                const p2 = this.drawingPoints[i + 1];
                                
                                const segmentGeometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
                                const material = new THREE.LineBasicMaterial({
                                    color: 0x000000,
                                    linewidth: 3,
                                    transparent: false
                                });
                                const segment = new THREE.Line(segmentGeometry, material);
                                segment.renderOrder = 10;
                                this.app.scene.add(segment);
                                this.app.objects.push(segment);
                                this.app.layers[this.app.currentLayer].objects.push(segment);
                                this.app.addToHistory('create', segment);
                            }
                        }
                        
                        // Réinitialiser pour le prochain arc ou ligne
                        this.polylineArcPoints = [];
                        this.polylineArcMode = false; // Revenir au mode ligne par défaut
                        
                        const totalDistance = this.calculatePolylineDistance(this.drawingPoints);
                        cmdOutput.textContent = `Distance totale: ${totalDistance.toFixed(2)} cm - Mode LIGNE - Cliquez pour le point suivant`;
                    }
                } else {
                    // Mode ligne normal de la polyligne (code existant)
                    if (this.drawingPoints.length === 0) {
                        this.drawingPoints.push(adjustedPoint);
                        cmdOutput.textContent = 'Cliquez pour le point suivant (clic droit pour options)';
                    } else {
                        const lastPoint = this.drawingPoints[this.drawingPoints.length - 1];
                        let finalSegmentPoint = adjustedPoint; // Default to the point from SnapManager

                        const snapToCloseDistance = 0.5; // Tolerance for snapping to the start point to close the polyline

                        // Check if SnapManager found an intersection or high-priority snap
                        const isHighPrioritySnap = this.app.snapManager.currentSnapType === 'Intersection' || 
                                                 this.app.snapManager.currentSnapType?.includes('Point') ||
                                                 this.app.snapManager.currentSnapType === 'Extrémité';

                        // Prioritize snapping to the start point for closing
                        if (this.drawingPoints.length >= 2 && adjustedPoint.distanceTo(this.drawingPoints[0]) < snapToCloseDistance) {
                            finalSegmentPoint = this.drawingPoints[0].clone();
                        } else if (isHighPrioritySnap) {
                            // If SnapManager found a high-priority snap (intersection, endpoint, etc.), use it directly
                            finalSegmentPoint = adjustedPoint;
                        } else if (this.angleSnap && !this.shiftPressed) {
                            // Apply angle snapping only if no high-priority snap was found
                            finalSegmentPoint = this.snapToAngleIncrement(lastPoint, adjustedPoint, this.angleSnapIncrement);
                        }
                        // Else, finalSegmentPoint remains adjustedPoint (from SnapManager, possibly grid-snapped)
                        
                        this.drawingPoints.push(finalSegmentPoint);
                        
                        // Réinitialiser le compteur d'arc car c'est un segment simple
                        this.lastArcSegmentCount = null;

                        // Créer une ligne continue pour le segment confirmé
                        const geometry = new THREE.BufferGeometry().setFromPoints([lastPoint, finalSegmentPoint]);
                        const material = new THREE.LineBasicMaterial({
                            color: 0x000000, // Noir
                            linewidth: 3,    // Épais
                            transparent: false
                        });
                        const confirmedLine = new THREE.Line(geometry, material);
                        confirmedLine.renderOrder = 10;
                        this.app.scene.add(confirmedLine);

                        // Ajouter la ligne confirmée à l'historique
                        this.app.objects.push(confirmedLine);
                        this.app.layers[this.app.currentLayer].objects.push(confirmedLine);
                        this.app.addToHistory('create', confirmedLine);

                        // Mettre à jour l'interface utilisateur
                        const totalDistance = this.calculatePolylineDistance(this.drawingPoints);
                        cmdOutput.textContent = `Distance totale: ${totalDistance.toFixed(2)} cm - Cliquez pour le point suivant (clic droit pour options)`;
                    }
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
        this.surfaceTool.deactivate(); // Add surface tool deactivation

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
        } else if (mode === 'surface') { // Add surface tool activation
            this.surfaceTool.activate();
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
        
        // Nettoyer l'objet temporaire précédent
        if (this.tempObject) {
            this.app.scene.remove(this.tempObject);
            if (this.tempObject.geometry) this.tempObject.geometry.dispose();
            if (this.tempObject.material) this.tempObject.material.dispose();
            this.tempObject = null;
        }
        this.clearSnapHelpers();

        // Ajouter une aide visuelle des axes pour les polylignes
        if (this.drawingMode === 'polyline' && this.isDrawing && this.drawingPoints.length > 0) {
            const startPoint = this.drawingPoints[this.drawingPoints.length - 1];
            this.showLineSnapGuides(startPoint, currentPoint);
        }
        
        // Pour la polyligne, utiliser le point d'accrochage s'il est disponible
        let previewPoint = currentPoint; // currentPoint is already snapped by SnapManager

        if (this.drawingMode === 'polyline' && this.isDrawing && this.drawingPoints.length > 0) {
            const startPoint = this.drawingPoints[this.drawingPoints.length - 1];
            const snapToCloseDistance = 0.5; // Tolerance for snapping to the start point

            // Check if SnapManager found an intersection or high-priority snap
            const isHighPrioritySnap = this.app.snapManager.currentSnapType === 'Intersection' || 
                                     this.app.snapManager.currentSnapType?.includes('Point') ||
                                     this.app.snapManager.currentSnapType === 'Extrémité';

            // Prioritize snapping to the start point for closing in preview
            if (this.drawingPoints.length >= 2 && currentPoint.distanceTo(this.drawingPoints[0]) < snapToCloseDistance) {
                previewPoint = this.drawingPoints[0].clone();
            } else if (isHighPrioritySnap) {
                // If SnapManager found a high-priority snap (intersection, endpoint, etc.), use it directly
                previewPoint = currentPoint;
            } else if (this.angleSnap && !this.shiftPressed) {
                // Apply angle snapping only if no high-priority snap was found
                previewPoint = this.snapToAngleIncrement(startPoint, currentPoint, this.angleSnapIncrement);
            }
            // Else, previewPoint remains currentPoint (from SnapManager, possibly grid-snapped)

            this.showLineSnapGuides(startPoint, previewPoint);

            // Calculate distances and angles
            const totalDistance = this.calculatePolylineDistance(this.drawingPoints, previewPoint);
            const segmentDistance = this.drawingPoints.length > 0
                ? this.drawingPoints[this.drawingPoints.length - 1].distanceTo(previewPoint)
                : 0;

            const dx = previewPoint.x - startPoint.x;
            const dy = previewPoint.y - startPoint.y;
            const angleFromRedAxis = Math.atan2(dy, dx) * (180 / Math.PI);
            const normalizedAngle = ((angleFromRedAxis % 360) + 360) % 360;

            let relativeAngle = null;
            if (this.drawingPoints.length > 1) {
                const previousPoint = this.drawingPoints[this.drawingPoints.length - 2];
                const prevDx = startPoint.x - previousPoint.x;
                const prevDy = startPoint.y - previousPoint.y;
                const prevAngle = Math.atan2(prevDy, prevDx) * (180 / Math.PI);
                const prevNormalizedAngle = ((prevAngle % 360) + 360) % 360;
                
                // Calculate the relative angle between current segment and previous segment
                relativeAngle = normalizedAngle - prevNormalizedAngle;
                
                // Normalize to -180 to 180 range
                if (relativeAngle > 180) relativeAngle -= 360;
                if (relativeAngle < -180) relativeAngle += 360;
            }

            // Show tooltip with both angles
            if (event) {
                this.showPolylineTooltip(event.clientX, event.clientY, totalDistance, segmentDistance, normalizedAngle, relativeAngle);
            }
        }
        
        switch (this.drawingMode) {
            case 'polyline':
                if (this.polylineArcMode && this.polylineArcPoints && this.polylineArcPoints.length > 0) {
                    // Preview pour le mode arc
                    if (this.polylineArcPoints.length === 1) {
                        // Ligne du point de départ vers la souris
                        const points = [this.polylineArcPoints[0], currentPoint];
                        const geometry = new THREE.BufferGeometry().setFromPoints(points);
                        const material = new THREE.LineDashedMaterial({ 
                            color: 0xff0000, // Rouge pour indiquer le mode arc
                            linewidth: 2,
                            scale: 1,
                            dashSize: 0.3,
                            gapSize: 0.3,
                            opacity: 0.7,
                            transparent: true
                        });
                        this.tempObject = new THREE.Line(geometry, material);
                        this.tempObject.computeLineDistances();
                        this.tempObject.renderOrder = 999;
                        this.app.scene.add(this.tempObject);
                    } else if (this.polylineArcPoints.length === 2) {
                        // Preview de l'arc avec ajustement du rayon
                        const startPoint = this.polylineArcPoints[0];
                        const endPoint = this.polylineArcPoints[1];
                        const middlePoint = this.calculateArcMiddlePoint(startPoint, endPoint, currentPoint);
                        
                        const arcGeometry = this.createArcGeometry(startPoint, middlePoint, endPoint);
                        if (arcGeometry) {
                            const material = new THREE.LineDashedMaterial({ 
                                color: 0xff0000, // Rouge pour le mode arc
                                linewidth: 3,
                                scale: 1,
                                dashSize: 0.3,
                                gapSize: 0.3,
                                opacity: 0.7,
                                transparent: true
                            });
                            this.tempObject = new THREE.Line(arcGeometry, material);
                            this.tempObject.computeLineDistances();
                            this.tempObject.renderOrder = 999;
                            this.app.scene.add(this.tempObject);
                            
                            // Afficher le rayon dans le tooltip
                            if (event) {
                                const center = this.calculateCircleCenter(startPoint, middlePoint, endPoint);
                                if (center) {
                                    const radius = center.distanceTo(startPoint);
                                    this.showPolylineTooltip(
                                        event.clientX, 
                                        event.clientY, 
                                        this.calculatePolylineDistance(this.drawingPoints),
                                        null,
                                        null,
                                        null,
                                        radius
                                    );
                                }
                            }
                        }
                    }
                } else {
                    // Mode ligne normal (code existant)
                    if (this.drawingPoints.length > 0) {
                        // Créer uniquement la ligne de preview du dernier point au point actuel
                        const lastPoint = this.drawingPoints[this.drawingPoints.length - 1];
                        const points = [lastPoint, previewPoint];
                        const geometry = new THREE.BufferGeometry().setFromPoints(points);
                        const material = new THREE.LineDashedMaterial({ 
                            color: 0x666666, // Gris pour le distinguer des lignes confirmées
                            linewidth: 2,
                            scale: 1,
                            dashSize: 0.3,
                            gapSize: 0.3,
                            opacity: 0.7,
                            transparent: true
                        });
                        this.tempObject = new THREE.Line(geometry, material);
                        this.tempObject.computeLineDistances();
                        this.tempObject.renderOrder = 999; // Assurez-vous qu'il est rendu au-dessus
                        this.app.scene.add(this.tempObject);
                    }
                }
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
                color: 0x000000, // Noir
                linewidth: 5,    // Épais
                opacity: 1,
                transparent: false
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
            
            // Afficher la distance finale
            const totalDistance = this.calculatePolylineDistance(this.drawingPoints);
            document.getElementById('command-output').textContent = 
                `Polyligne créée - Distance totale: ${totalDistance.toFixed(2)} cm`;
            
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
    
    snapToAngleIncrement(startPoint, currentPoint, angleIncrement) {
        const dx = currentPoint.x - startPoint.x;
        const dy = currentPoint.y - startPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.1) return currentPoint;

        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const normalizedAngle = ((currentAngle % 360) + 360) % 360;

        const snappedAngle = Math.round(normalizedAngle / angleIncrement) * angleIncrement;
        const snappedAngleRad = snappedAngle * Math.PI / 180;

        return new THREE.Vector3(
            startPoint.x + distance * Math.cos(snappedAngleRad),
            startPoint.y + distance * Math.sin(snappedAngleRad),
            currentPoint.z
        );
    }

    showLineSnapGuides(startPoint, endPoint) {
        const angleIncrement = 45; // Afficher les guides uniquement tous les 45 degrés
        const guideLength = 100;

        for (let angle = 0; angle < 360; angle += angleIncrement) {
            const angleRad = angle * Math.PI / 180;
            const guideEnd = new THREE.Vector3(
                startPoint.x + guideLength * Math.cos(angleRad),
                startPoint.y + guideLength * Math.sin(angleRad),
                startPoint.z
            );

            const points = [startPoint, guideEnd];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            // Déterminer la couleur du guide en fonction de son parallélisme avec les axes
            const isHorizontal = angle === 0 || angle === 180; // Parallèle à l'axe rouge
            const isVertical = angle === 90 || angle === 270;  // Parallèle à l'axe vert
            const color = isHorizontal ? 0xff0000 : isVertical ? 0x00ff00 : 0xd3d3d3; // Rouge, vert ou gris clair

            const material = new THREE.LineDashedMaterial({
                color: color,
                linewidth: 1,
                scale: 1,
                dashSize: 0.5, // Taille des traits
                gapSize: 0.5,  // Taille des espaces pour un effet pointillé
                opacity: 0.7, // Semi-transparent
                transparent: true
            });

            const guideLine = new THREE.Line(geometry, material);
            guideLine.computeLineDistances(); // Nécessaire pour les lignes en pointillés
            guideLine.renderOrder = 998;

            this.app.scene.add(guideLine);
            this.snapHelpers.push(guideLine);
        }
    }

    showAngleTooltip(point3D, angle) {
        if (!this.polylineTooltip) return;

        // Project the 3D point to screen coordinates
        const vector = point3D.clone();
        vector.project(this.app.camera);

        // Convert normalized coordinates (-1 to 1) to screen coordinates
        const rect = this.app.renderer.domElement.getBoundingClientRect();
        const x = (vector.x + 1) / 2 * rect.width + rect.left;
        const y = -(vector.y - 1) / 2 * rect.height + rect.top;

        this.polylineTooltip.innerHTML = `Angle relatif: ${angle.toFixed(1)}°`;
        this.polylineTooltip.style.left = `${x + 15}px`;
        this.polylineTooltip.style.top = `${y - 10}px`;
        this.polylineTooltip.style.display = 'block';
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
        } else if (this.app.currentTool === 'surface' && this.surfaceTool.active) { // Add surface tool cancel
            this.surfaceTool.cancel();
        } else if (this.isDrawing) { // For tools like polyline still using this.isDrawing
            if (this.drawingMode === 'polyline' && this.drawingPoints.length >= 0) { // Allow cancel even with 0 points for polyline
                this.hideContextMenu();
            }
            // Réinitialiser le mode arc si nécessaire
            if (this.drawingMode === 'polyline') {
                this.polylineArcMode = false;
                this.polylineArcPoints = [];
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
        this.drawingPoints = [];
        
        if (this.tempObject) {
            this.app.scene.remove(this.tempObject);
            if (this.tempObject.geometry) this.tempObject.geometry.dispose();
            if (this.tempObject.material) this.tempObject.material.dispose();
            this.tempObject = null;
        }
        
        this.clearSnapHelpers();
        this.app.snapManager.hideTooltip();
        this.hidePolylineTooltip(); // Masquer l'infobulle de la polyligne
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
        } else if (event.key === 'Backspace' && this.isDrawing && this.drawingMode === 'polyline') {
            // Touche Backspace pour annuler le dernier point
            event.preventDefault();
            this.undoLastPoint();
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
    
    togglePolylineArcMode() {
        this.polylineArcMode = !this.polylineArcMode;
        const cmdOutput = document.getElementById('command-output');
        if (this.polylineArcMode) {
            cmdOutput.textContent = 'Mode ARC activé - Cliquez pour le point de départ de l\'arc';
            this.polylineArcPoints = []; // Points temporaires pour l'arc
        } else {
            cmdOutput.textContent = 'Mode LIGNE activé - Cliquez pour le point suivant';
            this.polylineArcPoints = [];
        }
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
    
    /**
     * Trouve les lignes connectées à une ligne donnée
     */
    findConnectedLines(targetLine, tolerance = 0.1) {
        const connectedLines = [];
        
        if (!targetLine.geometry || !targetLine.geometry.attributes.position) {
            return connectedLines;
        }
        
        const targetPositions = targetLine.geometry.attributes.position;
        const targetStart = new THREE.Vector3(
            targetPositions.getX(0),
            targetPositions.getY(0),
            targetPositions.getZ(0)
        );
        const targetEnd = new THREE.Vector3(
            targetPositions.getX(targetPositions.count - 1),
            targetPositions.getY(targetPositions.count - 1),
            targetPositions.getZ(targetPositions.count - 1)
        );
        
        // Parcourir tous les objets pour trouver les lignes connectées
        this.app.objects.forEach(obj => {
            if (obj === targetLine || !(obj instanceof THREE.Line)) {
                return;
            }
            
            if (!obj.geometry || !obj.geometry.attributes.position) {
                return;
            }
            
            const positions = obj.geometry.attributes.position;
            const objStart = new THREE.Vector3(
                positions.getX(0),
                positions.getY(0),
                positions.getZ(0)
            );
            const objEnd = new THREE.Vector3(
                positions.getX(positions.count - 1),
                positions.getY(positions.count - 1),
                positions.getZ(positions.count - 1)
            );
            
            // Vérifier les connexions possibles
            let isConnected = false;
            let connectionInfo = {};
            
            if (targetStart.distanceTo(objStart) < tolerance) {
                isConnected = true;
                connectionInfo = { type: 'start-start', point: targetStart.clone() };
            } else if (targetStart.distanceTo(objEnd) < tolerance) {
                isConnected = true;
                connectionInfo = { type: 'start-end', point: targetStart.clone() };
            } else if (targetEnd.distanceTo(objStart) < tolerance) {
                isConnected = true;
                connectionInfo = { type: 'end-start', point: targetEnd.clone() };
            } else if (targetEnd.distanceTo(objEnd) < tolerance) {
                isConnected = true;
                connectionInfo = { type: 'end-end', point: targetEnd.clone() };
            }
            
            if (isConnected) {
                connectedLines.push({
                    line: obj,
                    connection: connectionInfo
                });
            }
        });
        
        return connectedLines;
    }
    
    /**
     * Construit un chemin fermé à partir de lignes connectées
     */
    buildClosedPath(connectedLines, tolerance = 0.1) {
        if (connectedLines.length < 2) {
            return null;
        }
        
        const path = [];
        const usedLines = new Set();
        
        // Commencer avec la première ligne
        const firstLineInfo = connectedLines[0];
        const firstLine = firstLineInfo.line;
        usedLines.add(firstLine);
        
        // Extraire les points de la première ligne
        const firstPositions = firstLine.geometry.attributes.position;
        for (let i = 0; i < firstPositions.count; i++) {
            path.push(new THREE.Vector3(
                firstPositions.getX(i),
                firstPositions.getY(i),
                firstPositions.getZ(i)
            ));
        }
        
        let currentEndPoint = path[path.length - 1];
        let foundConnection = true;
        
        // Essayer de connecter d'autres lignes
        while (foundConnection && usedLines.size < connectedLines.length) {
            foundConnection = false;
            
            for (const lineInfo of connectedLines) {
                if (usedLines.has(lineInfo.line)) {
                    continue;
                }
                
                const line = lineInfo.line;
                const positions = line.geometry.attributes.position;
                
                const lineStart = new THREE.Vector3(
                    positions.getX(0),
                    positions.getY(0),
                    positions.getZ(0)
                );
                const lineEnd = new THREE.Vector3(
                    positions.getX(positions.count - 1),
                    positions.getY(positions.count - 1),
                    positions.getZ(positions.count - 1)
                );
                
                // Vérifier si cette ligne se connecte au point actuel
                if (currentEndPoint.distanceTo(lineStart) < tolerance) {
                    // Ajouter les points de cette ligne (en excluant le premier qui est déjà dans le chemin)
                    for (let i = 1; i < positions.count; i++) {
                        path.push(new THREE.Vector3(
                            positions.getX(i),
                            positions.getY(i),
                            positions.getZ(i)
                        ));
                    }
                    currentEndPoint = lineEnd;
                    usedLines.add(line);
                    foundConnection = true;
                    break;
                } else if (currentEndPoint.distanceTo(lineEnd) < tolerance) {
                    // Ajouter les points de cette ligne en ordre inverse
                    for (let i = positions.count - 2; i >= 0; i--) {
                        path.push(new THREE.Vector3(
                            positions.getX(i),
                            positions.getY(i),
                            positions.getZ(i)
                        ));
                    }
                    currentEndPoint = lineStart;
                    usedLines.add(line);
                    foundConnection = true;
                    break;
                }
            }
        }
        
        // Vérifier si le chemin est fermé
        if (path.length >= 3) {
            const firstPoint = path[0];
            const lastPoint = path[path.length - 1];
            
            if (firstPoint.distanceTo(lastPoint) < tolerance) {
                return path.slice(0, -1); // Retirer le dernier point dupliqué
            }
        }
        
        return null; // Pas de chemin fermé trouvé
    }
    
    /**
     * Propose de fermer une forme qui est presque fermée
     */
    showCloseShapeDialog(line, firstPoint, lastPoint) {
        const distance = firstPoint.distanceTo(lastPoint);
        
        // Créer une notification avec proposition de fermer
        if (!document.getElementById('close-shape-notification')) {
            const notification = document.createElement('div');
            notification.id = 'close-shape-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: #2196F3;
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 400px;
            `;
            notification.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>Forme presque fermée (écart: ${distance.toFixed(1)}cm)</span>
                <button id="close-shape-btn" style="
                    background: white;
                    color: #2196F3;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-weight: bold;
                ">Fermer et créer surface</button>
                <button id="dismiss-close-btn" style="
                    background: transparent;
                    color: white;
                    border: 1px solid white;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                ">Ignorer</button>
            `;
            document.body.appendChild(notification);
            
            // Gestionnaire pour fermer et créer la surface
            document.getElementById('close-shape-btn').addEventListener('click', () => {
                this.forceCloseShapeAndCreateSurface(line);
                notification.remove();
            });
            
            // Gestionnaire pour ignorer
            document.getElementById('dismiss-close-btn').addEventListener('click', () => {
                notification.remove();
            });
            
            // Auto-masquer après 15 secondes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 15000);
        }
    }
    
    /**
     * Force la fermeture d'une forme et crée une surface
     */
    forceCloseShapeAndCreateSurface(line) {
        if (!line.geometry || !line.geometry.attributes.position) {
            return;
        }
        
        const positions = line.geometry.attributes.position;
        const points = [];
        
        // Extraire tous les points
        for (let i = 0; i < positions.count; i++) {
            points.push(new THREE.Vector3(
                positions.getX(i),
                positions.getY(i),
                positions.getZ(i)
            ));
        }
        
        // Fermer en ajoutant le premier point à la fin s'il n'y est pas déjà
        if (points.length >= 3) {
            const firstPoint = points[0];
            const lastPoint = points[points.length - 1];
            
            if (firstPoint.distanceTo(lastPoint) > 0.1) {
                points.push(firstPoint.clone());
            }
            
            // Créer la surface
            this.createSurfaceFromPoints(points);
            
            // Mettre à jour la ligne originale pour qu'elle soit fermée
            const newGeometry = new THREE.BufferGeometry().setFromPoints(points);
            line.geometry.dispose();
            line.geometry = newGeometry;
        }
    }
    
    createSurfaceFromPoints(points) {
        if (points.length < 3) {
            console.warn('Pas assez de points pour créer une surface');
            return null;
        }
        
        try {
            console.log(`Création d'une surface avec ${points.length} points`);
            
            // Vérifier que tous les points sont approximativement sur le même plan Z
            const avgZ = points.reduce((sum, p) => sum + p.z, 0) / points.length;
            const isFlat = points.every(p => Math.abs(p.z - avgZ) < 0.1);
            
            if (!isFlat) {
                console.warn('Les points ne forment pas une surface plane');
                return null;
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
            
            console.log('✓ Surface créée avec succès');
            document.getElementById('command-output').textContent = `Surface créée à partir de ${points.length} points (peut être extrudée)`;
            
            return surface;
        } catch (error) {
            console.error('Erreur lors de la création de surface:', error);
            document.getElementById('command-output').textContent = 'Impossible de créer une surface à partir de ces points';
            return null;
        }
    }
    
    calculateArcMiddlePoint(startPoint, endPoint, mousePoint) {
        // Calculer le point milieu de l'arc basé sur la position de la souris
        // Cela détermine la courbure de l'arc
        
        // Vecteur du segment start-end
        const chord = new THREE.Vector3().subVectors(endPoint, startPoint);
        const chordLength = chord.length();
        const chordMidpoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
        
        // Vecteur perpendiculaire au segment
        const perpendicular = new THREE.Vector3(-chord.y, chord.x, 0).normalize();
        
        // Projeter la position de la souris sur la ligne perpendiculaire passant par le milieu
        const mouseVector = new THREE.Vector3().subVectors(mousePoint, chordMidpoint);
        const projectionLength = mouseVector.dot(perpendicular);
        
        // Limiter la courbure pour éviter les arcs trop extrêmes
        const maxBulge = chordLength * 2; // Limite à 200% de la longueur de la corde
        const clampedProjection = Math.max(-maxBulge, Math.min(maxBulge, projectionLength));
        
        // Calculer le point milieu de l'arc
        const middlePoint = new THREE.Vector3()
            .copy(chordMidpoint)
            .add(perpendicular.multiplyScalar(clampedProjection));
        
        return middlePoint;
    }
}
