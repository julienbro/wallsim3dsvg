// Import Three.js et modules
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { DrawingManager } from '../managers/DrawingManager.js';
import { ExtrusionManager } from '../managers/ExtrusionManager.js';
import { SnapManager } from '../managers/SnapManager.js';
import { ToolManager } from '../managers/ToolManager.js';
import { UIManager } from '../managers/UIManager.js';
import { FileManager } from '../managers/FileManager.js';
import { ViewManager } from '../managers/ViewManager.js';
import { SunlightManager } from '../managers/SunlightManager.js'; // Add this import
import { NorthIndicator } from '../ui/UIManager.js';

// WebCAD Application
export class WebCAD {
    constructor(container) {
        this.container = document.getElementById(container) || document.getElementById('viewport');
        this.THREE = THREE; // Exposer THREE globalement pour l'accès depuis d'autres modules
        
        // Rendre OBJLoader disponible sans modifier l'objet THREE
        this.OBJLoader = OBJLoader;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.transformControls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.objects = [];
        this.selectedObject = null;
        this.selectedObjects = []; // Add array to track multiple selections
        this.currentTool = 'select';
        this.is3DMode = false;
        this.gridHelper = null;
        this.snapEnabled = true;
        this.gridSize = 1;
        
        // Système d'historique simplifié
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // Presse-papier pour copier-coller
        this.clipboard = null;
        
        // Initialiser les layers
        this.layers = [
            { name: 'Calque 0', visible: true, objects: [] }
        ];
        this.currentLayer = 0;
        
        this.init();
        this.initManagers();
        // Initialiser l'indicateur nord
        this.northIndicator = new NorthIndicator(this);
        this.setupEventListeners();
        this.animate();
        
        console.log('WebCAD initialized');
    }
    
    init() {
        // Créer la scène
        this.scene = new THREE.Scene();
        
        // Créer un ciel avec dégradé
        this.createSky();
        
        // Créer le plateau de travail
        this.createWorkPlane();
        
        // Configurer la caméra
        const container = document.getElementById('viewport');
        const aspect = container.clientWidth / container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 10000);
        // Positionner la caméra plus bas pour voir plus de ciel
        this.camera.position.set(60, -60, 30);
        this.camera.up.set(0, 0, 1); // Z est vers le haut
        
        // Configurer le renderer avec antialiasing amélioré
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // Activer les ombres dès le début
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = true;
        container.appendChild(this.renderer.domElement);
        
        // Ajouter les contrôles
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Ajouter TransformControls
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.controls.enabled = !event.value;
        });
        this.scene.add(this.transformControls);
        
        // Configurer l'éclairage avec ombres
        this.setupLighting();
        
        // Créer le gestionnaire de lumière solaire
        this.createSunlightManager();
        
        // Ajouter les axes étendus jusqu'aux bords du plateau
        this.createExtendedAxes();
    }
    
    initManagers() {
        // Initialiser les gestionnaires
        this.toolManager = new ToolManager(this);
        this.drawingManager = new DrawingManager(this);
        this.snapManager = new SnapManager(this);
        this.extrusionManager = new ExtrusionManager(this);
        this.viewManager = new ViewManager(this);
        this.fileManager = new FileManager(this);
        this.uiManager = new UIManager(this);

        // Ensure specific data fields are empty after UIManager initialization.
        this.ensureDataFieldsAreEmpty();
        
        // Ajouter les gestionnaires d'événements pour les raccourcis clavier d'import
        this.setupImportKeyboardShortcuts();
    }

    setupImportKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+I pour importer COLLADA
            if (event.ctrlKey && event.key === 'i') {
                event.preventDefault();
                this.fileManager.importColladaFile().catch(error => {
                    console.error('Erreur lors de l\'importation via raccourci:', error);
                });
            }
            // Ctrl+Shift+G pour importer GLTF/GLB
            if (event.ctrlKey && event.shiftKey && event.key === 'G') {
                event.preventDefault();
                this.fileManager.importGLTFFile().catch(error => {
                    console.error('Erreur lors de l\'importation GLTF via raccourci:', error);
                });
            }
            // Ctrl+Shift+S pour importer STL
            if (event.ctrlKey && event.shiftKey && event.key === 'S') {
                event.preventDefault();
                this.fileManager.importSTLFile().catch(error => {
                    console.error('Erreur lors de l\'importation STL via raccourci:', error);
                });
            }
            // Ctrl+Shift+K pour importer SKP (affiche les instructions)
            if (event.ctrlKey && event.shiftKey && event.key === 'K') {
                event.preventDefault();
                this.fileManager.showSKPImportInfo();
            }
        });
    }

    ensureDataFieldsAreEmpty() {
        const designerField = document.getElementById('project-designer');
        if (designerField) {
            designerField.value = '';
        }

        const descriptionField = document.getElementById('project-description');
        if (descriptionField) {
            descriptionField.value = '';
        }
        // console.log("Data tab fields 'project-designer' and 'project-description' set to empty.");
    }
    
    createSky() {
        // Créer un shader pour le dégradé du ciel
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            
            void main() {
                float h = normalize(vWorldPosition + offset).z;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `;
        
        const uniforms = {
            topColor: { value: new THREE.Color(0x87CEEB) }, // Bleu ciel
            bottomColor: { value: new THREE.Color(0xFFFFFF) }, // Blanc
            offset: { value: 33 },
            exponent: { value: 0.6 }
        };
        
        const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);
    }
    
    createWorkPlane() {
        // Créer un grand plan pour le plateau de travail
        const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
        // Utiliser MeshLambertMaterial avec émissivité pour un blanc lumineux qui reçoit des ombres
        const planeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.4,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.z = -0.1;
        plane.renderOrder = -2;
        plane.receiveShadow = true; // Le plateau reçoit les ombres
        this.scene.add(plane);
        
        // Ne plus créer de grille
        this.gridHelper = null;
    }
    
    setupEventListeners() {
        // Redimensionnement
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Souris
        this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // Déléguer au SelectionManager si disponible
            if (this.selectionManager && typeof this.selectionManager.handleRightClick === 'function') {
                this.selectionManager.handleRightClick(e);
            }
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    onMouseClick(event) {
        // Gérer le mode texture/couleur
        if (this.textureApplyMode && this.selectedTexture) {
            const intersects = this.getIntersections(event);
            if (intersects.length > 0) {
                const object = intersects[0].object;
                
                if (this.selectedTextureType === 'color') {
                    this.applyColorToObject(object, this.selectedTexture);
                } else {
                    this.applyTextureToObject(object, this.selectedTexture);
                }

                // Après avoir appliqué la texture/couleur, repasser en mode sélection
                this.textureApplyMode = false;
                this.selectedTexture = null;
                if (this.toolManager) {
                    this.toolManager.setTool('select');
                    // Restaurer le curseur par défaut
                    this.renderer.domElement.style.cursor = 'default';
                }
            }
            return;
        }
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        if (this.currentTool === 'select') {
            const intersects = this.getIntersections(event);
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                // Si l'objet cliqué fait partie d'un groupe, sélectionner le groupe entier
                if (clickedObject.parent instanceof THREE.Group) {
                    this.selectObject(clickedObject.parent);
                } else {
                    this.selectObject(clickedObject);
                }
            } else {
                this.deselectAll();
            }
        } else if (this.currentTool === 'extrude') {
            this.extrusionManager.handleExtrusion(event);
        } else if (['parallel', 'trim', 'extend', 'dimension'].includes(this.currentTool)) {
            // Pour les nouveaux outils, passer directement le point 3D
            let point = this.getWorldPoint(event);
            if (point) {
                // Appliquer l'accrochage
                point = this.snapManager.checkSnapping(point, event);
                this.drawingManager.handleDrawing(point);
            }
        } else {
            // Gérer le dessin multi-points pour les autres outils
            let point = this.getWorldPoint(event);
            if (point) {
                // Appliquer l'accrochage
                point = this.snapManager.checkSnapping(point, event);
                this.drawingManager.handleDrawing(point);
            }
        }
    }
    
    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        
        // Mettre à jour les coordonnées
        let worldPoint = this.getWorldPoint(event);
        
        if (worldPoint) {
            // D'abord vérifier l'accrochage aux points spécifiques (prioritaire)
            worldPoint = this.snapManager.checkSnapping(worldPoint, event);
            this.uiManager.updateCoordinates(worldPoint);
            
            // Mettre à jour l'aperçu pendant le dessin
            // Simplification de la condition : si un outil de dessin est actif, on tente de mettre à jour l'aperçu.
            // Le DrawingManager et l'outil spécifique détermineront si un aperçu est réellement nécessaire.
            if (this.drawingManager && 
                this.currentTool !== 'select' && 
                this.currentTool !== 'extrude' &&
                this.currentTool !== null) { // Assurez-vous qu'un outil est défini
                this.drawingManager.updateDrawingPreview(worldPoint, event);
            }
            
            // Mettre à jour l'aperçu pendant l'extrusion
            if (this.extrusionManager.isExtruding) {
                this.extrusionManager.updateExtrusionPreview(event);
            }
        }
    }
    
    getWorldPoint(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const point = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(planeZ, point);
        
        return point;
    }
    
    getIntersections(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // Obtenir toutes les intersections avec gestion des groupes
        const intersects = raycaster.intersectObjects(this.objects, true);
        
        return intersects.map(intersect => {
            let parent = intersect.object;
            while (parent.parent && !(parent.parent instanceof THREE.Scene)) {
                parent = parent.parent;
            }
            return { ...intersect, object: parent };
        });
    }
    
    selectObject(object) {
        // Check if shift is held for multi-select
        if (!this.drawingManager.shiftPressed) {
            this.deselectAll();
        }

        this.selectedObject = object;
        object.userData.isSelected = true;
        this.selectedObjects.push(object);
        this.transformControls.attach(object);
        
        // Highlight le groupe et tous ses enfants
        if (object instanceof THREE.Group) {
            // Highlight chaque enfant du groupe individuellement
            object.children.forEach(child => {
                this.highlightObject(child);
                child.userData.isSelected = true;
            });
        } else {
            this.highlightObject(object);
        }

        if (this.uiManager) {
            this.uiManager.updatePropertiesPanel(object);
        }
    }
    
    deselectAll() {
        this.selectedObjects.forEach(obj => {
            if (obj instanceof THREE.Group) {
                // Unhighlight chaque enfant du groupe
                obj.children.forEach(child => {
                    this.unhighlightObject(child);
                    child.userData.isSelected = false;
                });
            } else {
                this.unhighlightObject(obj);
            }
            obj.userData.isSelected = false;
        });
        
        this.selectedObjects = [];
        this.selectedObject = null;
        this.transformControls.detach();
        
        if (this.uiManager) {
            this.uiManager.updatePropertiesPanel(null);
        }
    }
    
    highlightObject(object) {
        // Si c'est un groupe, mettre en surbrillance tous ses enfants qui ont une géométrie
        if (object instanceof THREE.Group) {
            let hasHighlightableChildren = false;
            object.traverse(child => {
                if (child.isMesh && child.geometry) {
                    hasHighlightableChildren = true;
                    // Sauvegarder les matériaux originaux
                    if (!child.userData.originalMaterial && child.material) {
                        child.userData.originalMaterial = child.material.clone();
                        child.userData.originalOpacity = child.material.opacity;
                        child.userData.originalTransparent = child.material.transparent;
                    }

                    // Créer un contour pour les meshes
                    const outlineGeometry = child.geometry.clone();
                    const outlineMaterial = new THREE.MeshBasicMaterial({
                        color: 0x0066ff,
                        side: THREE.BackSide,
                        transparent: true,
                        opacity: 0.6
                    });
                    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
                    outline.scale.multiplyScalar(1.05);
                    outline.name = 'highlight-outline';
                    outline.renderOrder = child.renderOrder - 1;
                    child.add(outline);
                } else if (child instanceof THREE.Line) {
                    // Pour les lignes, changer la couleur
                    child.userData.originalMaterial = child.material.clone();
                    child.material = new THREE.LineBasicMaterial({
                        color: 0x0066ff,
                        linewidth: 4,
                        opacity: 1,
                        transparent: false
                    });
                }
            });
            
            if (!hasHighlightableChildren) {
                console.log('Groupe sans éléments surlignables ignoré:', object);
            }
            return;
        }

        // Pour un objet individuel
        if (object.isMesh && object.geometry) {
            // Sauvegarder le matériau original
            if (!object.userData.originalMaterial) {
                object.userData.originalMaterial = object.material.clone();
                object.userData.originalOpacity = object.material.opacity;
                object.userData.originalTransparent = object.material.transparent;
            }

            // Créer un contour pour le mesh
            const outlineGeometry = object.geometry.clone();
            const outlineMaterial = new THREE.MeshBasicMaterial({
                color: 0x0066ff,
                side: THREE.BackSide,
                transparent: true,
                opacity: 0.6
            });
            const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
            outline.scale.multiplyScalar(1.05);
            outline.name = 'highlight-outline';
            outline.renderOrder = object.renderOrder - 1;
            object.add(outline);
        } else if (object instanceof THREE.Line) {
            // Pour les lignes, changer la couleur
            if (!object.userData.originalMaterial) {
                object.userData.originalMaterial = object.material.clone();
            }
            object.material = new THREE.LineBasicMaterial({
                color: 0x0066ff,
                linewidth: 4,
                opacity: 1,
                transparent: false
            });
        } else {
            console.log('Objet non surlignables ignoré:', object);
        }
    }
    
    unhighlightObject(object) {
        // Si c'est un groupe, parcourir tous ses enfants
        if (object instanceof THREE.Group) {
            object.traverse(child => {
                // Retirer le contour de surbrillance
                const outline = child.getObjectByName('highlight-outline');
                if (outline) {
                    child.remove(outline);
                    if (outline.geometry) outline.geometry.dispose();
                    if (outline.material) outline.material.dispose();
                }
                
                // Restaurer le matériau original
                if (child.userData.originalMaterial) {
                    child.material = child.userData.originalMaterial;
                    child.material.opacity = child.userData.originalOpacity;
                    child.material.transparent = child.userData.originalTransparent;
                    delete child.userData.originalMaterial;
                    delete child.userData.originalOpacity;
                    delete child.userData.originalTransparent;
                }
            });
            return;
        }

        // Pour un objet individuel
        if (object.isMesh || object instanceof THREE.Line) {
            // Retirer le contour de surbrillance
            const outline = object.getObjectByName('highlight-outline');
            if (outline) {
                object.remove(outline);
                if (outline.geometry) outline.geometry.dispose();
                if (outline.material) outline.material.dispose();
            }
            
            // Restaurer le matériau original
            if (object.userData.originalMaterial) {
                object.material = object.userData.originalMaterial;
                object.material.opacity = object.userData.originalOpacity;
                object.material.transparent = object.userData.originalTransparent;
                delete object.userData.originalMaterial;
                delete object.userData.originalOpacity;
                delete object.userData.originalTransparent;
            }
        }
    }
    
    addToHistory(action, object, oldData = null) {
        // Supprimer les éléments futurs si on est au milieu de l'historique
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        const historyEntry = {
            action: action,
            object: object,
            objectId: object.uuid,
            timestamp: Date.now(),
            oldData: oldData
        };
        
        this.history.push(historyEntry);
        this.historyIndex++;
        
        // Limiter la taille de l'historique
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
        
        console.log(`Historique ajouté: ${action}, index: ${this.historyIndex}`);
    }
    
    undo() {
        console.log(`Tentative d'annulation, index: ${this.historyIndex}, historique: ${this.history.length}`);
        
        if (this.historyIndex >= 0) {
            const entry = this.history[this.historyIndex];
            console.log(`Annulation de: ${entry.action}`);
            
            switch(entry.action) {
                case 'create':
                    // Supprimer l'objet créé
                    const objToRemove = this.objects.find(obj => obj.uuid === entry.objectId);
                    if (objToRemove) {
                        this.scene.remove(objToRemove);
                        this.objects = this.objects.filter(obj => obj.uuid !== entry.objectId);
                        
                        // Supprimer des calques
                        this.layers.forEach(layer => {
                            layer.objects = layer.objects.filter(obj => obj.uuid !== entry.objectId);
                        });
                        
                        // Désélectionner si c'était l'objet sélectionné
                        if (this.selectedObject && this.selectedObject.uuid === entry.objectId) {
                            this.deselectAll();
                        }
                        
                        console.log('Objet supprimé par annulation');
                    }
                    break;
                    
                case 'delete':
                    // Pour l'instant, on ne peut pas recréer l'objet supprimé
                    console.log('Annulation de suppression non implémentée');
                    break;
            }
            
            this.historyIndex--;
            document.getElementById('command-output').textContent = `Annulé: ${entry.action}`;
            
            if (this.uiManager) {
                this.uiManager.updateHistoryPanel();
            }
        } else {
            document.getElementById('command-output').textContent = 'Rien à annuler';
            console.log('Rien à annuler');
        }
    }
    
    redo() {
        console.log(`Tentative de rétablissement, index: ${this.historyIndex}, historique: ${this.history.length}`);
        
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const entry = this.history[this.historyIndex];
            console.log(`Rétablir: ${entry.action}`);
            
            switch(entry.action) {
                case 'create':
                    // Recréer l'objet qui avait été supprimé par undo
                    if (entry.object && !this.objects.find(obj => obj.uuid === entry.objectId)) {
                        this.scene.add(entry.object);
                        this.objects.push(entry.object);
                        this.layers[this.currentLayer].objects.push(entry.object);
                        console.log('Objet recréé par rétablissement');
                    }
                    break;
                    
                case 'delete':
                    // Supprimer à nouveau l'objet
                    const objToRemove = this.objects.find(obj => obj.uuid === entry.objectId);
                    if (objToRemove) {
                        this.scene.remove(objToRemove);
                        this.objects = this.objects.filter(obj => obj.uuid !== entry.objectId);
                        this.layers.forEach(layer => {
                            layer.objects = layer.objects.filter(obj => obj.uuid !== entry.objectId);
                        });
                        
                        if (this.selectedObject && this.selectedObject.uuid === entry.objectId) {
                            this.deselectAll();
                        }
                        console.log('Objet supprimé par rétablissement');
                    }
                    break;
            }
            
            document.getElementById('command-output').textContent = `Rétabli: ${entry.action}`;
            
            if (this.uiManager) {
                this.uiManager.updateHistoryPanel();
            }
        } else {
            document.getElementById('command-output').textContent = 'Rien à rétablir';
            console.log('Rien à rétablir');
        }
    }
    
    deleteSelected() {
        if (this.selectedObject) {
            console.log('Suppression de l\'objet sélectionné');
            
            // Vérifier si c'est un rectangle (PlaneGeometry)
            if (
                this.selectedObject instanceof THREE.Mesh &&
                this.selectedObject.geometry instanceof THREE.PlaneGeometry
            ) {
                console.log('Rectangle détecté, affichage du menu de suppression');
                this.showRectangleDeleteOptions();
                return;
            }
            
            // Ajouter à l'historique AVANT la suppression
            this.addToHistory('delete', this.selectedObject);
            
            // Supprimer de la scène
            this.scene.remove(this.selectedObject);
            
            // Supprimer des tableaux
            this.objects = this.objects.filter(obj => obj.uuid !== this.selectedObject.uuid);
            this.layers.forEach(layer => {
                layer.objects = layer.objects.filter(obj => obj.uuid !== this.selectedObject.uuid);
            });
            
            // Détacher les contrôles
            this.transformControls.detach();
            this.selectedObject = null;
            
            // Mettre à jour l'interface
            if (this.uiManager) {
                this.uiManager.updatePropertiesPanel(null);
            }
            
            document.getElementById('command-output').textContent = 'Objet supprimé';
            console.log('Objet supprimé avec succès');
        } else {
            document.getElementById('command-output').textContent = 'Aucun objet sélectionné';
        }
    }

    showRectangleDeleteOptions() {
        console.log('Affichage du dialogue de suppression');
        
        // Supprimer les dialogues existants
        const existingDialog = document.querySelector('.rectangle-delete-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        const dialog = document.createElement('div');
        dialog.className = 'rectangle-delete-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            min-width: 300px;
        `;
        
        dialog.innerHTML = `
            <div style="margin-bottom: 15px; font-weight: bold; text-align: center; font-size: 16px;">
                Supprimer le rectangle
            </div>
            <div style="margin-bottom: 15px; color: #666; text-align: center;">
                Comment souhaitez-vous supprimer ce rectangle ?
            </div>
            <div style="text-align: center;">
                <button id="delete-surface-only-btn" style="
                    background: #28a745; color: white; border: none; 
                    padding: 12px 20px; border-radius: 4px; margin: 8px 0;
                    cursor: pointer; display: block; width: 100%; font-size: 14px;">
                    🔲 Supprimer la surface (garder les contours)
                </button>
                <button id="delete-completely-btn" style="
                    background: #dc3545; color: white; border: none; 
                    padding: 12px 20px; border-radius: 4px; margin: 8px 0;
                    cursor: pointer; display: block; width: 100%; font-size: 14px;">
                    🗑️ Supprimer complètement
                </button>
                <button id="cancel-delete-btn" style="
                    background: #6c757d; color: white; border: none; 
                    padding: 12px 20px; border-radius: 4px; margin: 8px 0;
                    cursor: pointer; display: block; width: 100%; font-size: 14px;">
                    ❌ Annuler
                </button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        console.log('Dialogue ajouté au DOM');
        
        // Gestionnaires d'événements
        document.getElementById('delete-surface-only-btn').addEventListener('click', () => {
            console.log('Suppression surface seulement');
            this.removeRectangleSurfaceKeepEdges();
            document.body.removeChild(dialog);
        });
        
        document.getElementById('delete-completely-btn').addEventListener('click', () => {
            console.log('Suppression complète');
            this.deleteSelectedCompletely();
            document.body.removeChild(dialog);
        });
        
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            console.log('Annulation suppression');
            document.body.removeChild(dialog);
            document.getElementById('command-output').textContent = 'Suppression annulée';
        });
    }

    removeRectangleSurfaceKeepEdges() {
        if (!this.selectedObject) return;

        const rectMesh = this.selectedObject;
        
        // Supprimer uniquement la géométrie de la surface
        if (rectMesh.geometry) {
            rectMesh.geometry.dispose();
            rectMesh.geometry = null;
        }
        
        // Restaurer le matériau d'origine s'il existe
        if (rectMesh.userData.originalMaterial) {
            rectMesh.material = rectMesh.userData.originalMaterial;
            delete rectMesh.userData.originalMaterial;
        }
        
        // Mettre à jour l'interface
        if (this.uiManager) {
            this.uiManager.updatePropertiesPanel(rectMesh);
        }
        
        document.getElementById('command-output').textContent = 'Surface du rectangle supprimée, contours conservés';
        console.log('Surface du rectangle supprimée, contours conservés');
    }

    deleteSelectedCompletely() {
        if (!this.selectedObject) return;

        // Ajouter à l'historique AVANT la suppression
        this.addToHistory('delete', this.selectedObject);
        
        // Supprimer de la scène
        this.scene.remove(this.selectedObject);
        
        // Supprimer des tableaux
        this.objects = this.objects.filter(obj => obj.uuid !== this.selectedObject.uuid);
        this.layers.forEach(layer => {
            layer.objects = layer.objects.filter(obj => obj.uuid !== this.selectedObject.uuid);
        });
        
        // Détacher les contrôles
        this.transformControls.detach();
        this.selectedObject = null;
        
        // Mettre à jour l'interface
        if (this.uiManager) {
            this.uiManager.updatePropertiesPanel(null);
        }
        
        document.getElementById('command-output').textContent = 'Objet supprimé complètement';
        console.log('Objet supprimé complètement');
    }
    
    handleKeyboard(event) {
        // If an input field is focused, don't process global shortcuts
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
            if (event.key !== 'Escape') {
                return;
            }
        }

        this.drawingManager.shiftPressed = event.shiftKey;
        
        // Pass keyboard events to DrawingManager safely
        if (this.drawingManager && typeof this.drawingManager.handleKeyboard === 'function') {
            try {
                this.drawingManager.handleKeyboard(event);
            } catch (error) {
                console.warn('Error in DrawingManager.handleKeyboard:', error);
            }
        }
        
        if (event.key === 'Escape') {
            if (this.drawingManager && this.drawingManager.isDrawing) {
                this.drawingManager.cancelDrawing();
            } else if (this.extrusionManager && this.extrusionManager.isExtruding) {
                this.extrusionManager.cancelExtrusion();
            } else if (this.currentTool === 'parallel' && this.drawingManager && this.drawingManager.parallelTool) {
                this.drawingManager.parallelTool.cancel();
            } else {
                this.deselectAll();
            }
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
            if (this.selectedObject) {
                if (this.uiManager && typeof this.uiManager.deleteSelected === 'function') {
                    this.uiManager.deleteSelected();
                } else {
                    this.deleteSelected();
                }
            }
        } else if (event.key === 'z' && event.ctrlKey) {
            event.preventDefault();
            this.undo();
        } else if (event.key === 'y' && event.ctrlKey) {
            event.preventDefault();
            this.redo();
        } else if (event.key === 'c' && event.ctrlKey) {
            event.preventDefault();
            this.copySelected();
        } else if (event.key === 'v' && event.ctrlKey) {
            event.preventDefault();
            this.pasteFromClipboard();
        } else if (event.key === 'x' && event.ctrlKey) {
            event.preventDefault();
            this.cutSelected();
        } else if (event.key === 'o' || event.key === 'O') {
            // Raccourci pour activer le mode orbit
            this.activateOrbitMode();
        } else if (event.key === 'g' && event.ctrlKey) {
            event.preventDefault();
            const selectedObjects = this.objects.filter(obj => obj.userData.isSelected);
            this.createGroup(selectedObjects);
        } else if (event.key === 'e' && event.ctrlKey) {
            event.preventDefault();
            if (this.selectedObject instanceof THREE.Group) {
                this.explodeGroup(this.selectedObject);
            }
        }
        
        // Déléguer aux gestionnaires safely
        if (this.snapManager && typeof this.snapManager.handleKeyboard === 'function') {
            this.snapManager.handleKeyboard(event);
        }
    }
    
    copySelected() {
        if (this.selectedObject) {
            // Cloner l'objet sélectionné
            this.clipboard = this.cloneObject(this.selectedObject);
            document.getElementById('command-output').textContent = 'Objet copié dans le presse-papier';
            console.log('Objet copié');
        } else {
            document.getElementById('command-output').textContent = 'Aucun objet sélectionné à copier';
        }
    }
    
    cutSelected() {
        if (this.selectedObject) {
            // Copier puis supprimer
            this.clipboard = this.cloneObject(this.selectedObject);
            this.deleteSelected();
            document.getElementById('command-output').textContent = 'Objet coupé';
            console.log('Objet coupé');
        } else {
            document.getElementById('command-output').textContent = 'Aucun objet sélectionné à couper';
        }
    }
    
    pasteFromClipboard() {
        if (this.clipboard) {
            // Cloner l'objet du presse-papier
            const newObject = this.cloneObject(this.clipboard);
            
            // Décaler légèrement la position pour éviter la superposition
            newObject.position.x += 5;
            newObject.position.y += 5;
            
            // Ajouter à la scène
            this.scene.add(newObject);
            this.objects.push(newObject);
            this.layers[this.currentLayer].objects.push(newObject);
            
            // Ajouter à l'historique
            this.addToHistory('create', newObject);
            
            // Sélectionner le nouvel objet
            this.selectObject(newObject);
            
            document.getElementById('command-output').textContent = 'Objet collé';
            console.log('Objet collé');
            
            if (this.uiManager) {
                this.uiManager.updateHistoryPanel();
            }
        } else {
            document.getElementById('command-output').textContent = 'Presse-papier vide';
        }
    }
    
    cloneObject(object) {
        try {
            // Cloner la géométrie
            const clonedGeometry = object.geometry.clone();
            
            // Cloner le matériau
            const clonedMaterial = object.material.clone();
            
            // Créer le nouvel objet
            let clonedObject;
            if (object instanceof THREE.Line) {
                clonedObject = new THREE.Line(clonedGeometry, clonedMaterial);
            } else if (object instanceof THREE.Mesh) {
                clonedObject = new THREE.Mesh(clonedGeometry, clonedMaterial);
            } else {
                console.warn('Type d\'objet non supporté pour le clonage');
                return null;
            }
            
            // Copier les propriétés de transformation
            clonedObject.position.copy(object.position);
            clonedObject.rotation.copy(object.rotation);
            clonedObject.scale.copy(object.scale);
            clonedObject.renderOrder = object.renderOrder;
            
            // Copier les données utilisateur
            if (object.userData) {
                clonedObject.userData = JSON.parse(JSON.stringify(object.userData));
            }
            
            // Cloner les enfants (comme les arêtes)
            object.children.forEach(child => {
                if (child instanceof THREE.LineSegments) {
                    const childClone = new THREE.LineSegments(
                        child.geometry.clone(),
                        child.material.clone()
                    );
                    childClone.renderOrder = child.renderOrder;
                    clonedObject.add(childClone);
                }
            });
            
            return clonedObject;
        } catch (error) {
            console.error('Erreur lors du clonage:', error);
            return null;
        }
    }
    
    activateOrbitMode() {
        // Activer les contrôles d'orbite
        this.controls.enabled = true;
        this.controls.enableRotate = true;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        
        // Passer en mode sélection pour libérer les autres outils
        this.toolManager.setTool('select');
        
        document.getElementById('command-output').textContent = 'Mode Orbit activé - Utilisez la souris pour naviguer dans la vue 3D';
    }
    
    onWindowResize() {
        const container = document.getElementById('viewport');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    createExtendedAxes() {
        // Créer des axes qui s'étendent sur toute la longueur du plateau (1000x1000)
        const axisLength = 500; // Demi-longueur du plateau
        
        // Axe X (Rouge) - sur le plateau à Z = 0
        const xPoints = [
            new THREE.Vector3(-axisLength, 0, 0),
            new THREE.Vector3(axisLength, 0, 0)
        ];
        const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints);
        const xMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            linewidth: 2,
            opacity: 0.8,
            transparent: true
        });
        const xAxis = new THREE.Line(xGeometry, xMaterial);
        xAxis.renderOrder = 100;
        this.scene.add(xAxis);
        
        // Axe Y (Vert) - sur le plateau à Z = 0
        const yPoints = [
            new THREE.Vector3(0, -axisLength, 0),
            new THREE.Vector3(0, axisLength, 0)
        ];
        const yGeometry = new THREE.BufferGeometry().setFromPoints(yPoints);
        const yMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff00,
            linewidth: 2,
            opacity: 0.8,
            transparent: true
        });
        const yAxis = new THREE.Line(yGeometry, yMaterial);
        yAxis.renderOrder = 100;
        this.scene.add(yAxis);
        
        // Axe Z (Bleu) - vertical, commence exactement à l'origine
        const zPoints = [
            new THREE.Vector3(0, 0, 0), // Commence à l'origine
            new THREE.Vector3(0, 0, 200) // 2 mètres de haut
        ];
        const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints);
        const zMaterial = new THREE.LineBasicMaterial({ 
            color: 0x0000ff,
            linewidth: 2,
            opacity: 0.8,
            transparent: true
        });
        const zAxis = new THREE.Line(zGeometry, zMaterial);
        zAxis.renderOrder = 100;
        this.scene.add(zAxis);
    }
    
    setupLighting() {
        // Lumière ambiante très forte pour des surfaces blanches
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
        this.scene.add(ambientLight);

        // Stocker directionalLight comme propriété de l'instance
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        this.directionalLight.position.set(50, 100, 75);
        this.directionalLight.castShadow = true;
        
        // Configuration détaillée des ombres
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(this.directionalLight);
        
        // Ajouter une cible pour la lumière directionnelle
        const lightTarget = new THREE.Object3D();
        lightTarget.position.set(0, 0, 0);
        this.scene.add(lightTarget);
        this.directionalLight.target = lightTarget;
        
        // Lumière hémisphérique blanche
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
        this.scene.add(hemisphereLight);

        console.log("Lighting setup complete with shadows enabled.");
    }

    createSunlightManager() {
        console.log('Creating SunlightManager...');
        if (typeof SunlightManager !== 'undefined') {
            this.sunlightManager = new SunlightManager(this);
            this.sunlightManager.createSunHelper();
            console.log('SunlightManager created successfully');
        } else {
            console.error('SunlightManager class is not defined.');
        }
    }
    
    calculateSunPosition(month, hour, latitude) {
        // Calcul simplifié de la position du soleil
        // Jour de l'année approximatif
        const dayOfYear = month * 30.5 - 15;
        
        // Déclinaison solaire
        const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
        
        // Angle horaire
        const hourAngle = 15 * (hour - 12);
        
        // Élévation
        const latRad = latitude * Math.PI / 180;
        const declRad = declination * Math.PI / 180;
        const hourRad = hourAngle * Math.PI / 180;
        
        const elevation = Math.asin(
            Math.sin(latRad) * Math.sin(declRad) +
            Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourRad)
        ) * 180 / Math.PI;
        
        // Azimut
        const azimuth = Math.atan2(
            -Math.sin(hourRad),
            Math.tan(declRad) * Math.cos(latRad) - Math.sin(latRad) * Math.cos(hourRad)
        ) * 180 / Math.PI + 180;
        
        return { azimuth, elevation: Math.max(0, elevation) };
    }
    
    updateLayerVisibility(layerIndex) {
        const layer = this.layers[layerIndex];
        if (layer) {
            layer.objects.forEach(obj => {
                obj.visible = layer.visible;
            });
        }
    }
    
    deleteLayer(index) {
        if (index === 0) return; // Ne pas supprimer le calque 0
        
        // Déplacer les objets vers le calque 0
        const layer = this.layers[index];
        if (layer) {
            layer.objects.forEach(obj => {
                this.layers[0].objects.push(obj);
            });
        }
        
        // Supprimer le calque
        this.layers.splice(index, 1);
        
        // Ajuster le calque actuel si nécessaire
        if (this.currentLayer >= this.layers.length) {
            this.currentLayer = this.layers.length - 1;
        }
    }
    
    async loadModules() {
        try {
            console.log('Loading modules...');
            
            // Load core modules that exist
            const modulePromises = [
                import('../managers/UIManager.js').then(module => {
                    this.uiManager = new module.UIManager(this);
                    console.log('UIManager loaded');
                }).catch(err => console.warn('UIManager not found:', err)),
                
                import('../managers/FileManager.js').then(module => {
                    this.fileManager = new module.FileManager(this);
                    console.log('FileManager loaded');
                }).catch(err => console.warn('FileManager not found:', err)),
                
                import('../managers/ViewManager.js').then(module => {
                    this.viewManager = new module.ViewManager(this);
                    console.log('ViewManager loaded');
                }).catch(err => console.warn('ViewManager not found:', err)),
                
                import('../managers/DrawingManager.js').then(module => {
                    this.drawingManager = new module.DrawingManager(this);
                    console.log('DrawingManager loaded');
                }).catch(err => console.warn('DrawingManager not found:', err)),
                
                import('../managers/SnapManager.js').then(module => {
                    this.snapManager = new module.SnapManager(this);
                    console.log('SnapManager loaded');
                }).catch(err => console.warn('SnapManager not found:', err)),
                
                import('../managers/ToolManager.js').then(module => {
                    this.toolManager = new module.ToolManager(this);
                    console.log('ToolManager loaded');
                }).catch(err => console.warn('ToolManager not found:', err))
            ];

            // Wait for all modules to load (or fail gracefully)
            await Promise.allSettled(modulePromises);
            
            console.log('Module loading completed');
        } catch (error) {
            console.error('Error during module loading:', error);
        }
    }
    
    applyTextureToObject(object, texture) {
        if (!texture.url) {
            console.error('Texture sans URL:', texture);
            return;
        }

        const applyTextureToMesh = (mesh, loadedTexture) => {
            let newMaterial;
            if (mesh.material instanceof THREE.MeshPhongMaterial || 
                mesh.material instanceof THREE.MeshLambertMaterial) {
                newMaterial = mesh.material.clone();
                newMaterial.map = loadedTexture;
                newMaterial.needsUpdate = true;
            } else {
                newMaterial = new THREE.MeshPhongMaterial({
                    map: loadedTexture,
                    side: THREE.DoubleSide
                });
            }
            mesh.material = newMaterial;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        };

        const loader = new THREE.TextureLoader();
        loader.load(texture.url, (loadedTexture) => {
            loadedTexture.wrapS = THREE.RepeatWrapping;
            loadedTexture.wrapT = THREE.RepeatWrapping;
            loadedTexture.repeat.set(1, 1);
            
            if (object instanceof THREE.Group) {
                // Appliquer la texture à tous les enfants du groupe
                object.traverse(child => {
                    if (child instanceof THREE.Mesh && child.material) {
                        applyTextureToMesh(child, loadedTexture);
                    }
                });
            } else if (object instanceof THREE.Mesh) {
                applyTextureToMesh(object, loadedTexture);
            }
            
            document.getElementById('command-output').textContent = 
                `Texture "${texture.name}" appliquée`;
        }, undefined, (error) => {
            console.error('Erreur lors du chargement de la texture:', error);
            document.getElementById('command-output').textContent = 
                'Erreur lors du chargement de la texture';
        });
    }
    
    applyColorToObject(object, color) {
        if (!color.hex) {
            console.error('Couleur sans hex:', color);
            return;
        }

        const applyColorToMesh = (mesh) => {
            let newMaterial;
            if (mesh.material instanceof THREE.MeshPhongMaterial || 
                mesh.material instanceof THREE.MeshLambertMaterial) {
                newMaterial = mesh.material.clone();
                newMaterial.color.setStyle(color.hex);
                newMaterial.map = null;
                newMaterial.needsUpdate = true;
            } else {
                newMaterial = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(color.hex),
                    side: THREE.DoubleSide
                });
            }
            mesh.material = newMaterial;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        };

        if (object instanceof THREE.Group) {
            // Appliquer la couleur à tous les enfants du groupe
            object.traverse(child => {
                if (child instanceof THREE.Mesh && child.material) {
                    applyColorToMesh(child);
                }
            });
        } else if (object instanceof THREE.Mesh) {
            applyColorToMesh(object);
        }

        // Mettre à jour l'interface
        if (this.uiManager && this.uiManager.updatePropertiesPanel) {
            this.uiManager.updatePropertiesPanel(object);
        }

        document.getElementById('command-output').textContent = 
            `Couleur "${color.name}" appliquée`;
    }
    
    handleMouseDown(event) {
        // Si un outil est actif, lui passer l'événement en premier
        if (this.currentTool && this.currentTool.handleClick) {
            console.log('Passage du clic à l\'outil actif:', this.currentTool.constructor.name);
            const handled = this.currentTool.handleClick(event);
            if (handled) {
                return; // L'outil a traité l'événement, ne pas continuer
            }
        }
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        if (this.currentTool === 'select') {
            const intersects = this.raycaster.intersectObjects(this.objects);
            if (intersects.length > 0) {
                this.selectObject(intersects[0].object);
            } else {
                this.deselectAll();
            }
        } else if (this.currentTool === 'extrude') {
            this.extrusionManager.handleExtrusion(event);
        } else if (['parallel', 'trim', 'extend'].includes(this.currentTool)) {
            // Pour les nouveaux outils, passer directement le point 3D
            let point = this.getWorldPoint(event);
            if (point) {
                this.drawingManager.handleDrawing(point);
            }
        } else {
            // Gérer le dessin multi-points pour les autres outils
            let point = this.getWorldPoint(event);
            if (point) {
                // Vérifier s'il y a un point d'accrochage actif
                if (this.snapManager.snapIndicator.visible && this.snapManager.currentSnapType) {
                    // Utiliser exactement la position du point d'accrochage
                    point = this.snapManager.snapIndicator.position.clone();
                    point.z = 0; // Garder sur le plan de travail
                }
                this.drawingManager.handleDrawing(point);
            }
        }
    }

    createGroup(objects) {
        if (!objects || objects.length === 0) {
            console.warn('No objects provided to create a group.');
            return;
        }

        const group = new THREE.Group();
        group.userData.type = 'group'; // Marquer comme groupe pour identification
        
        objects.forEach(obj => {
            this.scene.remove(obj);
            group.add(obj);
            // S'assurer que les objets du groupe ne sont pas sélectionnables individuellement
            obj.userData.isPartOfGroup = true;
        });

        this.scene.add(group);
        this.objects.push(group);

        // Update layers
        this.layers[this.currentLayer].objects = this.layers[this.currentLayer].objects.filter(obj => !objects.includes(obj));
        this.layers[this.currentLayer].objects.push(group);

        this.addToHistory('createGroup', group, { objects });
        document.getElementById('command-output').textContent = 'Group created.';
        console.log('Group created:', group);
    }

    explodeGroup(group) {
        if (!(group instanceof THREE.Group)) {
            console.warn('Provided object is not a group.');
            return;
        }

        // Détacher les contrôles avant de modifier la scène
        this.transformControls.detach();
        this.deselectAll();

        const objects = [...group.children];
        
        // Ajouter les objets à la scène en préservant leur position mondiale
        objects.forEach(child => {
            // Calculer et appliquer la matrice mondiale avant de retirer du groupe
            child.updateMatrixWorld(true);
            const worldPosition = child.getWorldPosition(new THREE.Vector3());
            const worldQuaternion = child.getWorldQuaternion(new THREE.Quaternion());
            const worldScale = child.getWorldScale(new THREE.Vector3());
            
            // Ajouter à la scène
            this.scene.add(child);
            
            // Appliquer la transformation mondiale préservée
            child.position.copy(worldPosition);
            child.quaternion.copy(worldQuaternion);
            child.scale.copy(worldScale);
            
            // Réinitialiser le flag isPartOfGroup
            delete child.userData.isPartOfGroup;
        });

        // Maintenant on peut supprimer le groupe
        this.scene.remove(group);
        this.objects = this.objects.filter(obj => obj !== group);
        this.objects.push(...objects);

        // Update layers
        this.layers[this.currentLayer].objects = this.layers[this.currentLayer].objects.filter(obj => obj !== group);
        this.layers[this.currentLayer].objects.push(...objects);

        // Sélectionner le premier objet éclaté
        if (objects.length > 0) {
            this.selectObject(objects[0]);
        }

        this.addToHistory('explodeGroup', null, { group, objects });
        document.getElementById('command-output').textContent = 'Group exploded.';
        console.log('Group exploded:', group);
    }
}

