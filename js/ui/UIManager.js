import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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
        this.selectedTexture = null;
        this.selectedColor = null;
        this.isTextureMode = false;
        this.selectedElement = null;
        this.elements = {};
        this.objElements = {}; // Pour stocker les éléments OBJ
        console.log('Configuration de l\'interface utilisateur...');
        
        this.setupPanelToggles();
        this.setupEventListeners();
        this.setupTextureLibrary();
        this.setupSunlightControls();
        this.setupElementsLibrary();
    }

    setupPanelToggles() {
        // Configuration des panneaux dépliables/repliables
        const toggleButtons = document.querySelectorAll('[data-toggle-panel]');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = button.getAttribute('data-toggle-panel');
                const targetPanel = document.getElementById(targetId);
                
                if (targetPanel) {
                    const isVisible = targetPanel.style.display !== 'none';
                    targetPanel.style.display = isVisible ? 'none' : 'block';
                    
                    // Mettre à jour l'icône ou le texte du bouton
                    const icon = button.querySelector('i');
                    if (icon) {
                        if (isVisible) {
                            icon.className = icon.className.replace('fa-chevron-up', 'fa-chevron-down');
                        } else {
                            icon.className = icon.className.replace('fa-chevron-down', 'fa-chevron-up');
                        }
                    }
                }
            });
        });
    }

    setupEventListeners() {
        // Configuration des outils de dessin
        this.setupDrawingTools();
        
        // Configuration des boutons de la toolbar
        this.setupToolbarButtons();
        
        // Configuration de la barre latérale droite
        this.setupRightSidebar();
        
        // Configuration des contrôles du soleil
        this.setupSunlightControls();
        
        // Initialiser l'affichage des calques
        this.updateLayersPanel();
    }
    
    setupToolbarButtons() {
        // Configuration des boutons de la barre d'outils
        console.log('Configuration des boutons de la barre d\'outils...');
        
        // Boutons Fichier
        const newBtn = document.getElementById('toolbar-new');
        const saveBtn = document.getElementById('toolbar-save');
        const exportBtn = document.getElementById('toolbar-export');
        const openBtn = document.getElementById('toolbar-open');
        
        if (newBtn) newBtn.addEventListener('click', () => this.app.fileManager?.newProject());
        if (saveBtn) saveBtn.addEventListener('click', () => this.app.fileManager?.saveProject());
        if (exportBtn) exportBtn.addEventListener('click', () => this.app.fileManager?.exportProject());
        
        // Boutons Vue
        const viewTopBtn = document.getElementById('toolbar-view-top');
        const viewIsoBtn = document.getElementById('toolbar-view-iso');
        
        if (viewTopBtn) viewTopBtn.addEventListener('click', () => this.app.viewManager?.setView('top'));
        if (viewIsoBtn) viewIsoBtn.addEventListener('click', () => this.app.viewManager?.setView('iso'));
        
        console.log('Boutons de la barre d\'outils configurés');
    }
    
    setupDrawingTools() {
        console.log('Configuration des outils de dessin dans la sidebar...');
        
        // Configuration des outils de la sidebar
        document.getElementById('sidebar-select')?.addEventListener('click', () => this.handleToolSelect('select'));
        document.getElementById('sidebar-polyline')?.addEventListener('click', () => this.handleToolSelect('polyline'));
        document.getElementById('sidebar-rect')?.addEventListener('click', () => this.handleToolSelect('rect'));
        document.getElementById('sidebar-circle')?.addEventListener('click', () => this.handleToolSelect('circle'));
        document.getElementById('sidebar-parallel')?.addEventListener('click', () => this.handleToolSelect('parallel'));
        document.getElementById('sidebar-trim')?.addEventListener('click', () => this.handleToolSelect('trim'));
        document.getElementById('sidebar-extend')?.addEventListener('click', () => this.handleToolSelect('extend'));
        document.getElementById('sidebar-hatch')?.addEventListener('click', () => this.handleToolSelect('hatch'));
        document.getElementById('sidebar-surface')?.addEventListener('click', () => this.handleToolSelect('surface'));
        document.getElementById('sidebar-extrude')?.addEventListener('click', () => this.handleToolSelect('extrude'));
        document.getElementById('sidebar-dimension')?.addEventListener('click', () => this.handleToolSelect('dimension'));
        
        console.log('Outils de la sidebar configurés');
    }
    
    handleToolSelect(toolName) {
        console.log(`Sélection de l'outil: ${toolName}`);
        
        // Mettre à jour l'état visuel des boutons
        this.updateToolButtons(toolName);
        
        // Déléguer au ToolManager si disponible
        if (this.app.toolManager) {
            this.app.toolManager.setTool(toolName);
        } else {
            // Fallback pour la compatibilité
            this.app.currentTool = toolName;
            if (this.app.drawingManager) {
                this.app.drawingManager.startDrawing(toolName);
            }
        }
    }
    
    updateToolButtons(activeTool) {
        // Retirer la classe active de tous les boutons d'outils
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Ajouter la classe active au bouton sélectionné
        const activeButton = document.getElementById(`sidebar-${activeTool}`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
    
    setupRightSidebar() {
        const sidebar = document.getElementById('right-sidebar');
        const viewport = document.getElementById('viewport');
        
        // Gestion des onglets
        const tabs = document.querySelectorAll('.sidebar-tab');
        const panels = document.querySelectorAll('.sidebar-panel');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanel = tab.getAttribute('data-panel');
                
                // Mettre à jour les onglets actifs
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Afficher le bon panneau
                panels.forEach(panel => {
                    if (panel.id === `${targetPanel}-panel`) {
                        panel.classList.add('active');
                        panel.style.display = 'flex';
                    } else {
                        panel.classList.remove('active');
                        panel.style.display = 'none';
                    }
                });
            });
        });
        
        // Gestion de la réduction/expansion
        const toggleButtons = document.querySelectorAll('.panel-toggle');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                viewport.classList.toggle('sidebar-collapsed');
                
                // Redimensionner le renderer
                setTimeout(() => {
                    this.app.onWindowResize();
                }, 300);
            });
        });
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
        
        // Contrôles du Nord
        this.setupNorthControls();
    }
    
    setupNorthControls() {
        console.log('Configuration des contrôles du Nord...');
        
        const northAngleSlider = document.getElementById('north-angle');
        const northAngleInput = document.getElementById('north-angle-input');
        const northAngleDisplay = document.getElementById('north-angle-display');
        const showNorthIndicator = document.getElementById('show-north-indicator');
        const directionButtons = document.querySelectorAll('.direction-btn');

        // Fonction de mise à jour de l'angle du Nord
        const updateNorthAngle = (angle) => {
            // Vérifier que l'indicateur North existe et a la méthode setAngle
            if (this.app.northIndicator && typeof this.app.northIndicator.setAngle === 'function') {
                this.app.northIndicator.setAngle(angle);
            }
            
            // Mettre à jour l'affichage
            if (northAngleDisplay) {
                northAngleDisplay.textContent = `${angle}°`;
            }
            
            // Synchroniser slider et input
            if (northAngleSlider && northAngleSlider.value != angle) {
                northAngleSlider.value = angle;
            }
            if (northAngleInput && northAngleInput.value != angle) {
                northAngleInput.value = angle;
            }
            
            // Mettre à jour immédiatement les ombres avec l'angle du Nord
            if (this.app.sunlightManager) {
                this.app.sunlightManager.northAngle = angle;
                if (typeof this.app.sunlightManager.updateSunPosition === 'function') {
                    this.app.sunlightManager.updateSunPosition();
                }
            }
        };

        // Gestionnaires d'événements
        if (northAngleSlider) {
            northAngleSlider.addEventListener('input', (e) => {
                const angle = parseInt(e.target.value);
                updateNorthAngle(angle);
            });
        }

        if (northAngleInput) {
            northAngleInput.addEventListener('change', (e) => {
                let angle = parseFloat(e.target.value);
                angle = ((angle % 360) + 360) % 360;
                e.target.value = angle;
                updateNorthAngle(angle);
            });
        }

        if (showNorthIndicator) {
            showNorthIndicator.addEventListener('change', (e) => {
                if (this.app.northIndicator) {
                    this.app.northIndicator.setVisible(e.target.checked);
                }
            });
        }

        directionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const angle = parseInt(button.getAttribute('data-angle'));
                updateNorthAngle(angle);
            });
        });
        
        console.log('Contrôles du Nord configurés');
    }
    
    setupTextureLibrary() {
        setTimeout(() => {
            this.setupTextures();
            this.setupColorPalette();
            this.setupTextureTabs();
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.app.textureApplyMode) {
                    this.cancelTextureMode();
                }
            });
            
            console.log('Bibliothèque de textures et couleurs configurée');
        }, 100);
    }
    
    setupTextures() {
        // ...existing code...
    }
    
    setupColorPalette() {
        // ...existing code...
    }
    
    setupTextureTabs() {
        // ...existing code...
    }
    
    selectTexture(element, material, type) {
        // ...existing code...
    }
    
    cancelTextureMode() {
        // ...existing code...
    }
    
    async setupElementsLibrary() {
        console.log('Configuration de la bibliothèque d\'éléments...');
        
        // Définir les éléments de construction traditionnels
        this.elements = {
            briques: {
                'Brique M50': {
                    name: 'Brique M50',
                    icon: '🧱',
                    dimensions: { x: 21.5, y: 10.2, z: 5.0 },
                    description: 'Brique M50 standard'
                },
                'Brique M90': {
                    name: 'Brique M90',
                    icon: '🧱',
                    dimensions: { x: 21.5, y: 10.2, z: 9.0 },
                    description: 'Brique M90 standard'
                }
            },
            blocs: {
                'Bloc B14': {
                    name: 'Bloc B14',
                    icon: '⬜',
                    dimensions: { x: 39, y: 19, z: 14 },
                    description: 'Bloc creux B14'
                }
            },
            linteaux: {},
            isolants: {},
            planchers: {},
            autres: {}
        };

        // Charger les modèles OBJ depuis assets/models
        await this.loadOBJModels();

        // Configurer les gestionnaires d'événements pour la bibliothèque
        this.setupElementsEventHandlers();
        
        console.log('Bibliothèque d\'éléments configurée avec OBJ');
        console.log('Éléments OBJ chargés:', this.objElements);
    }

    async loadOBJModels() {
        console.log('Début du chargement des modèles OBJ...');
        
        // Définir les répertoires à scanner et leurs catégories correspondantes
        // Inclure toutes les variantes de casse possibles
        const modelDirectories = {
            'briques': 'briques',
            'Briques': 'briques',
            'BRIQUES': 'briques',
            'blocs': 'blocs',
            'Blocs': 'blocs', 
            'BLOCS': 'blocs',
            'linteaux': 'linteaux',
            'Linteaux': 'linteaux',
            'LINTEAUX': 'linteaux',
            'isolants': 'isolants',
            'Isolants': 'isolants',
            'ISOLANTS': 'isolants',
            'planchers': 'planchers',
            'Planchers': 'planchers',
            'PLANCHERS': 'planchers',
            'plancher': 'planchers', // Variante singulier
            'Plancher': 'planchers',
            'PLANCHER': 'planchers',
            'autres': 'autres',
            'Autres': 'autres',
            'AUTRES': 'autres',
            'mobilier': 'autres',
            'Mobilier': 'autres',
            'MOBILIER': 'autres',
            'objets': 'autres',
            'Objets': 'autres',
            'OBJETS': 'autres'
        };

        // Compteur pour suivre le chargement
        let totalFilesFound = 0;

        for (const [dirName, category] of Object.entries(modelDirectories)) {
            try {
                const directoryPath = `assets/models/${dirName}`;
                console.log(`Scan du répertoire: ${directoryPath}`);
                
                const fileList = await this.getOBJFileList(directoryPath);
                console.log(`Fichiers trouvés dans ${dirName}:`, fileList);

                if (!this.objElements[category]) {
                    this.objElements[category] = {};
                }

                fileList.forEach(fileName => {
                    const elementName = this.getElementNameFromFileName(fileName);
                    const filePath = `${directoryPath}/${fileName}`;
                    
                    this.objElements[category][elementName] = {
                        name: elementName,
                        type: 'obj',
                        path: filePath,
                        category: category,
                        icon: this.getCategoryIcon(category),
                        description: `Modèle 3D: ${elementName}`,
                        dimensions: this.getDefaultDimensions(category)
                    };
                    
                    totalFilesFound++;
                    console.log(`Modèle OBJ ajouté: ${elementName} (${filePath})`);
                });

            } catch (error) {
                console.warn(`Erreur lors du scan du répertoire ${dirName}:`, error);
            }
        }

        // Fusionner les éléments OBJ avec les éléments traditionnels
        for (const [category, objElements] of Object.entries(this.objElements)) {
            if (!this.elements[category]) {
                this.elements[category] = {};
            }
            
            // Ajouter les éléments OBJ à la catégorie correspondante
            Object.assign(this.elements[category], objElements);
        }

        console.log(`Chargement des modèles OBJ terminé. ${totalFilesFound} fichiers trouvés au total.`);
        console.log('Éléments OBJ par catégorie:', this.objElements);
        console.log('Structure finale des éléments:', this.elements);
    }

    async getOBJFileList(directoryPath) {
        try {
            // Première tentative : essayer de lire le répertoire via fetch d'un fichier d'index
            const indexResponse = await fetch(`${directoryPath}/index.json`).catch(() => null);
            if (indexResponse && indexResponse.ok) {
                const fileList = await indexResponse.json();
                return fileList.filter(file => file.toLowerCase().endsWith('.obj'));
            }
        } catch (error) {
            console.log(`Pas d'index.json trouvé pour ${directoryPath}, utilisation de la détection automatique`);
        }

        // Deuxième tentative : essayer de détecter les fichiers via des tentatives de chargement
        const possibleFiles = await this.detectOBJFiles(directoryPath);
        if (possibleFiles.length > 0) {
            return possibleFiles;
        }

        // Troisième tentative : liste étendue basée sur les noms de fichiers courants
        // Inclure toutes les variantes de casse pour les chemins
        const commonOBJFiles = {
            'assets/models/briques': [
                'brique_standard.obj', 'brique_perforee.obj', 'brique_pleine.obj', 'brique_rouge.obj', 'brique_creuse.obj'
            ],
            'assets/models/Briques': [
                'brique_standard.obj', 'brique_perforee.obj', 'brique_pleine.obj', 'brique_rouge.obj', 'brique_creuse.obj'
            ],
            'assets/models/blocs': [
                'bloc_creux_14.obj', 'bloc_creux_19.obj', 'bloc_beton_cellulaire.obj', 'bloc_argex.obj', 'bloc_b14.obj', 'bloc_b19.obj'
            ],
            'assets/models/Blocs': [
                'bloc_creux_14.obj', 'bloc_creux_19.obj', 'bloc_beton_cellulaire.obj', 'bloc_argex.obj', 'bloc_b14.obj', 'bloc_b19.obj'
            ],
            'assets/models/linteaux': [
                'linteau_beton_120.obj', 'linteau_beton_140.obj', 'linteau_acier.obj', 'linteau_bois.obj', 'linteau_l120.obj', 'linteau_l140.obj'
            ],
            'assets/models/Linteaux': [
                'linteau_beton_120.obj', 'linteau_beton_140.obj', 'linteau_acier.obj', 'linteau_bois.obj', 'linteau_l120.obj', 'linteau_l140.obj'
            ],
            'assets/models/planchers': [
                'poutrelle_beton.obj', 'dalle_beton.obj', 'plancher_bois.obj', 'plancher_composite.obj', 'plancher_hourdis.obj', 'hourdis_beton.obj', 'poutrelle_precontrainte.obj', 'dalle_collaborative.obj'
            ],
            'assets/models/Planchers': [
                'poutrelle_beton.obj', 'dalle_beton.obj', 'plancher_bois.obj', 'plancher_composite.obj', 'plancher_hourdis.obj', 'hourdis_beton.obj', 'poutrelle_precontrainte.obj', 'dalle_collaborative.obj'
            ],
            'assets/models/plancher': [
                'poutrelle_beton.obj', 'dalle_beton.obj', 'plancher_bois.obj', 'plancher_composite.obj', 'plancher_hourdis.obj', 'hourdis_beton.obj', 'poutrelle_precontrainte.obj', 'dalle_collaborative.obj'
            ],
            'assets/models/Plancher': [
                'poutrelle_beton.obj', 'dalle_beton.obj', 'plancher_bois.obj', 'plancher_composite.obj', 'plancher_hourdis.obj', 'hourdis_beton.obj', 'poutrelle_precontrainte.obj', 'dalle_collaborative.obj'
            ],
            'assets/models/isolants': [
                'panneau_isolant.obj', 'rouleau_isolant.obj', 'isolant_rigide.obj', 'isolant_laine.obj'
            ],
            'assets/models/Isolants': [
                'panneau_isolant.obj', 'rouleau_isolant.obj', 'isolant_rigide.obj', 'isolant_laine.obj'
            ],
            'assets/models/autres': [
                'fenetre_standard.obj', 'porte_standard.obj', 'escalier.obj', 'cheminee.obj', 'poutre.obj', 'poteau.obj'
            ],
            'assets/models/Autres': [
                'fenetre_standard.obj', 'porte_standard.obj', 'escalier.obj', 'cheminee.obj', 'poutre.obj', 'poteau.obj'
            ]
        };

        return commonOBJFiles[directoryPath] || [];
    }

    async detectOBJFiles(directoryPath) {
        // Liste de noms de fichiers OBJ possibles à tester (incluant les variantes de casse)
        const possibleFileNames = [
            // Planchers spécifiques - variantes de casse
            'poutrelle_beton.obj', 'Poutrelle_beton.obj', 'POUTRELLE_BETON.obj',
            'dalle_beton.obj', 'Dalle_beton.obj', 'DALLE_BETON.obj',
            'plancher_bois.obj', 'Plancher_bois.obj', 'PLANCHER_BOIS.obj',
            'plancher_composite.obj', 'Plancher_composite.obj', 'PLANCHER_COMPOSITE.obj',
            'plancher_hourdis.obj', 'Plancher_hourdis.obj', 'PLANCHER_HOURDIS.obj',
            'hourdis_beton.obj', 'Hourdis_beton.obj', 'HOURDIS_BETON.obj',
            'poutrelle_precontrainte.obj', 'Poutrelle_precontrainte.obj', 'POUTRELLE_PRECONTRAINTE.obj',
            'dalle_collaborative.obj', 'Dalle_collaborative.obj', 'DALLE_COLLABORATIVE.obj',
            'plancher_osb.obj', 'Plancher_osb.obj', 'PLANCHER_OSB.obj',
            'plancher_agglomere.obj', 'Plancher_agglomere.obj', 'PLANCHER_AGGLOMERE.obj',
            'solive_bois.obj', 'Solive_bois.obj', 'SOLIVE_BOIS.obj',
            'poutre_bois.obj', 'Poutre_bois.obj', 'POUTRE_BOIS.obj',
            
            // Noms génériques possibles
            'model.obj', 'Model.obj', 'MODEL.obj',
            'object.obj', 'Object.obj', 'OBJECT.obj',
            'element.obj', 'Element.obj', 'ELEMENT.obj',
            'piece.obj', 'Piece.obj', 'PIECE.obj',
            
            // Autres catégories avec variantes de casse
            'brique.obj', 'Brique.obj', 'BRIQUE.obj',
            'brick.obj', 'Brick.obj', 'BRICK.obj',
            'bloc.obj', 'Bloc.obj', 'BLOC.obj',
            'block.obj', 'Block.obj', 'BLOCK.obj',
            'linteau.obj', 'Linteau.obj', 'LINTEAU.obj',
            'isolant.obj', 'Isolant.obj', 'ISOLANT.obj',
            'panneau.obj', 'Panneau.obj', 'PANNEAU.obj'
        ];

        const detectedFiles = [];

        for (const fileName of possibleFileNames) {
            try {
                const response = await fetch(`${directoryPath}/${fileName}`, { method: 'HEAD' });
                if (response.ok) {
                    detectedFiles.push(fileName);
                    console.log(`Fichier OBJ détecté: ${directoryPath}/${fileName}`);
                }
            } catch (error) {
                // Fichier non trouvé, continuer
            }
        }

        return detectedFiles;
    }

    async loadOBJModels() {
        console.log('Début du chargement des modèles OBJ...');
        
        // Définir les répertoires à scanner et leurs catégories correspondantes
        // Inclure toutes les variantes de casse possibles
        const modelDirectories = {
            'briques': 'briques',
            'Briques': 'briques',
            'BRIQUES': 'briques',
            'blocs': 'blocs',
            'Blocs': 'blocs', 
            'BLOCS': 'blocs',
            'linteaux': 'linteaux',
            'Linteaux': 'linteaux',
            'LINTEAUX': 'linteaux',
            'isolants': 'isolants',
            'Isolants': 'isolants',
            'ISOLANTS': 'isolants',
            'planchers': 'planchers',
            'Planchers': 'planchers',
            'PLANCHERS': 'planchers',
            'plancher': 'planchers', // Variante singulier
            'Plancher': 'planchers',
            'PLANCHER': 'planchers',
            'autres': 'autres',
            'Autres': 'autres',
            'AUTRES': 'autres',
            'mobilier': 'autres',
            'Mobilier': 'autres',
            'MOBILIER': 'autres',
            'objets': 'autres',
            'Objets': 'autres',
            'OBJETS': 'autres'
        };

        // Compteur pour suivre le chargement
        let totalFilesFound = 0;

        for (const [dirName, category] of Object.entries(modelDirectories)) {
            try {
                const directoryPath = `assets/models/${dirName}`;
                console.log(`Scan du répertoire: ${directoryPath}`);
                
                const fileList = await this.getOBJFileList(directoryPath);
                console.log(`Fichiers trouvés dans ${dirName}:`, fileList);

                if (!this.objElements[category]) {
                    this.objElements[category] = {};
                }

                fileList.forEach(fileName => {
                    const elementName = this.getElementNameFromFileName(fileName);
                    const filePath = `${directoryPath}/${fileName}`;
                    
                    this.objElements[category][elementName] = {
                        name: elementName,
                        type: 'obj',
                        path: filePath,
                        category: category,
                        icon: this.getCategoryIcon(category),
                        description: `Modèle 3D: ${elementName}`,
                        dimensions: this.getDefaultDimensions(category)
                    };
                    
                    totalFilesFound++;
                    console.log(`Modèle OBJ ajouté: ${elementName} (${filePath})`);
                });

            } catch (error) {
                console.warn(`Erreur lors du scan du répertoire ${dirName}:`, error);
            }
        }

        // Fusionner les éléments OBJ avec les éléments traditionnels
        for (const [category, objElements] of Object.entries(this.objElements)) {
            if (!this.elements[category]) {
                this.elements[category] = {};
            }
            
            // Ajouter les éléments OBJ à la catégorie correspondante
            Object.assign(this.elements[category], objElements);
        }

        console.log(`Chargement des modèles OBJ terminé. ${totalFilesFound} fichiers trouvés au total.`);
        console.log('Éléments OBJ par catégorie:', this.objElements);
        console.log('Structure finale des éléments:', this.elements);
    }

    getElementNameFromFileName(fileName) {
        return fileName
            .replace('.obj', '')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    getCategoryIcon(category) {
        const categoryIcons = {
            'briques': '🧱',
            'blocs': '⬜',
            'linteaux': '📏',
            'isolants': '🟡',
            'planchers': '🏗️',
            'autres': '📦'
        };
        return categoryIcons[category] || '📦';
    }

    getDefaultDimensions(category) {
        const defaultDimensions = {
            'briques': { x: 21.5, y: 10.2, z: 6.5 },
            'blocs': { x: 39, y: 19, z: 14 },
            'linteaux': { x: 120, y: 14, z: 7 },
            'isolants': { x: 120, y: 60, z: 10 },
            'planchers': { x: 200, y: 20, z: 16 },
            'autres': { x: 50, y: 50, z: 50 }
        };
        return defaultDimensions[category] || { x: 10, y: 10, z: 10 };
    }

    setupElementsEventHandlers() {
        console.log('Configuration des gestionnaires d\'événements...');
        
        // Gestion des onglets de catégorie
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const category = tab.dataset.category;
                console.log(`Affichage de la catégorie: ${category}`);
                this.showElementsForCategory(category);
            });
        });

        // Fermeture de la modal
        document.getElementById('close-elements-modal')?.addEventListener('click', () => {
            document.getElementById('elements-modal').style.display = 'none';
        });

        // Afficher la première catégorie par défaut
        this.showElementsForCategory('briques');
    }

    showElementsForCategory(category) {
        console.log(`Affichage des éléments pour la catégorie: ${category}`);
        const elementsGrid = document.getElementById('elements-grid');
        if (!elementsGrid) {
            console.error('elementsGrid non trouvé');
            return;
        }

        elementsGrid.innerHTML = '';

        // Récupérer les éléments de la catégorie
        const categoryElements = this.elements[category] || {};
        console.log(`Éléments trouvés pour ${category}:`, categoryElements);

        if (Object.keys(categoryElements).length === 0) {
            elementsGrid.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1 / -1;">Aucun élément dans cette catégorie</p>';
            return;
        }

        Object.entries(categoryElements).forEach(([key, element]) => {
            const elementDiv = document.createElement('div');
            elementDiv.className = 'element-item';
            elementDiv.dataset.element = key;
            elementDiv.dataset.category = category;

            const isOBJ = element.type === 'obj';
            const typeIndicator = isOBJ ? ' <span style="color: #007acc; font-size: 10px;">(3D)</span>' : '';

            elementDiv.innerHTML = `
                <div class="element-icon" style="font-size: 24px; margin-bottom: 5px;">${element.icon || '📦'}</div>
                <div class="element-name" style="font-size: 12px; font-weight: bold; margin-bottom: 2px;">${element.name}${typeIndicator}</div>
                <div class="element-description" style="font-size: 10px; color: #666; text-align: center;">${element.description || ''}</div>
            `;

            elementDiv.style.cssText = `
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                background: white;
                min-height: 100px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            `;

            elementDiv.addEventListener('mouseenter', () => {
                elementDiv.style.borderColor = '#007acc';
                elementDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            });

            elementDiv.addEventListener('mouseleave', () => {
                if (!elementDiv.classList.contains('selected')) {
                    elementDiv.style.borderColor = '#ddd';
                    elementDiv.style.boxShadow = 'none';
                }
            });

            elementDiv.addEventListener('click', () => {
                document.querySelectorAll('.element-item').forEach(item => {
                    item.classList.remove('selected');
                    item.style.borderColor = '#ddd';
                    item.style.boxShadow = 'none';
                });
                
                elementDiv.classList.add('selected');
                elementDiv.style.borderColor = '#007acc';
                elementDiv.style.boxShadow = '0 2px 8px rgba(0,122,204,0.3)';
                
                this.selectedElement = {
                    ...element,
                    key: key,
                    category: category
                };
                
                console.log('Élément sélectionné:', this.selectedElement);
                this.showElementOptions(element, key, category);
            });

            elementsGrid.appendChild(elementDiv);
        });

        console.log(`${Object.keys(categoryElements).length} éléments affichés pour ${category}`);
    }

    showElementOptions(element, key, category) {
        const optionsDiv = document.getElementById('element-options');
        const optionsContent = document.getElementById('element-options-content');
        
        if (!optionsDiv || !optionsContent) {
            console.error('Options div non trouvé');
            return;
        }

        const isOBJ = element.type === 'obj';

        optionsContent.innerHTML = `
            <div class="element-details" style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0;">${element.name}</h4>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${isOBJ ? 'Modèle 3D (OBJ)' : 'Élément paramétrique'}</p>
                ${isOBJ ? `<p style="margin: 5px 0;"><strong>Fichier:</strong> ${element.path}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Catégorie:</strong> ${category}</p>
            </div>
            <div class="element-properties">
                <h5 style="margin: 10px 0 5px 0;">Propriétés:</h5>
                <div class="property-group" style="margin-bottom: 10px;">
                    <label for="element-scale" style="display: block; margin-bottom: 2px;">Échelle:</label>
                    <input type="number" id="element-scale" min="0.1" max="10" step="0.1" value="1" style="width: 100%; padding: 4px;">
                </div>
                <div class="property-group" style="margin-bottom: 10px;">
                    <label for="element-rotation" style="display: block; margin-bottom: 2px;">Rotation (°):</label>
                    <input type="number" id="element-rotation" min="0" max="360" step="15" value="0" style="width: 100%; padding: 4px;">
                </div>
                ${isOBJ ? '' : this.getParametricOptions(element)}
            </div>
        `;

        optionsDiv.style.display = 'block';

        // Gestionnaire pour le bouton d'ajout
        const addButton = document.getElementById('add-element-to-scene');
        if (addButton) {
            // Supprimer les anciens gestionnaires
            const newButton = addButton.cloneNode(true);
            addButton.parentNode.replaceChild(newButton, addButton);
            
            newButton.addEventListener('click', () => {
                console.log('Ajout de l\'élément à la scène:', element);
                if (isOBJ) {
                    this.addOBJElementToScene(element);
                } else {
                    this.addElementToScene(element, key, category);
                }
                document.getElementById('elements-modal').style.display = 'none';
            });
        }
    }

    getParametricOptions(element) {
        return `
            <div class="property-group" style="margin-bottom: 10px;">
                <label for="element-width" style="display: block; margin-bottom: 2px;">Largeur (cm):</label>
                <input type="number" id="element-width" min="1" max="1000" value="${element.dimensions?.x || 20}" style="width: 100%; padding: 4px;">
            </div>
            <div class="property-group" style="margin-bottom: 10px;">
                <label for="element-height" style="display: block; margin-bottom: 2px;">Hauteur (cm):</label>
                <input type="number" id="element-height" min="1" max="1000" value="${element.dimensions?.y || 20}" style="width: 100%; padding: 4px;">
            </div>
            <div class="property-group" style="margin-bottom: 10px;">
                <label for="element-depth" style="display: block; margin-bottom: 2px;">Profondeur (cm):</label>
                <input type="number" id="element-depth" min="1" max="1000" value="${element.dimensions?.z || 20}" style="width: 100%; padding: 4px;">
            </div>
        `;
    }

    async addOBJElementToScene(element) {
        console.log(`Tentative d'ajout du modèle OBJ: ${element.name}`);
        
        try {
            // Vérifier si le fichier existe (simulation)
            const fileExists = await this.checkOBJFileExists(element.path);
            
            if (!fileExists) {
                console.warn(`Fichier OBJ non trouvé: ${element.path}`);
                document.getElementById('command-output').textContent = `Fichier non trouvé: ${element.name}`;
                
                // Créer un objet de substitution (cube coloré)
                this.createPlaceholderObject(element);
                return;
            }

            // Obtenir les paramètres depuis l'interface
            const scale = parseFloat(document.getElementById('element-scale')?.value || 1);
            const rotation = parseFloat(document.getElementById('element-rotation')?.value || 0);

            // Utiliser l'OBJLoader
            const loader = new this.app.OBJLoader();
            
            loader.load(
                element.path,
                (object) => {
                    this.processLoadedOBJ(object, element, scale, rotation);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100);
                    console.log(`Chargement: ${percent.toFixed(1)}%`);
                },
                (error) => {
                    console.error('Erreur lors du chargement du modèle OBJ:', error);
                    this.createPlaceholderObject(element);
                }
            );

        } catch (error) {
            console.error('Erreur lors de l\'ajout du modèle OBJ:', error);
            this.createPlaceholderObject(element);
        }
    }

    async checkOBJFileExists(path) {
        // Simulation de vérification de fichier
        // En production, vous pourriez faire une requête HEAD
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simuler que certains fichiers existent
                const existingFiles = [
                    'assets/models/briques/brique_standard.obj',
                    'assets/models/blocs/bloc_creux_14.obj'
                ];
                resolve(existingFiles.includes(path));
            }, 100);
        });
    }

    createPlaceholderObject(element) {
        console.log(`Création d'un objet de substitution pour: ${element.name}`);
        
        const scale = parseFloat(document.getElementById('element-scale')?.value || 1);
        const rotation = parseFloat(document.getElementById('element-rotation')?.value || 0);
        
        // Créer un cube coloré comme substitut
        const geometry = new this.app.THREE.BoxGeometry(
            element.dimensions.x / 10,
            element.dimensions.z / 10,
            element.dimensions.y / 10
        );
        
        const color = this.getCategoryColor(element.category);
        const material = new this.app.THREE.MeshPhongMaterial({ color: color });
        
        const mesh = new this.app.THREE.Mesh(geometry, material);
        mesh.scale.setScalar(scale);
        mesh.rotation.y = (rotation * Math.PI) / 180;
        mesh.position.set(0, 0, 0);
        
        // Métadonnées
        mesh.userData = {
            elementType: element.name,
            isConstructionElement: true,
            category: element.category,
            isPlaceholder: true,
            scale: scale,
            originalRotation: rotation
        };

        this.addObjectToScene(mesh, element);
    }

    processLoadedOBJ(object, element, scale, rotation) {
        console.log(`Traitement de l'objet OBJ chargé: ${element.name}`);
        
        // Configurer l'objet
        object.scale.setScalar(scale);
        object.rotation.y = (rotation * Math.PI) / 180;
        object.position.set(0, 0, 0);

        // Appliquer des matériaux
        object.traverse((child) => {
            if (child.isMesh) {
                if (!child.material) {
                    child.material = new this.app.THREE.MeshPhongMaterial({
                        color: this.getCategoryColor(element.category),
                        side: this.app.THREE.DoubleSide
                    });
                }
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Métadonnées
        object.userData = {
            elementType: element.name,
            isConstructionElement: true,
            category: element.category,
            objPath: element.path,
            scale: scale,
            originalRotation: rotation
        };

        this.addObjectToScene(object, element);
    }

    addObjectToScene(object, element) {
        // Ajouter à la scène
        this.app.scene.add(object);
        this.app.objects.push(object);
        
        // Ajouter au calque actuel
        if (this.app.layers && this.app.currentLayer) {
            this.app.layers[this.app.currentLayer].objects.push(object);
        }

        // Ajouter à l'historique
        this.app.addToHistory('create', { 
            elementType: element.name,
            type: element.type || 'obj',
            object: object 
        });

        console.log(`Objet ${element.name} ajouté à la scène`);
        document.getElementById('command-output').textContent = `${element.name} ajouté à la scène`;
    }

    getCategoryColor(category) {
        const colors = {
            'briques': 0x8B4513,
            'blocs': 0x808080,
            'linteaux': 0x654321,
            'isolants': 0xFFFF00,
            'planchers': 0x8B7355,
            'autres': 0x888888
        };
        return colors[category] || 0x888888;
    }

    // ...existing code...
}

// ...existing code...