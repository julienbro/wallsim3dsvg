import * as THREE from 'three';

// Classe pour gérer l'indicateur de nord
export class NorthIndicator {
    constructor(app) {
        this.app = app;
        this.northAngle = 0; // Angle en degrés (0 = Y positif)
        this.visible = false;
        this.indicator = null;
        this.label = null;
        this.createNorthIndicator();
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
        
        // S'assurer que la scène existe avant d'ajouter
        if (this.app.scene) {
            this.app.scene.add(this.indicator);
            console.log('Indicateur Nord ajouté à la scène');
        } else {
            console.error('Scène non disponible pour ajouter l\'indicateur Nord');
        }
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
    
    setVisible(visible) {
        this.visible = visible;
        console.log('Changement visibilité Nord:', visible);
        if (this.indicator) {
            this.indicator.visible = visible;
            console.log('Indicateur Nord visible:', this.indicator.visible);
        } else {
            console.error('Indicateur Nord non initialisé');
        }
    }
    
    setOrientation(angle) {
        this.setAngle(angle);
    }
    
    setAngle(degrees) {
        if (this.indicator) {
            this.currentAngle = degrees;
            // Convertir les degrés en radians et appliquer la rotation
            // Rotation autour de l'axe Z (vertical)
            this.indicator.rotation.z = -degrees * Math.PI / 180;
            console.log(`Indicateur Nord orienté à ${degrees}°`);
            // Mettre à jour l'angle du Nord dans le SunlightManager
            if (this.app.sunlightManager) {
                this.app.sunlightManager.northAngle = degrees;
                if (typeof this.app.sunlightManager.updateSunPosition === 'function') {
                    this.app.sunlightManager.updateSunPosition();
                }
            }
        }
    }
    
    getNorthAngle() {
        return this.northAngle;
    }
    
    // Calculer la direction du nord en vecteur 3D
    getNorthVector() {
        const radians = (this.northAngle * Math.PI) / 180;
        return new THREE.Vector3(
            Math.sin(radians),
            Math.cos(radians),
            0
        ).normalize();
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
    
    console.log('Méthodes de suppression de rectangle ajoutées avec succès');
}


// Ajouter les contrôles pour la création de surfaces et l'extrusion
export class UIManager {
    constructor(app) {
        this.app = app;
        this.constructionElements = {
            briques: {
                name: 'Briques',
                icon: '🧱',
                elements: {
                    'brique_20_10_5': {
                        name: 'Brique 20x10x5',
                        file: 'https://wall3dsim.com/biblio/brique_20_10_5.dae',
                        dimensions: { x: 20, y: 10, z: 5 },
                        description: 'Brique standard 20x10x5 cm',
                        material: 'Argile',
                        weight: '10 kg/m²',
                        category: 'murs'
                    },
                    'brique_30_15_10': {
                        name: 'Brique 30x15x10',
                        file: 'https://wall3dsim.com/biblio/brique_30_15_10.dae',
                        dimensions: { x: 30, y: 15, z: 10 },
                        description: 'Brique standard 30x15x10 cm',
                        material: 'Argile',
                        weight: '15 kg/m²',
                        category: 'murs'
                    }
                }
            },
            blocs: {
                name: 'Blocs',  
                icon: '⬜',
                elements: {
                    'bloc_beton_40_20_20': {
                        name: 'Bloc Béton 40x20x20',
                        file: 'https://wall3dsim.com/biblio/bloc_beton_40_20_20.dae',
                        dimensions: { x: 40, y: 20, z: 20 },
                        description: 'Bloc en béton 40x20x20 cm',
                        material: 'Béton',
                        weight: '20 kg/m²',
                        category: 'murs'
                    },
                    'bloc_terre_cuite_30_10_15': {
                        name: 'Bloc Terre Cuite 30x10x15',
                        file: 'https://wall3dsim.com/biblio/bloc_terre_cuite_30_10_15.dae',
                        dimensions: { x: 30, y: 10, z: 15 },
                        description: 'Bloc en terre cuite 30x10x15 cm',
                        material: 'Terre cuite',
                        weight: '15 kg/m²',
                        category: 'murs'
                    }
                }
            },
            linteaux: {
                name: 'Linteaux',
                icon: '━',
                elements: {
                    'linteau_beton_120_20_20': {
                        name: 'Linteau Béton 120x20x20',
                        file: 'https://wall3dsim.com/biblio/linteau_beton_120_20_20.dae',
                        dimensions: { x: 120, y: 20, z: 20 },
                        description: 'Linteau en béton 120x20x20 cm',
                        material: 'Béton',
                        weight: '25 kg/m²',
                        category: 'linteaux'
                    },
                    'linteau_terre_cuite_100_10_10': {
                        name: 'Linteau Terre Cuite 100x10x10',
                        file: 'https://wall3dsim.com/biblio/linteau_terre_cuite_100_10_10.dae',
                        dimensions: { x: 100, y: 10, z: 10 },
                        description: 'Linteau en terre cuite 100x10x10 cm',
                        material: 'Terre cuite',
                        weight: '20 kg/m²',
                        category: 'linteaux'
                    }
                }
            },
            isolants: {
                name: 'Isolants',
                icon: '🟨',
                elements: {
                    'isolant_placo_120_60_1.25': {
                        name: 'Isolant Placo 120x60x1.25',
                        file: 'https://wall3dsim.com/biblio/isolant_placo_120_60_1.25.dae',
                        dimensions: { x: 120, y: 60, z: 1.25 },
                        description: 'Isolant en plaques de plâtre 120x60x1.25 cm',
                        material: 'Plâtre',
                        weight: '10 kg/m²',
                        category: 'isolants'
                    },
                    'isolant_rouleau_100_50_5': {
                        name: 'Isolant Rouleau 100x50x5',
                        file: 'https://wall3dsim.com/biblio/isolant_rouleau_100_50_5.dae',
                        dimensions: { x: 100, y: 50, z: 5 },
                        description: 'Isolant en rouleau 100x50x5 cm',
                        material: 'Laine de verre',
                        weight: '15 kg/m²',
                        category: 'isolants'
                    }
                }
            },
            planchers: {
                name: 'Planchers',
                icon: '⬛',
                elements: {
                    'hourdis_13_60': {
                        name: 'Hourdis 13+6',
                        file: 'https://wall3dsim.com/biblio/hourdis_13_60.dae',
                        dimensions: { x: 60, y: 13, z: 19 },
                        description: 'Hourdis béton préfabriqué 13+6 cm, longueur 60 cm',
                        material: 'Béton',
                        weight: '25 kg/m²',
                        category: 'planchers'
                    }
                }
            },
            autres: {
                name: 'Autres',
                icon: '📦',
                elements: {
                    'ligne': {
                        name: 'Ligne',
                        file: 'https://wall3dsim.com/biblio/ligne.dae',
                        dimensions: { x: 100, y: 1, z: 1 },
                        description: 'Ligne droite 100x1x1 cm',
                        material: 'Inconnu',
                        weight: 'N/A',
                        category: 'autres'
                    }
                }
            }
        };
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        
        // Ajouter les boutons pour la gestion des surfaces
        const surfaceSection = document.createElement('div');
        surfaceSection.className = 'toolbar-section';
        surfaceSection.innerHTML = '<h3>Surfaces</h3>';
        
        const createSurfacesBtn = document.createElement('button');
        createSurfacesBtn.textContent = 'Créer Surfaces';
        createSurfacesBtn.title = 'Créer des surfaces à partir des formes fermées';
        createSurfacesBtn.onclick = () => {
            this.app.createAllClosedSurfaces();
        };
        surfaceSection.appendChild(createSurfacesBtn);
        
        const extrudeBtn = document.createElement('button');
        extrudeBtn.textContent = 'Extruder';
        extrudeBtn.title = 'Extruder la surface sélectionnée';
        extrudeBtn.onclick = () => {
            this.showExtrudeDialog();
        };
        surfaceSection.appendChild(extrudeBtn);
        
        toolbar.appendChild(surfaceSection);
        
        document.body.appendChild(toolbar);
    }

    showExtrudeDialog() {
        const height = prompt('Hauteur d\'extrusion:', '5');
        if (height !== null && !isNaN(height)) {
            const result = this.app.extrudeSelected(parseFloat(height));
            if (result) {
                this.updatePropertiesPanel(result);
            }
        }
    }

    updatePropertiesPanel(object) {
        // Mettre à jour le panneau de propriétés avec les informations de l'objet
        if (object) {
            document.getElementById('properties-panel').style.display = 'block';
            document.getElementById('object-name').textContent = object.name || 'Objet';
            document.getElementById('object-type').textContent = object.type;
            
            // Afficher les propriétés spécifiques à l'objet
            if (object instanceof THREE.Mesh) {
                document.getElementById('object-material').textContent = object.material.name || 'Matériau';
                document.getElementById('object-geometry').textContent = object.geometry.type;
            }
        } else {
            document.getElementById('properties-panel').style.display = 'none';
        }
    }

    applyColorToSelectedObject(colorHex) {
        if (!this.app.selectedObject) {
            console.warn('Aucun objet sélectionné pour appliquer la couleur.');
            alert('Veuillez d\'abord sélectionner un objet.');
            return;
        }

        console.log(`Tentative d'application de la couleur ${colorHex} à l'objet sélectionné:`, this.app.selectedObject.name || this.app.selectedObject.uuid);
        let appliedToAtLeastOneMesh = false;

        this.app.selectedObject.traverse((child) => {
            if (child.isMesh) {
                console.log(`Application de la couleur au maillage: ${child.name || child.uuid}`);
                appliedToAtLeastOneMesh = true;

                if (child.geometry && child.geometry.attributes && child.geometry.attributes.color) {
                    child.geometry.deleteAttribute('color');
                    console.log(`Couleurs de vertex supprimées de la géométrie de ${child.name || child.uuid} lors de l'application de couleur.`);
                }

                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat && mat.dispose) mat.dispose();
                        });
                    } else {
                        if (child.material.dispose) child.material.dispose();
                    }
                }
                
                const newMaterial = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(colorHex),
                    roughness: 0.5,
                    metalness: 0.1,
                    side: THREE.DoubleSide,
                    vertexColors: false,
                    map: null,
                    transparent: false,
                    opacity: 1.0
                });

                child.material = newMaterial;
                child.material.needsUpdate = true;
                
                child.visible = true;
                child.castShadow = true;
                child.receiveShadow = true;

                console.log(`Nouvelle couleur ${colorHex} appliquée à ${child.name || child.uuid}. Couleur du nouveau matériau: #${child.material.color.getHexString()}`);
            }
        });

        if (!appliedToAtLeastOneMesh) {
            console.warn("L'objet sélectionné ou ses enfants ne contenaient aucun maillage auquel appliquer la couleur.");
        }

        if (this.app.renderer && this.app.scene && this.app.camera) {
            this.app.renderer.render(this.app.scene, this.app.camera);
            console.log('Rendu déclenché après application de la couleur.');
        }
        
        const output = document.getElementById('command-output');
        if (output) {
            output.textContent = `Couleur ${colorHex} appliquée.`;
        }
    }

    setupSunlightControls() {
        const azimuthSlider = document.getElementById('sun-azimuth');
        const elevationSlider = document.getElementById('sun-elevation');
        const azimuthValue = document.getElementById('azimuth-value');
        const elevationValue = document.getElementById('elevation-value');
        
        if (!azimuthSlider || !elevationSlider) {
            console.warn("Contrôles de lumière solaire non trouvés dans le DOM");
            return;
        }
        
        const updateSunlight = () => {
            const azimuth = parseFloat(azimuthSlider.value);
            const elevation = parseFloat(elevationSlider.value);
            
            if (azimuthValue) azimuthValue.textContent = azimuth.toFixed(1) + '°';
            if (elevationValue) elevationValue.textContent = elevation.toFixed(1) + '°';
            
            // Vérifier que sunlightManager existe avant d'appeler updateSunPosition
            if (this.app.sunlightManager && typeof this.app.sunlightManager.updateSunPosition === 'function') {
                this.app.sunlightManager.updateSunPosition(azimuth, elevation);
            } else {
                console.warn("SunlightManager non disponible ou updateSunPosition non définie");
            }
        };
        
        azimuthSlider.addEventListener('input', updateSunlight);
        elevationSlider.addEventListener('input', updateSunlight);
        
        // Appliquer les valeurs initiales
        updateSunlight();
    }
}