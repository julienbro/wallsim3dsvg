import * as THREE from 'three';

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

// S'assurer que les méthodes sont ajoutées à la classe WebCAD existante
// Ces méthodes doivent être ajoutées dans la classe WebCAD principale du fichier core/WebCAD.js
// Pour l'instant, on les ajoute ici temporairement

// Fonction utilitaire pour ajouter les méthodes à WebCAD
export function addRectangleDeleteMethods(webCADInstance) {
    console.log('Ajout des méthodes de suppression de rectangle...');
    
    // Sauvegarder la méthode deleteSelected originale
    const originalDeleteSelected = webCADInstance.deleteSelected.bind(webCADInstance);
    
    // Remplacer la méthode deleteSelected
    webCADInstance.deleteSelected = function() {
        console.log('deleteSelected appelée, objet sélectionné:', this.selectedObject);
        
        if (this.selectedObject) {
            // Vérifier si c'est un rectangle (PlaneGeometry)
            if (
                this.selectedObject instanceof THREE.Mesh &&
                this.selectedObject.geometry instanceof THREE.PlaneGeometry
            ) {
                console.log('Rectangle détecté, suppression de la surface seulement');
                // Supprimer seulement la surface, garder les contours
                this.removeRectangleSurfaceKeepEdges();
                return;
            }

            // Appeler la méthode originale pour les autres objets (lignes, etc.)
            console.log('Objet non-rectangle, suppression normale');
            originalDeleteSelected();
        } else {
            document.getElementById('command-output').textContent = 'Aucun objet sélectionné';
        }
    };

    // Ajouter la méthode removeRectangleSurfaceKeepEdges
    webCADInstance.removeRectangleSurfaceKeepEdges = function() {
        if (!this.selectedObject) return;

        const rectMesh = this.selectedObject;
        
        // Récupérer les infos du rectangle
        const width = rectMesh.geometry.parameters.width * rectMesh.scale.x;
        const height = rectMesh.geometry.parameters.height * rectMesh.scale.y;
        const position = rectMesh.position.clone();
        const rotation = rectMesh.rotation.clone();

        // Calculer les coins dans le repère local
        const corners = [
            new THREE.Vector3(-width/2, -height/2, 0),
            new THREE.Vector3(width/2, -height/2, 0),
            new THREE.Vector3(width/2, height/2, 0),
            new THREE.Vector3(-width/2, height/2, 0)
        ];

        // Appliquer la rotation et la position
        corners.forEach(corner => {
            corner.applyEuler(rotation);
            corner.add(position);
        });

        // Créer les 4 arêtes
        for (let i = 0; i < 4; i++) {
            const start = corners[i];
            const end = corners[(i + 1) % 4];
            const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            const material = new THREE.LineBasicMaterial({ 
                color: 0x000000, 
                linewidth: 2 
            });
            const edge = new THREE.Line(geometry, material);
            
            // Ajouter les arêtes à la scène et aux listes
            this.scene.add(edge);
            this.objects.push(edge);
            if (this.layers && this.layers[this.currentLayer]) {
                this.layers[this.currentLayer].objects.push(edge);
            }
        }

        // Ajouter à l'historique
        if (this.addToHistory) {
            this.addToHistory('removeSurface', rectMesh);
        }

        // Supprimer la surface du rectangle
        this.scene.remove(rectMesh);
        this.objects = this.objects.filter(obj => obj.uuid !== rectMesh.uuid);
        if (this.layers) {
            this.layers.forEach(layer => {
                layer.objects = layer.objects.filter(obj => obj.uuid !== rectMesh.uuid);
            });
        }

        // Nettoyer la sélection
        this.transformControls.detach();
        this.selectedObject = null;
        if (this.uiManager) {
            this.uiManager.updatePropertiesPanel(null);
        }

        document.getElementById('command-output').textContent = 'Surface supprimée, contours conservés';
    };
    
    // Ajouter la méthode pour détecter les formes fermées
    webCADInstance.detectClosedShapes = function() {
        console.log('Détection des formes fermées...');
        
        const tolerance = 0.1; // Tolérance pour considérer deux points comme identiques
        const closedShapes = [];
        
        // Récupérer toutes les lignes et arcs
        const linesAndArcs = this.objects.filter(obj => 
            (obj instanceof THREE.Line && obj.geometry.attributes.position.count === 2) ||
            (obj.userData && obj.userData.type === 'arc')
        );
        
        console.log(`Analysing ${linesAndArcs.length} lignes et arcs`);
        
        // Fonction pour obtenir les points d'extrémité d'un objet
        const getEndpoints = (obj) => {
            if (obj instanceof THREE.Line) {
                const positions = obj.geometry.attributes.position;
                return [
                    new THREE.Vector3().fromBufferAttribute(positions, 0),
                    new THREE.Vector3().fromBufferAttribute(positions, 1)
                ];
            } else if (obj.userData && obj.userData.type === 'arc') {
                // Pour les arcs, récupérer start et end depuis userData
                return [
                    new THREE.Vector3(obj.userData.startPoint.x, obj.userData.startPoint.y, 0),
                    new THREE.Vector3(obj.userData.endPoint.x, obj.userData.endPoint.y, 0)
                ];
            }
            return null;
        };
        
        // Fonction pour vérifier si deux points sont proches
        const arePointsClose = (p1, p2) => {
            return p1.distanceTo(p2) < tolerance;
        };
        
        // Algorithme de détection de formes fermées
        const visited = new Set();
        
        for (let i = 0; i < linesAndArcs.length; i++) {
            if (visited.has(i)) continue;
            
            const shape = [];
            const currentPath = [i];
            visited.add(i);
            
            let currentEndpoints = getEndpoints(linesAndArcs[i]);
            if (!currentEndpoints) continue;
            
            shape.push(linesAndArcs[i]);
            let currentEnd = currentEndpoints[1];
            let startPoint = currentEndpoints[0];
            
            // Suivre la chaîne de segments connectés
            let foundConnection = true;
            while (foundConnection) {
                foundConnection = false;
                
                for (let j = 0; j < linesAndArcs.length; j++) {
                    if (visited.has(j)) continue;
                    
                    const endpoints = getEndpoints(linesAndArcs[j]);
                    if (!endpoints) continue;
                    
                    // Vérifier si ce segment se connecte à l'extrémité actuelle
                    if (arePointsClose(currentEnd, endpoints[0])) {
                        shape.push(linesAndArcs[j]);
                        currentPath.push(j);
                        visited.add(j);
                        currentEnd = endpoints[1];
                        foundConnection = true;
                        break;
                    } else if (arePointsClose(currentEnd, endpoints[1])) {
                        shape.push(linesAndArcs[j]);
                        currentPath.push(j);
                        visited.add(j);
                        currentEnd = endpoints[0];
                        foundConnection = true;
                        break;
                    }
                }
            }
            
            // Vérifier si la forme est fermée
            if (shape.length >= 3 && arePointsClose(currentEnd, startPoint)) {
                console.log(`Forme fermée détectée avec ${shape.length} segments`);
                closedShapes.push({
                    segments: shape,
                    indices: currentPath
                });
            }
        }
        
        return closedShapes;
    };

    // Ajouter la méthode pour créer une surface à partir d'une forme fermée
    webCADInstance.createSurfaceFromShape = function(shape) {
        console.log('Création de surface pour forme fermée...');
        
        try {
            const points = [];
            
            // Construire le contour ordonné
            for (let i = 0; i < shape.segments.length; i++) {
                const segment = shape.segments[i];
                
                if (segment instanceof THREE.Line) {
                    const positions = segment.geometry.attributes.position;
                    const p1 = new THREE.Vector3().fromBufferAttribute(positions, 0);
                    const p2 = new THREE.Vector3().fromBufferAttribute(positions, 1);
                    
                    if (i === 0) {
                        points.push(new THREE.Vector2(p1.x, p1.y));
                    }
                    points.push(new THREE.Vector2(p2.x, p2.y));
                    
                } else if (segment.userData && segment.userData.type === 'arc') {
                    // Pour les arcs, discrétiser en segments
                    const arcData = segment.userData;
                    const center = new THREE.Vector2(arcData.center.x, arcData.center.y);
                    const radius = arcData.radius;
                    const startAngle = arcData.startAngle;
                    const endAngle = arcData.endAngle;
                    const segments = 16; // Nombre de segments pour approximer l'arc
                    
                    for (let j = 1; j <= segments; j++) {
                        const angle = startAngle + (endAngle - startAngle) * (j / segments);
                        const x = center.x + radius * Math.cos(angle);
                        const y = center.y + radius * Math.sin(angle);
                        points.push(new THREE.Vector2(x, y));
                    }
                }
            }
            
            // Créer la forme THREE.js
            const shape2D = new THREE.Shape(points);
            
            // Créer la géométrie de la surface
            const geometry = new THREE.ShapeGeometry(shape2D);
            
            // Matériau pour la surface
            const material = new THREE.MeshBasicMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            // Créer le mesh de surface
            const surfaceMesh = new THREE.Mesh(geometry, material);
            surfaceMesh.userData.type = 'closedSurface';
            surfaceMesh.userData.originalShape = shape;
            
            // Ajouter à la scène
            this.scene.add(surfaceMesh);
            this.objects.push(surfaceMesh);
            
            if (this.layers && this.layers[this.currentLayer]) {
                this.layers[this.currentLayer].objects.push(surfaceMesh);
            }
            
            if (this.addToHistory) {
                this.addToHistory('createSurface', surfaceMesh);
            }
            
            console.log('Surface créée avec succès');
            document.getElementById('command-output').textContent = 'Surface créée à partir de la forme fermée';
            
            return surfaceMesh;
            
        } catch (error) {
            console.error('Erreur lors de la création de la surface:', error);
            document.getElementById('command-output').textContent = 'Erreur lors de la création de la surface';
            return null;
        }
    };

    // Ajouter la méthode pour créer toutes les surfaces détectées
    webCADInstance.createAllClosedSurfaces = function() {
        const closedShapes = this.detectClosedShapes();
        let createdSurfaces = 0;
        
        closedShapes.forEach(shape => {
            const surface = this.createSurfaceFromShape(shape);
            if (surface) {
                createdSurfaces++;
            }
        });
        
        if (createdSurfaces > 0) {
            document.getElementById('command-output').textContent = 
                `${createdSurfaces} surface(s) créée(s) à partir des formes fermées`;
        } else {
            document.getElementById('command-output').textContent = 
                'Aucune forme fermée détectée';
        }
        
        return createdSurfaces;
    };

    // Ajouter la méthode d'extrusion
    webCADInstance.extrudeSurface = function(surfaceMesh, height = 5) {
        if (!surfaceMesh || !surfaceMesh.userData || surfaceMesh.userData.type !== 'closedSurface') {
            console.error('Objet sélectionné n\'est pas une surface fermée');
            return null;
        }
        
        try {
            // Récupérer la forme originale
            const originalGeometry = surfaceMesh.geometry;
            
            // Créer la géométrie d'extrusion
            const extrudeSettings = {
                depth: height,
                bevelEnabled: false
            };
            
            // Obtenir la forme à partir de la géométrie
            const points = [];
            const positions = originalGeometry.attributes.position;
            const index = originalGeometry.index;
            
            if (index) {
                // Géométrie indexée
                for (let i = 0; i < index.count; i += 3) {
                    const a = index.getX(i);
                    points.push(new THREE.Vector2(
                        positions.getX(a),
                        positions.getY(a)
                    ));
                }
            } else {
                // Géométrie non-indexée
                for (let i = 0; i < positions.count; i++) {
                    points.push(new THREE.Vector2(
                        positions.getX(i),
                        positions.getY(i)
                    ));
                }
            }
            
            const shape = new THREE.Shape(points);
            const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            
            const extrudeMaterial = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.8
            });
            
            const extrudedMesh = new THREE.Mesh(extrudeGeometry, extrudeMaterial);
            extrudedMesh.userData.type = 'extrudedSurface';
            extrudedMesh.userData.originalSurface = surfaceMesh;
            extrudedMesh.userData.height = height;
            
            // Positionner l'objet extrudé
            extrudedMesh.position.copy(surfaceMesh.position);
            extrudedMesh.rotation.copy(surfaceMesh.rotation);
            
            // Ajouter à la scène
            this.scene.add(extrudedMesh);
            this.objects.push(extrudedMesh);
            
            if (this.layers && this.layers[this.currentLayer]) {
                this.layers[this.currentLayer].objects.push(extrudedMesh);
            }
            
            if (this.addToHistory) {
                this.addToHistory('extrude', extrudedMesh);
            }
            
            // Masquer la surface originale
            surfaceMesh.visible = false;
            
            console.log('Extrusion créée avec succès');
            document.getElementById('command-output').textContent = 
                `Objet extrudé créé (hauteur: ${height})`;
            
            return extrudedMesh;
            
        } catch (error) {
            console.error('Erreur lors de l\'extrusion:', error);
            document.getElementById('command-output').textContent = 'Erreur lors de l\'extrusion';
            return null;
        }
    };

    // Ajouter une méthode utilitaire pour gérer l'extrusion de l'objet sélectionné
    webCADInstance.extrudeSelected = function(height = 5) {
        if (!this.selectedObject) {
            document.getElementById('command-output').textContent = 'Aucun objet sélectionné';
            return null;
        }
        
        if (this.selectedObject.userData && this.selectedObject.userData.type === 'closedSurface') {
            return this.extrudeSurface(this.selectedObject, height);
        } else {
            document.getElementById('command-output').textContent = 
                'L\'objet sélectionné n\'est pas une surface fermée';
            return null;
        }
    };

    // Ajouter des boutons à l'interface
    webCADInstance.addSurfaceButtons = function() {
        // Chercher la toolbar existante ou la créer
        let toolbar = document.querySelector('.toolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.className = 'toolbar';
            toolbar.style.cssText = `
                position: fixed;
                top: 60px;
                left: 10px;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid #ccc;
                border-radius: 5px;
                padding: 10px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 5px;
            `;
            document.body.appendChild(toolbar);
        }

        // Section Surfaces
        const surfaceSection = document.createElement('div');
        surfaceSection.style.cssText = `
            border-top: 1px solid #ddd;
            padding-top: 10px;
            margin-top: 10px;
        `;
        
        const surfaceTitle = document.createElement('h4');
        surfaceTitle.textContent = 'Surfaces';
        surfaceTitle.style.cssText = `
            margin: 0 0 5px 0;
            font-size: 12px;
            color: #333;
        `;
        surfaceSection.appendChild(surfaceTitle);
        
        // Ajouter la section à la toolbar
        toolbar.appendChild(surfaceSection);
    };
}

// Fonction pour créer des formes de test
export function createTestShapes(webCADInstance) {
    console.log('Création de formes de test...');
    
    // Créer un carré avec des lignes
    const squarePoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(10, 10, 0),
        new THREE.Vector3(0, 10, 0)
    ];
    
    for (let i = 0; i < 4; i++) {
        const start = squarePoints[i];
        const end = squarePoints[(i + 1) % 4];
        
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        const line = new THREE.Line(geometry, material);
        
        webCADInstance.scene.add(line);
        webCADInstance.objects.push(line);
        
        if (webCADInstance.layers && webCADInstance.layers[webCADInstance.currentLayer]) {
            webCADInstance.layers[webCADInstance.currentLayer].objects.push(line);
        }
    }
    
    // Créer un triangle
    const trianglePoints = [
        new THREE.Vector3(20, 0, 0),
        new THREE.Vector3(30, 0, 0),
        new THREE.Vector3(25, 10, 0)
    ];
    
    for (let i = 0; i < 3; i++) {
        const start = trianglePoints[i];
        const end = trianglePoints[(i + 1) % 3];
        
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
        const line = new THREE.Line(geometry, material);
        
        webCADInstance.scene.add(line);
        webCADInstance.objects.push(line);
        
        if (webCADInstance.layers && webCADInstance.layers[webCADInstance.currentLayer]) {
            webCADInstance.layers[webCADInstance.currentLayer].objects.push(line);
        }
    }
    
    console.log('Formes de test créées: carré et triangle');
    document.getElementById('command-output').textContent = 'Formes de test créées - Cliquez sur "Créer Surfaces"';
}
