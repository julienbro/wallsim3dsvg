import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class UIManager {
    constructor(app) {
        this.app = app;
        console.log('Configuration de l\'interface utilisateur...');
        
        this.setupPanelToggles();
        this.setupEventListeners();
        this.setupTextureLibrary();
        this.setupSunlightControls(); // Changed from initializeSunlightControls to setupSunlightControls
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
        // Gestionnaires de fichiers existants
        document.getElementById('new-project')?.addEventListener('click', () => {
            this.app.fileManager.newProject();
        });

        document.getElementById('open-project')?.addEventListener('click', () => {
            // TODO: Implémenter l'ouverture de projet
            document.getElementById('command-output').textContent = 'Fonctionnalité d\'ouverture à implémenter';
        });

        // Nouveau gestionnaire pour l'import COLLADA
        document.getElementById('import-collada')?.addEventListener('click', async () => {
            try {
                await this.app.fileManager.importColladaFile();
            } catch (error) {
                console.error('Erreur lors de l\'importation COLLADA:', error);
                document.getElementById('command-output').textContent = 'Erreur lors de l\'importation du fichier COLLADA';
            }
        });

        // Nouveau gestionnaire pour l'import GLTF/GLB
        document.getElementById('import-gltf')?.addEventListener('click', async () => {
            try {
                await this.app.fileManager.importGLTFFile();
            } catch (error) {
                console.error('Erreur lors de l\'importation GLTF:', error);
                document.getElementById('command-output').textContent = 'Erreur lors de l\'importation du fichier GLTF/GLB';
            }
        });

        document.getElementById('save-project')?.addEventListener('click', () => {
            this.app.fileManager.saveProject();
        });

        document.getElementById('export-project')?.addEventListener('click', () => {
            this.app.fileManager.exportProject();
        });

        // Gestionnaires de la barre d'outils
        document.getElementById('toolbar-new')?.addEventListener('click', () => {
            this.app.fileManager.newProject();
        });

        document.getElementById('toolbar-open')?.addEventListener('click', () => {
            // TODO: Implémenter l'ouverture de projet
            document.getElementById('command-output').textContent = 'Fonctionnalité d\'ouverture à implémenter';
        });

        // Nouveau gestionnaire pour le bouton de la barre d'outils
        document.getElementById('toolbar-import-collada')?.addEventListener('click', async () => {
            try {
                await this.app.fileManager.importColladaFile();
            } catch (error) {
                console.error('Erreur lors de l\'importation COLLADA:', error);
                document.getElementById('command-output').textContent = 'Erreur lors de l\'importation du fichier COLLADA';
            }
        });

        // Bouton import GLTF de la toolbar
        document.getElementById('toolbar-import-gltf')?.addEventListener('click', async () => {
            try {
                await this.app.fileManager.importGLTFFile();
            } catch (error) {
                console.error('Erreur lors de l\'importation GLTF:', error);
                document.getElementById('command-output').textContent = 'Erreur lors de l\'importation du fichier GLTF/GLB';
            }
        });

        document.getElementById('toolbar-save')?.addEventListener('click', () => {
            this.app.fileManager.saveProject();
        });

        document.getElementById('toolbar-export')?.addEventListener('click', () => {
            this.app.fileManager.exportProject();
        });

        document.getElementById('toolbar-export-view-pdf')?.addEventListener('click', async () => {
            try {
                await this.app.fileManager.exportViewToPDF();
            } catch (error) {
                console.error('Erreur lors de l\'export PDF:', error);
                document.getElementById('command-output').textContent = 'Erreur lors de l\'export PDF';
            }
        });

        // Menu
        document.getElementById('new-project').addEventListener('click', () => this.app.fileManager.newProject());
        document.getElementById('save-project').addEventListener('click', () => this.app.fileManager.saveProject());
        document.getElementById('export-project').addEventListener('click', () => this.app.fileManager.exportProject());
        document.getElementById('import-collada')?.addEventListener('click', async () => {
            try {
                await this.app.fileManager.importColladaFile();
            } catch (error) {
                console.error('Erreur lors de l\'importation via menu:', error);
            }
        });
        
        document.getElementById('undo').addEventListener('click', () => this.app.undo());
        document.getElementById('redo').addEventListener('click', () => this.app.redo());
        
        // Boutons copier/coller/couper
        const copyBtn = document.getElementById('copy');
        const cutBtn = document.getElementById('cut');
        const pasteBtn = document.getElementById('paste');
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.app.copySelected());
        }
        if (cutBtn) {
            cutBtn.addEventListener('click', () => this.app.cutSelected());
        }
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => this.app.pasteFromClipboard());
        }
        
        document.getElementById('delete').addEventListener('click', () => this.app.deleteSelected());
        
        // Ajouter les boutons copier/coller
        const editMenu = document.querySelector('.menu-section:nth-child(2)');
        if (editMenu) {
            const copyBtn = document.createElement('button');
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.title = 'Copier (Ctrl+C)';
            copyBtn.addEventListener('click', () => this.app.copySelected());
            editMenu.appendChild(copyBtn);
            
            const cutBtn = document.createElement('button');
            cutBtn.innerHTML = '<i class="fas fa-cut"></i>';
            cutBtn.title = 'Couper (Ctrl+X)';
            cutBtn.addEventListener('click', () => this.app.cutSelected());
            editMenu.appendChild(cutBtn);
            
            const pasteBtn = document.createElement('button');
            pasteBtn.innerHTML = '<i class="fas fa-paste"></i>';
            pasteBtn.title = 'Coller (Ctrl+V)';
            pasteBtn.addEventListener('click', () => this.app.pasteFromClipboard());
            editMenu.appendChild(pasteBtn);
        }
        
        document.getElementById('view-top').addEventListener('click', () => this.app.viewManager.setView('top'));
        document.getElementById('view-front').addEventListener('click', () => this.app.viewManager.setView('front'));
        document.getElementById('view-right').addEventListener('click', () => this.app.viewManager.setView('right'));
        document.getElementById('view-iso').addEventListener('click', () => this.app.viewManager.setView('iso'));
        document.getElementById('toggle-grid').addEventListener('click', () => this.app.viewManager.toggleGrid());
        
        // Mode 2D/3D
        document.getElementById('toggle-2d3d').addEventListener('click', () => this.app.viewManager.toggle2D3D());
        
        // Calques
        document.getElementById('add-layer').addEventListener('click', () => this.addLayer());
        
        // Ligne de commande
        document.getElementById('command-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.executeCommand(e.target.value);
        });
        
        this.updateAxisHelper();
        
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
    
    setupDrawingTools() {
        console.log('Configuration des outils de dessin dans la sidebar...');
        
        // Configuration des outils de la sidebar
        document.getElementById('sidebar-select').addEventListener('click', () => this.handleToolSelect('select'));
        document.getElementById('sidebar-polyline').addEventListener('click', () => this.handleToolSelect('polyline'));
        document.getElementById('sidebar-rect').addEventListener('click', () => this.handleToolSelect('rect'));
        document.getElementById('sidebar-circle').addEventListener('click', () => this.handleToolSelect('circle'));
        document.getElementById('sidebar-parallel').addEventListener('click', () => this.handleToolSelect('parallel'));
        document.getElementById('sidebar-trim').addEventListener('click', () => this.handleToolSelect('trim'));
        document.getElementById('sidebar-extend').addEventListener('click', () => this.handleToolSelect('extend'));
        document.getElementById('sidebar-hatch').addEventListener('click', () => this.handleToolSelect('hatch'));
        
        // Vérifier si le bouton surface existe avant d'ajouter l'event listener
        const surfaceBtn = document.getElementById('sidebar-surface');
        if (surfaceBtn) {
            surfaceBtn.addEventListener('click', () => this.handleToolSelect('surface'));
        } else {
            console.warn('Bouton sidebar-surface non trouvé dans le HTML');
        }
        
        document.getElementById('sidebar-extrude').addEventListener('click', () => this.handleToolSelect('extrude'));
        
        // Ajouter l'event listener pour le bouton dimension
        const dimensionBtn = document.getElementById('sidebar-dimension');
        if (dimensionBtn) {
            dimensionBtn.addEventListener('click', () => this.handleToolSelect('dimension'));
        } else {
            console.warn('Bouton sidebar-dimension non trouvé dans le HTML');
        }
        
        console.log('Outils de la sidebar configurés');
    }
    
    /**
     * Gère la sélection d'un outil
     */
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
    
    /**
     * Met à jour l'état visuel des boutons d'outils
     */
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
        
        // Contrôles pour mois et heure
        const sunMonthElement = document.getElementById('sun-month');
        const sunHourElement = document.getElementById('sun-hour');
        const hourDisplayElement = document.getElementById('hour-display');
        const showSunHelperElement = document.getElementById('show-sun-helper');
        const enableShadowsElement = document.getElementById('enable-shadows');
        
        if (azimuthSlider && elevationSlider) {
            const updateSunlight = () => {
                const azimuth = parseFloat(azimuthSlider.value);
                const elevation = parseFloat(elevationSlider.value);
                
                if (azimuthValue) azimuthValue.textContent = azimuth.toFixed(1) + '°';
                if (elevationValue) elevationValue.textContent = elevation.toFixed(1) + '°';
                
                // Vérifier que sunlightManager existe avant d'appeler updateSunPosition
                if (this.app.sunlightManager && typeof this.app.sunlightManager.updateSunPosition === 'function') {
                    this.app.sunlightManager.updateSunPosition(azimuth, elevation);
                }
            };
            
            azimuthSlider.addEventListener('input', updateSunlight);
            elevationSlider.addEventListener('input', updateSunlight);
            
            // Attendre un peu avant d'appliquer les valeurs initiales
            setTimeout(() => {
                updateSunlight();
            }, 200);
        }

        if (sunMonthElement) {
            sunMonthElement.addEventListener('change', (e) => {
                if (this.app.sunlightManager) {
                    this.app.sunlightManager.month = parseInt(e.target.value);
                    this.app.sunlightManager.updateSunPosition();
                }
            });
        }
        
        if (sunHourElement && hourDisplayElement) {
            sunHourElement.addEventListener('input', (e) => {
                const hour = parseFloat(e.target.value);
                if (this.app.sunlightManager) {
                    this.app.sunlightManager.hour = hour;
                    const hours = Math.floor(hour);
                    const minutes = Math.round((hour - hours) * 60);
                    hourDisplayElement.textContent = 
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    this.app.sunlightManager.updateSunPosition();
                }
            });
        }
        
        if (showSunHelperElement) {
            showSunHelperElement.addEventListener('change', (e) => {
                if (this.app.sunlightManager && this.app.sunlightManager.sunHelper) {
                    this.app.sunlightManager.sunHelper.visible = e.target.checked;
                }
            });
        }
        
        // Activer/désactiver les ombres
        if (enableShadowsElement) {
            enableShadowsElement.addEventListener('change', (e) => {
                if (this.app.sunlightManager) {
                    this.app.sunlightManager.enableShadows(e.target.checked);
                    
                    // Forcer un rendu après le changement
                    if (this.app.renderer && this.app.scene && this.app.camera) {
                        this.app.renderer.render(this.app.scene, this.app.camera);
                    }
                }
            });
            
            // S'assurer que les ombres sont activées au démarrage
            if (enableShadowsElement.checked && this.app.sunlightManager) {
                this.app.sunlightManager.enableShadows(true);
            }
        }
        
        // Contrôles du Nord
        this.setupNorthControls();
    }
    
    createShadowControls() {
        // Cette fonction n'est plus nécessaire car les contrôles sont maintenant dans la sidebar
    }
    
    updateCoordinates(worldPoint) {
        document.getElementById('coordinates').innerHTML = 
            `<span style="color: #ff0000;">Rouge: ${worldPoint.x.toFixed(2)} cm</span>, ` +
            `<span style="color: #00ff00;">Vert: ${worldPoint.y.toFixed(2)} cm</span>, ` +
            `<span style="color: #0000ff;">Bleu: ${worldPoint.z.toFixed(2)} cm</span>`;
    }
    
    updateAxisHelper() {
        const canvas = document.getElementById('axis-helper');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 100, 100);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#000000';
        
        // X - Rouge (horizontal droite)
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(90, 50);
        ctx.stroke();
        ctx.fillStyle = '#ff0000';
        ctx.fillText('X', 92, 53);
        
        // Y - Vert (diagonal vers le bas)
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(70, 70);
        ctx.stroke();
        ctx.fillStyle = '#00ff00';
        ctx.fillText('Y', 72, 75);
        
        // Z - Bleu (vertical vers le haut)
        ctx.strokeStyle = '#0000ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(50, 10);
        ctx.stroke();
        ctx.fillStyle = '#0000ff';
        ctx.fillText('Z', 47, 8);
    }
    
    addLayer() {
        const layerName = `Calque ${this.app.layers.length}`;
        this.app.layers.push({ name: layerName, visible: true, objects: [] });
        this.updateLayersPanel();
    }
    
    updateLayersPanel() {
        const layersList = document.getElementById('layers-list');
        layersList.innerHTML = '';
        
        this.app.layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            if (index === this.app.currentLayer) {
                layerItem.classList.add('active');
            }
            
            layerItem.innerHTML = `
                <input type="checkbox" ${layer.visible ? 'checked' : ''} data-layer="${index}">
                <span>${layer.name}</span>
                <button class="delete-layer" data-layer="${index}" ${index === 0 ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // Gestionnaire pour sélectionner le calque
            layerItem.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox' && !e.target.closest('.delete-layer')) {
                    this.app.currentLayer = index;
                    this.updateLayersPanel();
                }
            });
            
            // Gestionnaire pour la visibilité
            const checkbox = layerItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                layer.visible = e.target.checked;
                this.app.updateLayerVisibility(index);
            });
            
            // Gestionnaire pour supprimer
            const deleteBtn = layerItem.querySelector('.delete-layer');
            if (index !== 0) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.app.deleteLayer(index);
                    this.updateLayersPanel();
                });
            }
            
            layersList.appendChild(layerItem);
        });
    }
    
    setupDpad() {
        const dpadContainer = document.getElementById('dpad-container');
        if (!dpadContainer) {
            console.warn('D-pad container not found');
            return;
        }

        const stepSizeInput = document.getElementById('dpad-step-size');
        const getStepSize = () => parseFloat(stepSizeInput.value) || 1;
        const commandOutput = document.getElementById('command-output');

        const setupButton = (id, action) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', action);
            } else {
                console.warn(`D-pad button ${id} not found`);
            }
        };

        const handleMove = (dx, dy, dz) => {
            if (!this.app.selectedObject) {
                commandOutput.textContent = 'Aucun objet sélectionné à déplacer.';
                return;
            }
            this.moveSelectedObject(dx * getStepSize(), dy * getStepSize(), dz * getStepSize());
        };

        setupButton('dpad-up', () => handleMove(0, 1, 0));    // Y+
        setupButton('dpad-down', () => handleMove(0, -1, 0));  // Y-
        setupButton('dpad-left', () => handleMove(-1, 0, 0));  // X-
        setupButton('dpad-right', () => handleMove(1, 0, 0));   // X+
        setupButton('dpad-z-up', () => handleMove(0, 0, 1));    // Z+
        setupButton('dpad-z-down', () => handleMove(0, 0, -1));  // Z-

        setupButton('dpad-center', () => {
            if (this.app.selectedObject) {
                this.app.selectedObject.position.set(0, 0, 0);
                // Assurez-vous que updatePropertiesPanel existe et est appelée correctement
                if (typeof this.updatePropertiesPanel === 'function') {
                    this.updatePropertiesPanel(this.app.selectedObject);
                } else {
                    console.error('this.updatePropertiesPanel n\'est pas une fonction dans setupDpad');
                }
                if (this.app.transformControls && this.app.transformControls.object === this.app.selectedObject) {
                    this.app.transformControls.updateMatrixWorld();
                }
                commandOutput.textContent = 'Objet replacé à l\'origine (0,0,0).';
            } else {
                commandOutput.textContent = 'Aucun objet sélectionné à réinitialiser.';
            }
        });
        
        console.log('D-pad configuré');
    }

    moveSelectedObject(dx, dy, dz) {
        if (!this.app.selectedObject) return;

        this.app.selectedObject.position.x += dx;
        this.app.selectedObject.position.y += dy;
        this.app.selectedObject.position.z += dz;

        if (this.app.transformControls && this.app.transformControls.object === this.app.selectedObject) {
            this.app.transformControls.updateMatrixWorld(); 
        }

        // Assurez-vous que updatePropertiesPanel existe et est appelée correctement
        if (typeof this.updatePropertiesPanel === 'function') {
            this.updatePropertiesPanel(this.app.selectedObject);
        } else {
            console.error('this.updatePropertiesPanel n\'est pas une fonction dans moveSelectedObject');
        }

        const pos = this.app.selectedObject.position;
        document.getElementById('command-output').textContent = 
            `Déplacé. Position: X=${pos.x.toFixed(2)}, Y=${pos.y.toFixed(2)}, Z=${pos.z.toFixed(2)} cm`;
    }

    setupToolbarButtons() {
        // Boutons Fichier
        const newBtn = document.getElementById('toolbar-new');
        const saveBtn = document.getElementById('toolbar-save');
        const exportBtn = document.getElementById('toolbar-export');
        const openBtn = document.getElementById('toolbar-open');
        
        if (newBtn) newBtn.addEventListener('click', () => this.app.fileManager.newProject());
        if (saveBtn) saveBtn.addEventListener('click', () => this.app.fileManager.saveProject());
        if (exportBtn) exportBtn.addEventListener('click', () => this.app.fileManager.exportProject());
        
        // Bouton Ouvrir
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.app.fileManager.loadProject(file);
                    }
                };
                input.click();
            });
        }
        
        // Boutons Édition
        const undoBtn = document.getElementById('toolbar-undo');
        const redoBtn = document.getElementById('toolbar-redo');
        const copyBtn = document.getElementById('toolbar-copy');
        const cutBtn = document.getElementById('toolbar-cut');
        const pasteBtn = document.getElementById('toolbar-paste');
        const deleteBtn = document.getElementById('toolbar-delete');
        
        if (undoBtn) undoBtn.addEventListener('click', () => this.app.undo());
        if (redoBtn) redoBtn.addEventListener('click', () => this.app.redo());
        if (copyBtn) copyBtn.addEventListener('click', () => this.app.copySelected());
        if (cutBtn) cutBtn.addEventListener('click', () => this.app.cutSelected());
        if (pasteBtn) pasteBtn.addEventListener('click', () => this.app.pasteFromClipboard());
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.app.deleteSelected());
        
        // Nouveaux boutons Outils de dessin
        const lineBtn = document.getElementById('toolbar-line');
        const rectBtn = document.getElementById('toolbar-rect');
        const circleBtn = document.getElementById('toolbar-circle');
        const polylineBtn = document.getElementById('toolbar-polyline');
        const selectBtn = document.getElementById('toolbar-select');
        const extrudeBtn = document.getElementById('toolbar-extrude');
        
        if (lineBtn) lineBtn.addEventListener('click', () => this.app.toolManager.setTool('line'));
        if (rectBtn) rectBtn.addEventListener('click', () => this.app.toolManager.setTool('rect'));
        if (circleBtn) circleBtn.addEventListener('click', () => this.app.toolManager.setTool('circle'));
        if (polylineBtn) polylineBtn.addEventListener('click', () => this.app.toolManager.setTool('polyline'));
        if (selectBtn) selectBtn.addEventListener('click', () => this.app.toolManager.setTool('select'));
        if (extrudeBtn) extrudeBtn.addEventListener('click', () => this.app.toolManager.setTool('extrude'));
        
        // Boutons Vue
        const zoomInBtn = document.getElementById('toolbar-zoom-in');
        const zoomOutBtn = document.getElementById('toolbar-zoom-out');
        const zoomExtentsBtn = document.getElementById('toolbar-zoom-extents');
        const orbitBtn = document.getElementById('toolbar-orbit');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.app.camera.zoom *= 1.2;
                this.app.camera.updateProjectionMatrix();
                document.getElementById('command-output').textContent = 'Zoom avant';
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.app.camera.zoom /= 1.2;
                this.app.camera.updateProjectionMatrix();
                document.getElementById('command-output').textContent = 'Zoom arrière';
            });
        }
        
        if (zoomExtentsBtn) zoomExtentsBtn.addEventListener('click', () => this.app.viewManager.zoomExtents());
        if (orbitBtn) orbitBtn.addEventListener('click', () => this.app.activateOrbitMode());
        
        // Boutons Vues prédéfinies
        const viewTopBtn = document.getElementById('toolbar-view-top');
        const viewIsoBtn = document.getElementById('toolbar-view-iso');
        const viewFrontBtn = document.getElementById('toolbar-view-front');
        const viewBackBtn = document.getElementById('toolbar-view-back');
        const viewRightBtn = document.getElementById('toolbar-view-right');
        const viewLeftBtn = document.getElementById('toolbar-view-left');
        const snapBtn = document.getElementById('toolbar-snap');
        
        if (viewTopBtn) viewTopBtn.addEventListener('click', () => this.app.viewManager.setView('top'));
        if (viewIsoBtn) viewIsoBtn.addEventListener('click', () => this.app.viewManager.setView('iso'));
        if (viewFrontBtn) viewFrontBtn.addEventListener('click', () => this.app.viewManager.setView('front'));
        if (viewBackBtn) viewBackBtn.addEventListener('click', () => this.app.viewManager.setView('back'));
        if (viewRightBtn) viewRightBtn.addEventListener('click', () => this.app.viewManager.setView('right'));
        if (viewLeftBtn) viewLeftBtn.addEventListener('click', () => this.app.viewManager.setView('left'));

        if (snapBtn) {
            snapBtn.addEventListener('click', () => {
                // Basculer l'état d'accrochage
                this.app.snapEnabled = !this.app.snapEnabled;
                
                // Mettre à jour l'état visuel du bouton
                snapBtn.classList.toggle('active', this.app.snapEnabled);
                
                // Mettre à jour le message de commande
                document.getElementById('command-output').textContent = 
                    this.app.snapEnabled ? 'Accrochage activé' : 'Accrochage désactivé';
                
                // Mettre à jour l'indicateur dans la barre d'état
                const snapIndicator = document.getElementById('snap-indicator');
                if (snapIndicator) {
                    snapIndicator.textContent = this.app.snapEnabled ? 'Accrochage: ON' : 'Accrochage: OFF';
                }
                
                // Si l'accrochage est désactivé, cacher l'indicateur de snap
                if (!this.app.snapEnabled && this.app.snapManager) {
                    this.app.snapManager.hideSnapIndicator();
                }
            });
            
            // Initialiser l'état du bouton selon l'état par défaut de l'application
            snapBtn.classList.toggle('active', this.app.snapEnabled);
        }

        // Ajouter le gestionnaire pour le nouveau bouton "Exporter Vue en PDF"
        document.getElementById('toolbar-export-view-pdf')?.addEventListener('click', () => {
            console.log('Exporter Vue en PDF cliqué');
            if (this.app.fileManager && typeof this.app.fileManager.exportViewToPDF === 'function') {
                this.app.fileManager.exportViewToPDF();
            } else {
                console.error('Méthode exportViewToPDF non disponible dans FileManager');
                alert('La fonctionnalité d\'export de la vue en PDF n\'est pas disponible.');
            }
        });
    }
    
    setupTextureLibrary() {
        // Attendre que les éléments DOM soient disponibles
        setTimeout(() => {
            // Configuration des textures
            this.setupTextures();
            
            // Configuration des couleurs
            this.setupColorPalette();
            
            // Configuration des onglets
            this.setupTextureTabs();
            
            // Gestionnaire pour annuler le mode texture avec Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.app.textureApplyMode) {
                    this.cancelTextureMode();
                }
            });
            
            console.log('Bibliothèque de textures et couleurs configurée');
        }, 100);
    }
    
    setupTextures() {
        const textures = [
            { name: 'Brique Brune', url: 'https://julienbro.github.io/MurSimulateur3d/textures/brique_brune_1.png' },
            { name: 'Brique Rouge', url: 'https://julienbro.github.io/MurSimulateur3d/textures/brique_rouge_1.png' },
            { name: 'Brique Claire', url: 'https://julienbro.github.io/MurSimulateur3d/textures/brique_claire_1.png' },
            { name: 'Brique Beige', url: 'https://julienbro.github.io/MurSimulateur3d/textures/brique_beige_1.png' },
            { name: 'Brique Grise', url: 'https://julienbro.github.io/MurSimulateur3d/textures/brique_grise_1.png' },
            { name: 'Brique Grise 2', url: 'https://julienbro.github.io/MurSimulateur3d/textures/brique_grise_2.png' },
            { name: 'Béton', url: 'https://julienbro.github.io/MurSimulateur3d/textures/beton_1.png' },
            { name: 'Bois Pin', url: 'https://julienbro.github.io/MurSimulateur3d/textures/bois_pin_1.png' }
        ];
        
        const textureLibrary = document.getElementById('texture-library');
        if (!textureLibrary) {
            console.warn('Élément texture-library non trouvé');
            return;
        }
        
        textures.forEach((texture) => {
            const textureItem = document.createElement('div');
            textureItem.className = 'texture-item';
            textureItem.style.backgroundImage = `url(${texture.url})`;
            textureItem.title = texture.name;
            textureItem.innerHTML = `<div class="texture-label">${texture.name}</div>`;
            
            textureItem.addEventListener('click', () => {
                this.selectTexture(textureItem, texture, 'texture');
            });
            
            textureLibrary.appendChild(textureItem);
        });
        
        console.log('Textures configurées');
    }
    
    setupColorPalette() {
        const colors = [
            { name: 'Rouge foncé', hex: '#CC0000' },
            { name: 'Brun clair', hex: '#D2B48C' },
            { name: 'Brun', hex: '#8B4513' },
            { name: 'Gris ardoise foncé', hex: '#2F4F4F' },
            { name: 'Noir', hex: '#000000' },
            { name: 'Gris clair', hex: '#D3D3D3' },
            { name: 'Gris foncé', hex: '#A9A9A9' },
            { name: 'Gris terne', hex: '#696969' },
            { name: 'Beige', hex: '#F5F5DC' },
            { name: 'Jaune clair', hex: '#FFFFE0' },
            { name: 'Vert clair', hex: '#90EE90' },
            { name: 'Blanc', hex: '#FFFFFF' }
        ];
        
        const colorPalette = document.getElementById('color-palette');
        if (!colorPalette) {
            console.warn('Élément color-palette non trouvé');
            return;
        }
        
        colors.forEach((color) => {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            colorItem.style.backgroundColor = color.hex;
            colorItem.title = color.name;
            
            colorItem.addEventListener('click', () => {
                this.selectTexture(colorItem, color, 'color');
            });
            
            colorPalette.appendChild(colorItem);
        });
        
        // Configuration de la couleur personnalisée
        const customColorPicker = document.getElementById('custom-color-picker');
        const applyCustomBtn = document.getElementById('apply-custom-color');
        
        if (applyCustomBtn && customColorPicker) {
            applyCustomBtn.addEventListener('click', () => {
                const customColor = {
                    name: 'Couleur personnalisée',
                    hex: customColorPicker.value
                };
                this.selectTexture(null, customColor, 'color');
            });
        }
        
        console.log('Palette de couleurs configurée');
    }
    
    selectTexture(element, material, type) {
        // Désélectionner les autres éléments
        document.querySelectorAll('.texture-item, .color-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Sélectionner l'élément actuel
        if (element) {
            element.classList.add('selected');
        }
        
        this.app.selectedTexture = material;
        this.app.selectedTextureType = type;
        this.app.textureApplyMode = true;
        
        // Changer le curseur et les instructions
        document.body.classList.add('texture-apply-mode');
        const instruction = document.getElementById('texture-instruction');
        if (instruction) {
            instruction.textContent = `${type === 'texture' ? 'Texture' : 'Couleur'} "${material.name}" sélectionnée. Cliquez sur un objet pour l'appliquer.`;
            instruction.classList.add('texture-instruction');
        }
        
        console.log(`${type} sélectionné(e): ${material.name}`);
    }
    
    setupTextureTabs() {
        const tabs = document.querySelectorAll('.texture-tab');
        const panels = document.querySelectorAll('.tab-panel');
        
        console.log('Configuration des onglets texture, nombre trouvés:', tabs.length);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = tab.getAttribute('data-tab');
                console.log('Onglet cliqué:', targetTab);
                
                // Mettre à jour les onglets actifs
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Afficher le bon panneau
                panels.forEach(panel => {
                    if (panel.id === `${targetTab}-tab`) {
                        panel.classList.add('active');
                        panel.style.display = 'block';
                    } else {
                        panel.classList.remove('active');
                        panel.style.display = 'none';
                    }
                });
                
                // Annuler le mode texture si actif
                if (this.cancelTextureMode) {
                    this.cancelTextureMode();
                }
            });
        });
        
        console.log('Onglets texture configurés');
    }
    
    cancelTextureMode() {
        if (this.app) {
            this.app.selectedTexture = null;
            this.app.textureApplyMode = false;
            this.app.selectedTextureType = null;
        }
        
        document.body.classList.remove('texture-apply-mode');
        document.querySelectorAll('.texture-item, .color-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const instruction = document.getElementById('texture-instruction');
        if (instruction) {
            instruction.textContent = 'Sélectionnez une texture/couleur puis cliquez sur un objet pour l\'appliquer';
            instruction.classList.remove('texture-instruction');
        }
        
        console.log('Mode texture/couleur annulé');
    }
    
    setupElementsLibrary() {
        // Configuration des éléments de construction
        this.elementsData = {
            briques: [
                { name: 'Brique M50', dims: { x: 19, y: 9, z: 5 }, color: '#B87333', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Brique M57', dims: { x: 19, y: 9, z: 5.7 }, color: '#B87333', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Brique M65', dims: { x: 19, y: 9, z: 6.5 }, color: '#B87333', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Brique M90', dims: { x: 19, y: 9, z: 9 }, color: '#B87333', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Brique WF', dims: { x: 21, y: 10, z: 5 }, color: '#B87333', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Brique WFD', dims: { x: 21, y: 10, z: 6.5 }, color: '#B87333', cuts: [1, 0.75, 0.5, 0.25] }
            ],
            blocs: [
                // ANCIENS blocs creux
                { name: 'Bloc creux B9', dims: { x: 39, y: 9, z: 19 }, color: '#808080', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc creux B14', dims: { x: 39, y: 14, z: 19 }, color: '#808080', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc creux B19', dims: { x: 39, y: 19, z: 19 }, color: '#808080', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc creux B29', dims: { x: 39, y: 29, z: 19 }, color: '#808080', cuts: [1, 0.75, 0.5, 0.25] },
                // NOUVEAUX blocs B (pleins)
                { name: 'Bloc B9', dims: { x: 39, y: 9, z: 19 }, color: '#666666', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc B14', dims: { x: 39, y: 14, z: 19 }, color: '#666666', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc B19', dims: { x: 39, y: 19, z: 19 }, color: '#666666', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc B29', dims: { x: 39, y: 29, z: 19 }, color: '#666666', cuts: [1, 0.75, 0.5, 0.25] },
                // Blocs Argex
                { name: 'Bloc Argex 39x9x19', dims: { x: 39, y: 9, z: 19 }, color: '#A0A0A0', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc Argex 39x14x19', dims: { x: 39, y: 14, z: 19 }, color: '#A0A0A0', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc Argex 39x19x19', dims: { x: 39, y: 19, z: 19 }, color: '#A0A0A0', cuts: [1, 0.75, 0.5, 0.25] },
                // Blocs béton cellulaire (existants)
                { name: 'Bloc béton cell. 5cm', dims: { x: 62.5, y: 5, z: 25 }, color: '#F0F0F0', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc béton cell. 7cm', dims: { x: 62.5, y: 7, z: 25 }, color: '#F0F0F0', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc béton cell. 10cm', dims: { x: 62.5, y: 10, z: 25 }, color: '#F0F0F0', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc béton cell. 15cm', dims: { x: 62.5, y: 15, z: 25 }, color: '#F0F0F0', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc béton cell. 17.5cm', dims: { x: 62.5, y: 17.5, z: 25 }, color: '#F0F0F0', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc béton cell. 20cm', dims: { x: 62.5, y: 20, z: 25 }, color: '#F0F0F0', cuts: [1, 0.75, 0.5, 0.25] },
                { name: 'Bloc béton cell. 24cm', dims: { x: 62.5, y: 24, z: 25 }, color: '#F0F0F0', cuts: [1, 0.75, 0.5, 0.25] },
                // Nouveau bloc Stepoc15N
                { name: 'Stepoc15N', type: 'glb', path: 'assets/models/blocs/stepoc15N.glb', dims: { x: 39, y: 15, z: 19 }, color: '#CCCCCC', cuts: [1, 0.75, 0.5, 0.25] }
            ],
            linteaux: [
                // ANCIENS linteaux
                { name: 'Linteau Béton L100', dims: { x: 100, y: 14, z: 19 }, color: '#555555', cuts: [1] },
                { name: 'Linteau Béton L120', dims: { x: 120, y: 14, z: 19 }, color: '#555555', cuts: [1] },
                // NOUVEAUX linteaux
                { name: 'Linteau L140_14', dims: { x: 140, y: 14, z: 19 }, color: '#555555', cuts: [1] },
                { name: 'Linteau L160_14', dims: { x: 160, y: 14, z: 19 }, color: '#555555', cuts: [1] },
                { name: 'Linteau L180_14', dims: { x: 180, y: 14, z: 19 }, color: '#555555', cuts: [1] },
                { name: 'Linteau L200_14', dims: { x: 200, y: 14, z: 19 }, color: '#555555', cuts: [1] }
            ],
            isolants: [
                // NOUVEAUX isolants PUR
                { name: 'Isolant PUR5', dims: { x: 120, y: 5, z: 60 }, color: '#FFFF00', cuts: [1] },
                { name: 'Isolant PUR6', dims: { x: 120, y: 6, z: 60 }, color: '#FFFF00', cuts: [1] },
                { name: 'Isolant PUR7', dims: { x: 120, y: 7, z: 60 }, color: '#FFFF00', cuts: [1] }
            ],
            planchers: [
                { name: 'Dalle Béton', dims: { x: 200, y: 200, z: 20 }, color: '#8B7355', cuts: [1] },
                { 
                    name: 'Hourdis 60x13', 
                    type: 'glb', 
                    path: 'assets/models/planchers/hourdis_60_13.glb', 
                    dims: { x: 60, y: 13, z: 20 }, 
                    color: '#8B7355',
                    loadModel: async (scene) => {
                        const loader = new THREE.GLTFLoader();
                        const gltf = await loader.loadAsync('assets/models/planchers/hourdis_60_13.glb');
                        const model = gltf.scene;
                        model.scale.set(1, 1, 1); // Ajuster l'échelle si nécessaire
                        scene.add(model);
                        return model;
                    }
                }
            ],
            autres: [
                // NOUVEAUX éléments autres
                { name: 'Vide', dims: { x: 40, y: 3, z: 19 }, color: '#FFFFFF', cuts: [1] },
                { name: 'Profil', dims: { x: 6.5, y: 6.5, z: 250 }, color: '#C0C0C0', customHeight: true }
            ]
        };
        
        this.selectedElement = null;
        this.currentCategory = 'briques';
        
        // Créer un seul renderer pour tous les aperçus
        this.previewRenderer = null;
        this.previewScenes = new Map();
        this.animationId = null;
        
        // Configuration des événements
        const showElementsBtn = document.getElementById('show-elements-library');
        if (showElementsBtn) {
            showElementsBtn.addEventListener('click', () => this.showElementsModal());
        }
        
        const closeModalBtn = document.getElementById('close-elements-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideElementsModal());
        }
        
        // Configuration des onglets de catégories
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.getAttribute('data-category');
                this.showCategory(category);
            });
        });
        
        // Bouton d'ajout à la scène
        const addElementBtn = document.getElementById('add-element-to-scene');
        if (addElementBtn) {
            addElementBtn.addEventListener('click', () => this.addSelectedElementToScene());
        }
        
        // Ajout : méthode d'insertion directe depuis la barre latérale
        // Correction : insérer exactement le même objet utilisé (nom ET catégorie)
        this.insertElementByType = (elementNameOrType, elementCategoryInfo) => {
            let found = null;
            let baseElementName = elementNameOrType;
            let searchCategoryName;
            let specificInstanceDims = null; // Dimensions of the specific instance being re-inserted

            let determinedCategory = null;

            if (typeof elementCategoryInfo === 'object' && elementCategoryInfo !== null) {
                searchCategoryName = elementCategoryInfo.category;
                specificInstanceDims = elementCategoryInfo.dims; // These are the dims of the instance from the used list
                determinedCategory = searchCategoryName;
            } else {
                searchCategoryName = elementCategoryInfo; // string or undefined
            }

            const nameLower = baseElementName.toLowerCase();

            // Si une catégorie de recherche est fournie, chercher d'abord dans cette catégorie
            if (searchCategoryName && this.elementsData[searchCategoryName]) {
                found = (this.elementsData[searchCategoryName] || []).find(el =>
                    el.name && el.name.toLowerCase() === nameLower
                );
            }

            // Sinon, ou si non trouvé, recherche stricte par nom exact dans toutes les catégories
            if (!found) {
                for (const cat in this.elementsData) {
                    // Skip if we already searched this category
                    if (cat === searchCategoryName && determinedCategory) continue;

                    found = (this.elementsData[cat] || []).find(el =>
                        el.name && el.name.toLowerCase() === nameLower
                    );
                    if (found) {
                        determinedCategory = cat;
                        break;
                    }
                }
            }

            // Fallback sur type (rarement utilisé)
            if (!found) {
                for (const cat in this.elementsData) {
                    if (cat === searchCategoryName && determinedCategory && (this.elementsData[cat] || []).some(el => el.name && el.name.toLowerCase() === nameLower)) continue;
                    found = (this.elementsData[cat] || []).find(el =>
                        el.type && el.type === elementNameOrType // elementNameOrType might be a type
                    );
                    if (found) {
                        determinedCategory = cat;
                        break;
                    }
                }
            }
            // Fallback sur inclusion partielle du nom
            if (!found) {
                for (const cat in this.elementsData) {
                     if (cat === searchCategoryName && determinedCategory && (this.elementsData[cat] || []).some(el => el.name && el.name.toLowerCase() === nameLower)) continue;
                    found = (this.elementsData[cat] || []).find(el =>
                        el.name && el.name.toLowerCase().includes(nameLower)
                    );
                    if (found) {
                        determinedCategory = cat;
                        break;
                    }
                }
            }

            // --- Différenciation si plusieurs éléments de base partagent le même nom ---
            // This logic is for disambiguating items *within elementsData* if they share a name
            // but have different base dimensions. For "Brique M50", this is not currently the case.
            if (determinedCategory && found && specificInstanceDims) {
                const candidates = (this.elementsData[determinedCategory] || []).filter(el =>
                    el.name && el.name.toLowerCase() === nameLower
                );
                if (candidates.length > 1) {
                    // Try to find a base element whose default dims match the instance's dims
                    // This assumes specificInstanceDims might correspond to one of the base element's default dims
                    const preciseMatch = candidates.find(el =>
                        el.dims &&
                        el.dims.x === specificInstanceDims.x &&
                        el.dims.y === specificInstanceDims.y &&
                        el.dims.z === specificInstanceDims.z
                    );
                    if (preciseMatch) {
                        found = preciseMatch;
                    }
                    // If no precise match on base dims, 'found' remains the first one found.
                }
            }
            // ----------------------------------------------------------------------

            if (found) {
                this.currentCategory = determinedCategory; // Set category based on where it was found
                // Use a fresh copy of the base element for the modal
                this.selectedElement = JSON.parse(JSON.stringify(found)); 
                
                // Note: If re-inserting an element with specific modifications (e.g., a 1/2 cut brick),
                // this logic currently re-selects the *base* element. The user would need to
                // re-apply modifications in the options modal. To pre-fill options,
                // `showElementOptions` would need to accept `specificInstanceDims` and apply them.

                this.showElementsModal();
                setTimeout(() => {
                    this.showElementOptions(this.selectedElement); // Show options for the base element
                    
                    const grid = document.getElementById('elements-grid');
                    if (grid) {
                        const items = grid.querySelectorAll('.element-item');
                        items.forEach(item => {
                            if (item.textContent.includes(this.selectedElement.name)) {
                                item.classList.add('selected');
                                item.scrollIntoView({ block: 'center', behavior: 'smooth' });
                            } else {
                                item.classList.remove('selected');
                            }
                        });
                    }
                    // Insérer automatiquement l'élément
                    const addBtn = document.getElementById('add-element-to-scene');
                    if (addBtn) addBtn.click(); // This calls addSelectedElementToScene
                }, 100);
            } else {
                alert(`Impossible de retrouver l'élément "${baseElementName}" dans la bibliothèque.`);
            }
        };
    
        console.log('Bibliothèque d\'éléments configurée');
    }
    
    showElementsModal() {
        const modal = document.getElementById('elements-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.showCategory('briques');
        }
    }
    
    hideElementsModal() {
        const modal = document.getElementById('elements-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Nettoyer les ressources WebGL
        this.cleanupPreviews();
    }
    
    cleanupPreviews() {
        // Arrêter l'animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Nettoyer les scènes
        if (this.previewScenes) {
            this.previewScenes.forEach((data) => {
                if (data.mesh) {
                    data.mesh.geometry.dispose();
                    data.mesh.material.dispose();
                }
            });
            this.previewScenes.clear();
        }
        
        // Nettoyer le renderer
        if (this.previewRenderer) {
            this.previewRenderer.dispose();
            this.previewRenderer = null;
        }
    }
    
    showCategory(category) {
        this.currentCategory = category;
        
        // Nettoyer les aperçus précédents
        this.cleanupPreviews();
        
        // Mettre à jour les onglets actifs
        document.querySelectorAll('.category-tab').forEach(tab => {
            if (tab.getAttribute('data-category') === category) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Afficher les éléments de la catégorie
        const grid = document.getElementById('elements-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        const elements = this.elementsData[category] || [];
        
        elements.forEach((element, index) => {
            const elementDiv = document.createElement('div');
            elementDiv.className = 'element-item';
            
            // Calculate scaled dimensions for CSS preview
            // L = element.dims.x
            // H = element.dims.z
            // l = element.dims.y
            const maxDimVal = Math.max(element.dims.x, element.dims.y, element.dims.z);
            const scaleFactor = 40 / maxDimVal; // Keep overall size consistent
            
            const scaledL = element.dims.x * scaleFactor; // Corresponds to CSS var --width
            const scaledH = element.dims.z * scaleFactor; // Corresponds to CSS var --height
            const scaledl = element.dims.y * scaleFactor; // Corresponds to CSS var --depth

            const previewDiv = document.createElement('div');
            previewDiv.className = 'element-preview';
            previewDiv.innerHTML = `
                <div class="element-3d-wrapper">
                    <div class="element-3d-cube" style="
                        width: ${scaledL}px; /* Visual width of front face */
                        height: ${scaledH}px; /* Visual height of front face */
                        --width: ${scaledL}px;
                        --height: ${scaledH}px;
                        --depth: ${scaledl}px; /* Thickness/depth of the cube */
                        --color: ${element.color};
                        --color-dark: ${this.darkenColor(element.color, 20)};
                        --color-darker: ${this.darkenColor(element.color, 40)};
                        --color-light: ${this.lightenColor(element.color, 20)};
                    ">
                        <div class="cube-face cube-front"></div>
                        <div class="cube-face cube-back"></div>
                        <div class="cube-face cube-right"></div>
                        <div class="cube-face cube-left"></div>
                        <div class="cube-face cube-top"></div>
                        <div class="cube-face cube-bottom"></div>
                    </div>
                </div>
            `;
            
            elementDiv.innerHTML = `
                <div class="element-name">${element.name}</div>
                <div class="element-dims">${element.dims.x}×${element.dims.z}×${element.dims.y} cm</div>
            `;
            
            elementDiv.insertBefore(previewDiv, elementDiv.firstChild);
            
            elementDiv.addEventListener('click', () => this.selectElement(element, elementDiv));
            
            grid.appendChild(elementDiv);
        });
    }
    
    // Fonction pour assombrir une couleur
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    // Fonction pour éclaircir une couleur
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    selectElement(element, elementDiv) {
        // Désélectionner les autres éléments
        document.querySelectorAll('.element-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Sélectionner cet élément
        elementDiv.classList.add('selected');
        this.selectedElement = element;
        
        // Afficher les options
        this.showElementOptions(element);
    }
    
    showElementOptions(element) {
        const optionsPanel = document.getElementById('element-options');
        const optionsContent = document.getElementById('element-options-content');
        
        if (!optionsPanel || !optionsContent) return;
        
        optionsPanel.style.display = 'block';
        optionsContent.innerHTML = '';
        
        // Options selon le type d'élément
        if (element.cuts) {
            // Options de coupe prédéfinies (sur L, dims.x)
            const cutGroup = document.createElement('div');
            cutGroup.className = 'option-group';
            cutGroup.innerHTML = `
                <label>Coupe (sur Longueur ${element.dims.x} cm):</label>
                <select id="element-cut">
                    <option value="1">1/1 (${element.dims.x} cm)</option>
                    <option value="0.75">3/4 (${Math.round(element.dims.x * 0.75)} cm)</option>
                    <option value="0.5">1/2 (${Math.round(element.dims.x * 0.5)} cm)</option>
                    <option value="0.25">1/4 (${Math.round(element.dims.x * 0.25)} cm)</option>
                    <option value="custom">Personnalisée</option>
                </select>
                <input type="number" id="custom-cut-value" style="display: none; margin-top: 5px;" 
                       placeholder="Longueur (L) en cm" min="1" max="${element.dims.x}">
            `;
            optionsContent.appendChild(cutGroup);
            
            // Événement pour afficher/cacher l'input personnalisé
            const cutSelect = document.getElementById('element-cut');
            const customInput = document.getElementById('custom-cut-value');
            cutSelect.addEventListener('change', () => {
                customInput.style.display = cutSelect.value === 'custom' ? 'block' : 'none';
            });
        }
        
        if (element.customCut) {
            // Coupe personnalisée uniquement (sur L, dims.x)
            const cutGroup = document.createElement('div');
            cutGroup.className = 'option-group';
            cutGroup.innerHTML = `
                <label>Longueur personnalisée (L) (cm):</label>
                <input type="number" id="custom-dim-x" value="${element.dims.x}" min="1" max="${element.dims.x}">
            `;
            optionsContent.appendChild(cutGroup);
        }
        
        if (element.customSize) { // Pour Isolants: L et H personnalisables
            const sizeGroup = document.createElement('div');
            sizeGroup.className = 'option-group';
            sizeGroup.innerHTML = `
                <label>Longueur (L) (cm):</label>
                <input type="number" id="custom-dim-x" value="${element.dims.x}" min="10" max="300">
                <label style="margin-top: 10px;">Hauteur (H) (cm):</label>
                <input type="number" id="custom-dim-z" value="${element.dims.z}" min="10" max="300">
            `;
            optionsContent.appendChild(sizeGroup);
        }
        
        if (element.depthRange) { // Pour Vide: l (largeur/épaisseur) personnalisable
            const depthGroup = document.createElement('div');
            depthGroup.className = 'option-group';
            depthGroup.innerHTML = `
                <label>Largeur (l) (cm):</label>
                <input type="range" id="custom-dim-y-range" min="${element.depthRange.min}" 
                       max="${element.depthRange.max}" value="${element.dims.y}" step="0.5">
                <span id="custom-dim-y-value">${element.dims.y} cm</span>
            `;
            optionsContent.appendChild(depthGroup);
            
            const yDimRange = document.getElementById('custom-dim-y-range');
            const yDimValue = document.getElementById('custom-dim-y-value');
            yDimRange.addEventListener('input', () => {
                yDimValue.textContent = `${yDimRange.value} cm`;
            });
        }
        
        if (element.customHeight) { // Pour Profil: H personnalisable
            const heightGroup = document.createElement('div');
            heightGroup.className = 'option-group';
            heightGroup.innerHTML = `
                <label>Longueur personnalisée (cm):</label>
                <input type="number" id="custom-dim-z" value="${element.dims.z}" min="50" max="500">
            `;
            optionsContent.appendChild(heightGroup);
        }
    }
    
    async addSelectedElementToScene() {
        if (!this.selectedElement) {
            console.warn('Aucun élément sélectionné');
            return;
        }
        
        const element = this.selectedElement;
        
        // Create the geometry using BoxGeometry
        const geometry = new THREE.BoxGeometry(element.dims.x, element.dims.y, element.dims.z);
        
        // Create the material with the element's color
        const material = new THREE.MeshStandardMaterial({
            color: element.color || '#808080',
            roughness: 0.7,
            metalness: 0.0
        });
        
        // Create the mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Add black edges
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({
                color: 0x000000,
                linewidth: 1 
            })
        );
        mesh.add(line);

        // Center the mesh at origin with bottom face at z=0
        mesh.position.set(0, 0, element.dims.z / 2);

        // Add metadata
        mesh.userData = {
            isConstructionElement: true,
            elementType: this.currentCategory || 'other',
            elementName: element.name,
            elementCategory: this.currentCategory,
            elementDims: element.dims,
            elementId: this.generateUUID()
        };

        // Setup material properties
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        material.needsUpdate = true;

        // Add to scene
        this.app.scene.add(mesh);
        this.app.objects.push(mesh);

        // Add to current layer if available
        if (this.app.layers && this.app.currentLayer !== undefined) {
            this.app.layers[this.app.currentLayer].objects.push(mesh);
        }

        // Add to history
        if (this.app.addToHistory) {
            this.app.addToHistory('create', mesh);
        }

        const output = document.getElementById('command-output');
        if (output) {
            output.textContent = `${mesh.userData.elementName} ajouté à la scène`;
        }

        // Update the used elements display
        if (window.updateUsedElementsDisplay) {
            window.updateUsedElementsDisplay();
        }

        // Close the elements modal
        this.hideElementsModal();
        
        console.log(`Élément ${mesh.userData.elementName} ajouté à la scène`);
    }

    // Ajouter la méthode generateUUID manquante
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
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
            } else {
                console.warn('NorthIndicator non disponible ou méthode setAngle manquante');
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
            
            // CRITIQUE: Mettre à jour immédiatement les ombres avec l'angle du Nord
            if (this.app.sunlightManager) {
                // S'assurer que le SunlightManager a une propriété northAngle
                this.app.sunlightManager.northAngle = angle;
                console.log(`Angle du Nord mis à jour: ${angle}°`);
                
                // Forcer la mise à jour de la position du soleil
                if (typeof this.app.sunlightManager.updateSunPosition === 'function') {
                    this.app.sunlightManager.updateSunPosition();
                    console.log('Position du soleil mise à jour avec angle Nord:', angle);
                } else {
                    console.warn('Méthode updateSunPosition non trouvée dans SunlightManager');
                }
            } else {
                console.warn('SunlightManager non disponible');
            }
        };

        // Gestionnaire pour le slider
        if (northAngleSlider) {
            northAngleSlider.addEventListener('input', (e) => {
                const angle = parseInt(e.target.value);
                updateNorthAngle(angle);
            });
        }

        // Gestionnaire pour l'input numérique
        if (northAngleInput) {
            northAngleInput.addEventListener('change', (e) => {
                let angle = parseFloat(e.target.value);
                // Normaliser l'angle entre 0 et 359
                angle = ((angle % 360) + 360) % 360;
                e.target.value = angle;
                updateNorthAngle(angle);
            });
        }

        // Gestionnaire pour l'affichage de l'indicateur
        if (showNorthIndicator) {
            showNorthIndicator.addEventListener('change', (e) => {
                               if (this.app.northIndicator) {
                    this.app.northIndicator.setVisible(e.target.checked);
                }
            });
        }

        // Gestionnaires pour les boutons de direction prédéfinis
        directionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const angle = parseInt(button.getAttribute('data-angle'));
                updateNorthAngle(angle);
            });
        });
        
        console.log('Contrôles du Nord configurés');
    }
    
    updateNorthAngle(angle) {
        // Normaliser l'angle
        angle = ((angle % 360) + 360) % 360;
        
        console.log('Mise à jour angle Nord:', angle);
        
       
        
        // Mettre à jour l'indicateur de nord
        if (this.app.northIndicator) {
            this.app.northIndicator.setOrientation(angle);
        }
        
        // Synchroniser tous les contrôles
        const northAngle = document.getElementById('north-angle');
        const northAngleInput = document.getElementById('north-angle-input');
        const northAngleDisplay = document.getElementById('north-angle-display');
        
        if (northAngle) northAngle.value = angle;
        if (northAngleInput) northAngleInput.value = angle.toFixed(1);
        if (northAngleDisplay) northAngleDisplay.textContent = `${angle.toFixed(1)}°`;
        
        // Mettre à jour le message de statut
        const output = document.getElementById('command-output');
        if (output) {
            const directions = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest'];
            const directionIndex = Math.round(angle / 45) % 8;
            output.textContent = `Orientation du Nord: ${angle.toFixed(1)}° (${directions[directionIndex]})`;
        }
    }

    updatePropertiesPanel(object) {
        const content = document.getElementById('properties-content');
        if (!content) return;

        if (!object) {
            content.innerHTML = '<p class="info-text">Sélectionnez un objet pour voir ses propriétés</p>';
            return;
        }

        let html = '<div class="properties-list">';
        try {
            // Type d'objet
            html += `<div class="property-item">
                <label>Type:</label>
                <span>${this.getObjectType(object)}</span>
            </div>`;

            // Position
            if (object.position) {
                html += `<div class="property-item">
                    <label>Position X:</label>
                    <input type="number" id="prop-pos-x" value="${object.position.x.toFixed(2)}" step="0.1">
                </div>`;
                html += `<div class="property-item">
                    <label>Position Y:</label>
                    <input type="number" id="prop-pos-y" value="${object.position.y.toFixed(2)}" step="0.1">
                </div>`;
                html += `<div class="property-item">
                    <label>Position Z:</label>
                    <input type="number" id="prop-pos-z" value="${object.position.z.toFixed(2)}" step="0.1">
                </div>`;
            }

            // Style de ligne
            if (this.hasLineProperties(object)) {
                const currentLineType = object.userData?.lineType || 'solid';
                const currentLineWidth = object.userData?.lineWidth || 2;
                const currentDashScale = object.userData?.dashScale || 1;
                html += '<div class="property-separator"></div>';
                html += '<h4>Style de ligne</h4>';
                html += `<div class="property-item">
                    <label>Type de ligne:</label>
                    <select id="prop-line-type">
                        <option value="solid" ${currentLineType === 'solid' ? 'selected' : ''}>Continue</option>
                        <option value="dashed" ${currentLineType === 'dashed' ? 'selected' : ''}>Tirets</option>
                        <option value="dotted" ${currentLineType === 'dotted' ? 'selected' : ''}>Pointillés</option>
                                               <option value="dashdot" ${currentLineType === 'dashdot' ? 'selected' : ''}>Tiret-Point</option>
                    </select>
                </div>`;
                html += `<div class="property-item">
                    <label>Épaisseur:</label>
                    <input type="number" id="prop-line-width" value="${currentLineWidth}" min="1" max="10" step="0.5">
                </div>`;
                const showDashScale = currentLineType !== 'solid';
                html += `<div class="property-item" id="dash-scale-control" style="display: ${showDashScale ? 'flex' : 'none'}">
                    <label>Échelle tirets:</label>
                    <input type="number" id="prop-dash-scale" value="${currentDashScale}" min="0.1" max="5" step="0.1">
                </div>`;
                html += `<div class="property-item">
                    <label>Couleur:</label>
                    <input type="color" id="prop-line-color" value="${this.getLineColor(object)}">
                </div>`;
            }

            // Dimensions géométrie
            if (object.geometry && object.geometry.parameters) {
                html += '<div class="property-separator"></div>';
                if (object.geometry instanceof THREE.PlaneGeometry) {
                    html += '<h4>Dimensions Rectangle</h4>';
                    html += `<div class="property-item">
                        <label>Largeur:</label>
                        <input type="number" id="prop-width" value="${object.geometry.parameters.width.toFixed(2)}" step="0.1">
                    </div>`;
                    html += `<div class="property-item">
                        <label>Hauteur:</label>
                        <input type="number" id="prop-height" value="${object.geometry.parameters.height.toFixed(2)}" step="0.1">
                    </div>`;
                } else if (object.geometry instanceof THREE.CircleGeometry) {
                    html += '<h4>Dimensions Cercle</h4>';
                    html += `<div class="property-item">
                        <label>Rayon:</label>
                        <input type="number" id="prop-radius" value="${object.geometry.parameters.radius.toFixed(2)}" step="0.1">
                    </div>`;
                } else if (object.geometry instanceof THREE.BoxGeometry) {
                    html += '<h4>Dimensions Boîte</h4>';
                    html += `<div class="property-item">
                        <label>Largeur:</label>
                        <input type="number" id="prop-width" value="${object.geometry.parameters.width.toFixed(2)}" step="0.1">
                    </div>`;
                    html += `<div class="property-item">
                        <label>Profondeur:</label>
                        <input type="number" id="prop-depth" value="${object.geometry.parameters.depth.toFixed(2)}" step="0.1">
                    </div>`;
                    html += `<div class="property-item">
                        <label>Hauteur:</label>
                        <input type="number" id="prop-height" value="${object.geometry.parameters.height.toFixed(2)}" step="0.1">
                    </div>`;
                }
            }
        } catch (error) {
            html += `<p class="info-text error-text">Erreur: ${error.message}</p>`;
        }
        html += '</div>';
        content.innerHTML = html;
        if (!html.includes("error-text")) {
            this.setupPropertyHandlers(object);
        }
    }

    getObjectType(object) {
        if (!object) return 'Objet Inconnu';
        if (object.userData?.type) return object.userData.type;
        if (object instanceof THREE.Line) {
            return object.geometry?.attributes?.position?.count === 2 ? 'Ligne' : 'Polyligne';
        } else if (object instanceof THREE.Mesh) {
            if (object.geometry instanceof THREE.PlaneGeometry) return 'Rectangle';
            if (object.geometry instanceof THREE.CircleGeometry) return 'Cercle';
            if (object.geometry instanceof THREE.BoxGeometry) return 'Boîte';
            if (object.geometry instanceof THREE.ExtrudeGeometry) return 'Forme extrudée';
            if (object.geometry instanceof THREE.CylinderGeometry) return 'Cylindre';
            if ( object.geometry instanceof THREE.SphereGeometry) return 'Sphère';
        }
        return 'Objet 3D';
    }

    hasLineProperties(object) {
        return object instanceof THREE.Line ||
            (object.children && object.children.some(child => child instanceof THREE.LineSegments));
    }

    getLineColor(object) {
        if (object instanceof THREE.Line && object.material?.color) {
            return '#' + object.material.color.getHexString();
        }
        const edgeChild = object.children?.find(child => child instanceof THREE.LineSegments && child.material?.color);
        return edgeChild ? '#' + edgeChild.material.color.getHexString() : '#000000';
    }

    setupPropertyHandlers(object) {
        // Position
        ['x', 'y', 'z'].forEach(axis => {
            const input = document.getElementById(`prop-pos-${axis}`);
            if (input) {
                input.addEventListener('change', () => {
                    object.position[axis] = parseFloat(input.value);
                    if (object.updateMatrixWorld) object.updateMatrixWorld();
                    if (this.app && this.app.render) this.app.render();
                });
            }
        });

       

        // Style de ligne
        const lineTypeSelect = document.getElementById('prop-line-type');
        if ( lineTypeSelect) {
            lineTypeSelect.addEventListener('change', () => {
                this.updateLineStyle(object, lineTypeSelect.value);
                // Afficher/masquer l'échelle des tirets
                const dashScaleDiv = document.getElementById('dash-scale-control');
                if (dashScaleDiv) {
                    dashScaleDiv.style.display = lineTypeSelect.value === 'solid' ? 'none' : 'flex';
                }
            });
        }

       

        const lineWidthInput = document.getElementById('prop-line-width');
        if (lineWidthInput) {
            lineWidthInput.addEventListener('change', () => {
                this.updateLineWidth(object, parseFloat(lineWidthInput.value));
            });
        }

        const dashScaleInput = document.getElementById('prop-dash-scale');
        if (dashScaleInput) {
            dashScaleInput.addEventListener('change', () => {
                this.updateDashScale(object, parseFloat(dashScaleInput.value));
            });
        }

        const lineColorInput = document.getElementById('prop-line-color');
        if (lineColorInput) {
            lineColorInput.addEventListener('input', () => {
                this.updateLineColor(object, lineColorInput.value);
            });
        }

        // Dimensions géométrie
        if (object.geometry && object.geometry.parameters) {
            if (object.geometry instanceof THREE.PlaneGeometry) {
                const widthInput = document.getElementById('prop-width');
                const heightInput = document.getElementById('prop-height');
                if (widthInput && heightInput) {
                    widthInput.addEventListener('change', () => {
                        this.updateRectangleDimensions(object, parseFloat(widthInput.value), parseFloat(heightInput.value));
                    });
                    heightInput.addEventListener('change', () => {
                        this.updateRectangleDimensions(object, parseFloat(widthInput.value), parseFloat(heightInput.value));
                    });
                }
            } else if (object.geometry instanceof THREE.CircleGeometry) {
                const radiusInput = document.getElementById('prop-radius');
                if (radiusInput) {
                    radiusInput.addEventListener('change', () => {
                        this.updateCircleRadius(object, parseFloat(radiusInput.value));
                    });
                }
            } else if (object.geometry instanceof THREE.BoxGeometry) {
                const widthInput = document.getElementById('prop-width');
                const depthInput = document.getElementById('prop-depth');
                const heightInput = document.getElementById('prop-height');
                if (widthInput && depthInput && heightInput) {
                    const updateBox = () => {
                        this.updateBoxDimensions(object,
                            parseFloat(widthInput.value),
                            parseFloat(depthInput.value),
                            parseFloat(heightInput.value)
                        );
                    };
                    widthInput.addEventListener('change', updateBox);
                    depthInput.addEventListener('change', updateBox);
                    heightInput.addEventListener('change', updateBox);
                }
            }
        }
    }

    updateLineStyle(object, lineType) {
        object.userData.lineType = lineType;

        // Définir dash/gap selon le type
        let dashSize = 3, gapSize = 2;
        if (lineType === 'dotted') { dashSize = 0.5; gapSize = 0.5; }
        if (lineType === 'dashdot') { dashSize = 2; gapSize = 1; }
        if (object.userData.dashScale === undefined) object.userData.dashScale = 1;

        // Couleur et largeur courantes
        const color = (object.material && object.material.color) ? object.material.color.getHex() : 0x000000;
        const width = object.userData.lineWidth || 2;

        // Toujours créer un nouveau matériau (évite le retour à LineBasicMaterial lors du "unhighlight")
        let newMaterial;
        if (lineType === 'solid') {
            newMaterial = new THREE.LineBasicMaterial({ color, linewidth: width });
        } else {
            newMaterial = new THREE.LineDashedMaterial({
                color,
                linewidth: width,
                scale: object.userData.dashScale,
                dashSize,
                gapSize
            });
        }

        // Appliquer le matériau à la ligne
        object.material = newMaterial;

        // Pour les lignes dashed, il faut recalculer les distances
        if (lineType !== 'solid' && typeof object.computeLineDistances === 'function') {
            object.computeLineDistances();
        }

        // Appliquer aussi aux contours (si besoin)
        if (object.children) {
            object.children.forEach(child => {
                if (child instanceof THREE.LineSegments) {
                    child.material = newMaterial.clone();
                    if (lineType !== 'solid' && typeof child.computeLineDistances === 'function') {
                        child.computeLineDistances();
                    }
                }
            });
        }

        // Supprimer tout "originalMaterial" pour éviter le retour à l'ancien style lors du unhighlight
        if (object.userData.originalMaterial) {
            delete object.userData.originalMaterial;
        }
        if (object.children) {
            object.children.forEach(child => {
                if (child.userData && child.userData.originalMaterial) {
                    delete child.userData.originalMaterial;
                }
            });
        }

        if (this.app && this.app.render) this.app.render();
    }

    updateLineWidth(object, width) {
        object.userData.lineWidth = width;

        // Pour forcer la prise en compte de la largeur, il faut recréer le matériau à chaque changement
        const lineType = object.userData.lineType || 'solid';
        let dashSize = 3, gapSize = 2;
        if (lineType === 'dotted') { dashSize = 0.5; gapSize = 0.5; }
        if (lineType === 'dashdot') { dashSize = 2; gapSize = 1; }
        const color = (object.material && object.material.color) ? object.material.color.getHex() : 0x000000;

        let newMaterial;
        if (lineType === 'solid') {
            newMaterial = new THREE.LineBasicMaterial({ color, linewidth: width });
        } else {
            newMaterial = new THREE.LineDashedMaterial({
                color,
                linewidth: width,
                scale: object.userData.dashScale || 1,
                dashSize,
                gapSize
            });
        }
        object.material = newMaterial;
        if (lineType !== 'solid' && typeof object.computeLineDistances === 'function') {
            object.computeLineDistances();
        }

        // Appliquer aussi aux contours
        if (object.children) {
            object.children.forEach(child => {
                if (child instanceof THREE.LineSegments) {
                    child.material = newMaterial.clone();
                    if (lineType !== 'solid' && typeof child.computeLineDistances === 'function') {
                        child.computeLineDistances();
                    }
                }
            });
        }

        // Supprimer tout "originalMaterial" pour éviter le retour à l'ancien style lors du unhighlight
        if (object.userData.originalMaterial) {
            delete object.userData.originalMaterial;
        }
        if (object.children) {
            object.children.forEach(child => {
                if (child.userData && child.userData.originalMaterial) {
                    delete child.userData.originalMaterial;
                }
            });
        }

        if (this.app && this.app.render) this.app.render();
    }

    updateDashScale(object, scale) {
        object.userData.dashScale = scale;
        if (object.material && object.material instanceof THREE.LineDashedMaterial) {
            object.material.scale = scale;
            object.material.needsUpdate = true;
        }
        if (object.children) {
            object.children.forEach(child => {
                if (child.material && child.material instanceof THREE.LineDashedMaterial) {
                    child.material.scale = scale;
                    child.material.needsUpdate = true;
                }
            });
        }
        if (this.app && this.app.render) this.app.render();
    }

    updateLineColor(object, color) {
        if (object.material) {
            object.material.color.set(color);
            object.material.needsUpdate = true;
        }
        if (object.children) {
            object.children.forEach(child => {
                if (child.material) {
                    child.material.color.set(color);
                    child.material.needsUpdate = true;
                }
            });
        }
        if (this.app && this.app.render) this.app.render();
    }

    updateRectangleDimensions(object, width, height) {
        // ...votre logique pour redimensionner un rectangle...
        if (this.app && this.app.render) this.app.render();
    }

    updateCircleRadius(object, radius) {
        // ...votre logique pour redimensionner un cercle...
        if (this.app && this.app.render) this.app.render();
    }

    updateBoxDimensions(object, width, depth, height) {
        // Vérifier que c'est bien une BoxGeometry
        if (!(object.geometry instanceof THREE.BoxGeometry)) return;

        // Remplacer la géométrie par une nouvelle avec les nouvelles dimensions
        const oldGeometry = object.geometry;
        object.geometry = new THREE.BoxGeometry(width, height, depth);

        // Conserver la position, rotation, etc.
        object.geometry.computeBoundingBox();
        object.geometry.computeBoundingSphere();

        // Libérer l'ancienne géométrie
        oldGeometry.dispose();

        // Si l'objet a des edges/contours, il faut aussi les mettre à jour
        if (object.children) {
            object.children.forEach(child => {
                if (child instanceof THREE.LineSegments) {
                    // Supprimer l'ancien contour
                    object.remove(child);
                    if (child.geometry) child.geometry.dispose();
                }
            });
            // Ajouter un nouveau contour
            const edges = new THREE.EdgesGeometry(object.geometry);
            const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
            const line = new THREE.LineSegments(edges, edgeMaterial);
            object.add(line);
        }

        if (this.app && this.app.render) this.app.render();
    }
}
