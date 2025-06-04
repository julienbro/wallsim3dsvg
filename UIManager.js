<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WallSim3D - Simulateur de murs 3D</title>
    <link rel="stylesheet" href="styles.css">
    
    <!-- Font Awesome pour les icônes -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Import map pour Three.js -->
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/"
        }
    }
    </script>
</head>
<body>
    <!-- Écran de chargement -->
    <div id="splash-screen" class="splash-screen">
        <div class="splash-content">
            <div class="splash-logo">
                <img src="https://wallsim3d.com/logo/accueil.png" alt="WallSim3D">
            </div>
            <div class="splash-info">
                <!-- <h1>WallSim3D</h1> -->
                <!-- <p class="splash-version">Version 2.0.1</p> -->
                <button id="start-button" class="start-button">
                    <i class="fas fa-play"></i>
                    <span>Démarrer</span>
                </button>
                <div class="loading-section" id="loading-section" style="display: none;">
                    <div class="loading-bar">
                        <div class="loading-progress"></div>
                    </div>
                    <p class="loading-text" id="loading-text">Initialisation...</p>
                </div>
            </div>
        </div>
    </div>

    <div class="app-container">
        <!-- Barre de menu supérieure -->
        <div class="menubar">
            <div class="menu-item dropdown">
                <span>Fichier</span>
                <div class="dropdown-content">
                    <a href="#" id="new-project">Nouveau</a>
                    <a href="#" id="open-project">Ouvrir</a>
                    <a href="#" id="save-project">Enregistrer</a>
                    <a href="#" id="export-project">Exporter</a>
                </div>
            </div>
            <div class="menu-item dropdown">
                <span>Édition</span>
                <div class="dropdown-content">
                    <a href="#" id="undo">Annuler</a>
                    <a href="#" id="redo">Rétablir</a>
                    <a href="#" id="copy">Copier</a>
                    <a href="#" id="paste">Coller</a>
                    <a href="#" id="delete">Supprimer</a>
                </div>
            </div>
            <div class="menu-item dropdown">
                <span>Vue</span>
                <div class="dropdown-content">
                    <a href="#" id="view-top">Vue de dessus</a>
                    <a href="#" id="view-front">Vue de face</a>
                    <a href="#" id="view-right">Vue de droite</a>
                    <a href="#" id="view-iso">Vue isométrique</a>
                    <a href="#" id="toggle-grid">Afficher/Masquer grille</a>
                </div>
            </div>
            <!-- Logo centré -->
            <div class="menu-logo">
                <img src="https://wallsim3d.com/logo/logo1.png" alt="Logo">
            </div>
            <!-- Ajout des boutons Annuler/Rétablir à droite -->
            <div style="margin-left:auto; display:flex; align-items:center; gap:4px;">
                <button class="toolbar-btn" id="toolbar-undo" data-tooltip="Annuler (Ctrl+Z)">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="toolbar-btn" id="toolbar-redo" data-tooltip="Rétablir (Ctrl+Y)">
                    <i class="fas fa-redo"></i>
                </button>
            </div>
        </div>

        <!-- Barre d'outils principale -->
        <div class="toolbar">
            <!-- Boutons Fichier -->
            <div class="toolbar-group">
                <button class="toolbar-btn" id="toolbar-new">
                    <i class="fas fa-file-plus"></i>
                    <span class="toolbar-btn-text">Nouveau</span>
                </button>
                <button class="toolbar-btn" id="toolbar-open">
                    <i class="fas fa-folder-open"></i>
                    <span class="toolbar-btn-text">Ouvrir</span>
                </button>
                <button class="toolbar-btn" id="toolbar-save">
                    <i class="fas fa-save"></i>
                    <span class="toolbar-btn-text">Enregistrer</span>
                </button>
                <button class="toolbar-btn" id="toolbar-export">
                    <i class="fas fa-file-export"></i>
                    <span class="toolbar-btn-text">Exporter</span>
                </button>
            </div>
            
            <div class="toolbar-separator"></div>
            
            <!-- Boutons Édition -->
            <div class="toolbar-group">
                <button class="toolbar-btn" id="toolbar-copy">
                    <i class="fas fa-copy"></i>
                    <span class="toolbar-btn-text">Copier</span>
                </button>
                <button class="toolbar-btn" id="toolbar-cut">
                    <i class="fas fa-cut"></i>
                    <span class="toolbar-btn-text">Couper</span>
                </button>
                <button class="toolbar-btn" id="toolbar-paste">
                    <i class="fas fa-paste"></i>
                    <span class="toolbar-btn-text">Coller</span>
                </button>
                <button class="toolbar-btn" id="toolbar-delete">
                    <i class="fas fa-trash-alt"></i>
                    <span class="toolbar-btn-text">Supprimer</span>
                </button>
            </div>
            
            <div class="toolbar-separator"></div>
            
            <!-- Boutons Vue et Navigation -->
            <div class="toolbar-group">
                <button class="toolbar-btn" id="toolbar-zoom-in">
                    <i class="fas fa-search-plus"></i>
                    <span class="toolbar-btn-text">Zoom +</span>
                </button>
                <button class="toolbar-btn" id="toolbar-zoom-out">
                    <i class="fas fa-search-minus"></i>
                    <span class="toolbar-btn-text">Zoom -</span>
                </button>
                <button class="toolbar-btn" id="toolbar-zoom-extents">
                    <i class="fas fa-expand-arrows-alt"></i>
                    <span class="toolbar-btn-text">Tout voir</span>
                </button>
                <button class="toolbar-btn" id="toolbar-orbit">
                    <i class="fas fa-sync-alt"></i>
                    <span class="toolbar-btn-text">Orbite</span>
                </button>
            </div>
            
            <div class="toolbar-separator"></div>
            
            <!-- Boutons Vues prédéfinies -->
            <div class="toolbar-group">
                <button class="toolbar-btn" id="toolbar-view-top">
                    <img class="view-icon-img" src="https://wallsim3d.com/icones/vue_dessus.png" alt="Vue dessus">
                    <span class="toolbar-btn-text">Dessus</span>
                </button>
                <button class="toolbar-btn" id="toolbar-view-iso">
                    <img class="view-icon-img" src="https://wallsim3d.com/icones/vue_3d.png" alt="Vue 3D">
                    <span class="toolbar-btn-text">3D</span>
                </button>
                <button class="toolbar-btn" id="toolbar-view-front">
                    <img class="view-icon-img" src="https://wallsim3d.com/icones/vue_face.png" alt="Vue face">
                    <span class="toolbar-btn-text">Face</span>
                </button>
                <button class="toolbar-btn" id="toolbar-view-back">
                    <img class="view-icon-img" src="https://wallsim3d.com/icones/vue_arriere.png" alt="Vue arrière">
                    <span class="toolbar-btn-text">Arrière</span>
                </button>
                <button class="toolbar-btn" id="toolbar-view-right">
                    <img class="view-icon-img" src="https://wallsim3d.com/icones/vue_droite.png" alt="Vue droite">
                    <span class="toolbar-btn-text">Droite</span>
                </button>
                <button class="toolbar-btn" id="toolbar-view-left">
                    <img class="view-icon-img" src="https://wallsim3d.com/icones/vue_gauche.png" alt="Vue gauche">
                    <span class="toolbar-btn-text">Gauche</span>
                </button>
                <button class="toolbar-btn" id="toolbar-view-orbit">
                    <i class="fas fa-globe"></i>
                    <span class="toolbar-btn-text">Orbite</span>
                </button>
                <button class="toolbar-btn" id="toolbar-snap">
                    <i class="fas fa-magnet"></i>
                    <span class="toolbar-btn-text">Aimant</span>
                </button>
            </div>
        </div>

        <!-- Zone principale -->
        <div class="main-area">
            <!-- Panneau latéral gauche -->
            <div class="sidebar">
                <div class="panel" id="tools-panel">
                    <div class="panel-header" style="display: none;">
                        <h3>Outils</h3>
                    </div>
                    <div class="panel-content">
                        <div class="tool-group-container">
                            <div class="tool-group-label">
                                <span>Outils</span>
                            </div>
                            <div class="tool-group">
                                <button class="tool-btn" id="sidebar-select" title="Sélectionner">
                                    <i class="fas fa-mouse-pointer"></i>
                                </button>
                                <button class="tool-btn" id="sidebar-polyline" title="Polyligne">
                                    <i class="fas fa-draw-polygon"></i>
                                </button>
                                <button class="tool-btn" id="sidebar-rect" title="Rectangle">
                                    <i class="fas fa-square"></i>
                                </button>
                                <button class="tool-btn" id="sidebar-circle" title="Cercle">
                                    <i class="fas fa-circle"></i>
                                </button>
                                <button class="tool-btn" id="sidebar-parallel" title="Parallèle">
                                    <i class="fas fa-grip-lines"></i>
                                </button>
                                <button class="tool-btn" id="sidebar-trim" title="Découper">
                                    <i class="fas fa-cut"></i>
                                </button>
                                <button class="tool-btn" id="sidebar-extend" title="Étendre">
                                    <i class="fas fa-expand-arrows-alt"></i>
                                </button>
                                <button class="tool-btn" id="sidebar-hatch" title="Hachures">
                                    <i class="fas fa-grip-lines-vertical"></i>
                                </button>
                                <button class="tool-btn" id="sidebar-extrude" title="Extruder">
                                    <i class="fas fa-arrow-up"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Zone de visualisation -->
            <div class="viewport-container">
                <div id="viewport"></div>
                
                <!-- Axes de coordonnées -->
                <div class="axis-indicator">
                    <canvas id="axis-helper" width="100" height="100"></canvas>
                </div>

                <!-- D-pad de contrôle -->
                <div class="dpad-container" id="dpad-container">
                    <div class="dpad-title">Déplacer</div>
                    <div class="dpad">
                        <button class="dpad-btn dpad-up" id="dpad-up" title="Haut (Y+)">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <button class="dpad-btn dpad-left" id="dpad-left" title="Gauche (X-)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="dpad-btn dpad-center" id="dpad-center" title="Réinitialiser Position">
                            <i class="fas fa-crosshairs"></i>
                        </button>
                        <button class="dpad-btn dpad-right" id="dpad-right" title="Droite (X+)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="dpad-btn dpad-down" id="dpad-down" title="Bas (Y-)">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="dpad-vertical">
                        <button class="dpad-btn dpad-z-up" id="dpad-z-up" title="Monter (Z+)">
                            <i class="fas fa-arrow-up"></i> Z+
                        </button>
                        <button class="dpad-btn dpad-z-down" id="dpad-z-down" title="Descendre (Z-)">
                            <i class="fas fa-arrow-down"></i> Z-
                        </button>
                    </div>
                    <div class="dpad-step">
                        <label for="dpad-step-size">Pas:</label>
                        <input type="number" id="dpad-step-size" value="1" min="0.1" max="100" step="0.1">
                        <span>cm</span>
                    </div>
                </div>
                
                <!-- Barre d'état -->
                <div class="status-bar">
                    <span id="coordinates">X: 0.00, Y: 0.00, Z: 0.00</span>
                    <span id="mode-indicator">Mode: 2D</span>
                    <span id="snap-indicator">Accrochage: ON</span>
                    <button id="toggle-2d3d" class="btn-small">2D/3D</button>
                </div>
            </div>

            <!-- Barre latérale droite (multi-panneaux) -->
            <div class="right-sidebar" id="right-sidebar">
                <div class="sidebar-tabs">
                    <button class="sidebar-tab active" data-panel="properties">
                        <i class="fas fa-cube"></i>
                        <span>Propriétés</span>
                    </button>
                    <button class="sidebar-tab" data-panel="data">
                        <i class="fas fa-database"></i>
                        <span>Données</span>
                    </button>
                    <button class="sidebar-tab" data-panel="textures">
                        <i class="fas fa-palette"></i>
                        <span>Textures</span>
                    </button>
                    <button class="sidebar-tab" data-panel="biblio">
                        <i class="fas fa-th-large"></i>
                        <span>Biblio</span>
                    </button>
                    <button class="sidebar-tab" data-panel="layers">
                        <i class="fas fa-layer-group"></i>
                        <span>Calques</span>
                    </button>
                    <button class="sidebar-tab" data-panel="sunlight">
                        <i class="fas fa-sun"></i>
                        <span>Soleil</span>
                    </button>
                    <button class="sidebar-tab" data-panel="history">
                        <i class="fas fa-history"></i>
                        <span>Historique</span>
                    </button>
                </div>
                
                <div class="sidebar-panels">
                    <!-- Panneau Propriétés -->
                    <div class="panel sidebar-panel active" id="properties-panel">
                        <div class="panel-header">
                            <h3>Propriétés</h3>
                            <button class="panel-toggle" title="Réduire">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="panel-content" id="properties-content">
                            <p>Sélectionnez un objet pour voir ses propriétés</p>
                        </div>
                    </div>

                    <!-- Panneau Données du Projet -->
                    <div class="panel sidebar-panel" id="data-panel" style="display: none;">
                        <div class="panel-header">
                            <h3>Données du Projet</h3>
                            <button class="panel-toggle" title="Réduire">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="panel-content" id="data-content">
                            <div class="data-section">
                                <div class="form-group">
                                    <label for="project-name">Nom du Projet:</label>
                                    <input type="text" id="project-name" class="data-input" value="Nouveau Projet">
                                </div>
                                <div class="form-group">
                                    <label for="project-client">Client:</label>
                                    <input type="text" id="project-client" class="data-input" value="">
                                </div>
                                <div class="form-group">
                                    <label for="project-address">Adresse du chantier:</label>
                                    <textarea id="project-address" class="data-textarea" rows="2"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="project-description">Description:</label>
                                    <textarea id="project-description" class="data-textarea" rows="3">Description du projet.</textarea>
                                </div>
                                <div class="form-group">
                                    <label for="project-author">Auteur:</label>
                                    <input type="text" id="project-author" class="data-input" value="Utilisateur">
                                </div>
                                <div class="form-actions">
                                    <button id="save-project-data" class="btn btn-primary">
                                        <i class="fas fa-save"></i> Enregistrer Données
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Panneau Textures -->
                    <div class="panel sidebar-panel" id="textures-panel" style="display: none;">
                        <div class="panel-header">
                            <h3>Textures & Couleurs</h3>
                            <button class="panel-toggle" title="Réduire">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="panel-content">
                            <p id="texture-instruction">Sélectionnez une texture/couleur puis cliquez sur un objet pour l'appliquer</p>
                            
                            <!-- Onglets pour Textures et Couleurs -->
                            <div class="texture-tabs">
                                <button class="texture-tab active" data-tab="textures">Textures</button>
                                <button class="texture-tab" data-tab="colors">Couleurs</button>
                            </div>
                            
                            <!-- Contrôles d'ajustement -->
                            <div class="texture-controls" style="margin-bottom: 10px; display: none;" id="texture-controls">
                                <!-- ...existing code... -->
                            </div>
                            
                            <!-- Contenu des onglets -->
                            <div class="tab-content">
                                <!-- Onglet Textures -->
                                <div id="textures-tab" class="tab-panel active">
                                    <div id="texture-library" class="texture-grid">
                                        <!-- Les textures seront ajoutées dynamiquement -->
                                    </div>
                                </div>
                                
                                <!-- Onglet Couleurs -->
                                <div id="colors-tab" class="tab-panel" style="display: none;">
                                    <div class="color-section">
                                        <h4>Couleurs prédéfinies</h4>
                                        <div id="color-palette" class="color-grid">
                                            <!-- Les couleurs seront ajoutées dynamiquement -->
                                        </div>
                                    </div>
                                    
                                    <div class="color-section">
                                        <h4>Couleur personnalisée</h4>
                                        <div class="custom-color-controls">
                                            <input type="color" id="custom-color-picker" value="#ffffff">
                                            <button id="apply-custom-color" class="btn-small">Appliquer</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Panneau Bibliothèque d'éléments -->
                    <div class="panel sidebar-panel" id="biblio-panel" style="display: none;">
                        <div class="panel-header">
                            <h3>Bibliothèque d'éléments</h3>
                            <button class="panel-toggle" title="Réduire">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="panel-content">
                            <button id="show-elements-library" class="btn" style="width: 100%; margin-bottom: 10px;">
                                <i class="fas fa-shapes"></i> Éléments de construction
                            </button>
                            
                            <!-- Section des éléments utilisés dans le modèle -->
                            <div class="section-separator" style="margin: 15px 0; border-top: 1px solid #ddd;"></div>
                            <div class="used-elements-section">
                                <h4 style="margin: 10px 0; font-size: 14px; color: #555;">Éléments utilisés dans le modèle</h4>
                                <div id="used-elements-list-display" class="used-elements-grid" style="
                                    display: grid;
                                    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                                    gap: 10px;
                                    margin-top: 10px;
                                    min-height: 50px;
                                ">
                                    <!-- Le contenu sera injecté par JavaScript -->
                                </div>
                            </div>
                            
                            <!-- Modal pour la bibliothèque d'éléments -->
                            <div id="elements-modal" class="modal" style="display: none;">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h2>Bibliothèque d'éléments de construction</h2>
                                        <button class="modal-close" id="close-elements-modal">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <div class="element-categories">
                                            <button class="category-tab active" data-category="briques">Briques</button>
                                            <button class="category-tab" data-category="blocs">Blocs</button>
                                            <button class="category-tab" data-category="linteaux">Linteaux</button>
                                            <button class="category-tab" data-category="isolants">Isolants</button>
                                            <button class="category-tab" data-category="autres">Autres</button>
                                        </div>
                                        <div id="elements-grid" class="elements-grid">
                                            <!-- Les éléments seront ajoutés dynamiquement -->
                                        </div>
                                        <div id="element-options" class="element-options" style="display: none;">
                                            <h3>Options de l'élément</h3>
                                            <div id="element-options-content">
                                                <!-- Options dynamiques selon l'élément -->
                                            </div>
                                            <button id="add-element-to-scene" class="btn" style="margin-top: 10px;">
                                                <i class="fas fa-plus"></i> Ajouter à la scène
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="selected-element-info" style="margin-top: 10px;">
                                <p style="color: #888; font-size: 11px;">Aucun élément sélectionné</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Panneau Calques -->
                    <div class="panel sidebar-panel" id="layers-panel" style="display: none;">
                        <div class="panel-header">
                            <h3>Calques</h3>
                            <button class="panel-toggle" title="Réduire">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="panel-content">
                            <div id="layers-list"></div>
                            <button id="add-layer" class="btn" style="width: 100%; margin-top: 10px;">
                                <i class="fas fa-plus"></i> Nouveau calque
                            </button>
                        </div>
                    </div>
                    
                    <!-- Panneau Contrôle du soleil -->
                    <div id="sunlight-panel" class="sidebar-panel">
                        <div class="panel-header">
                            <h3>Éclairage solaire</h3>
                            <button class="panel-toggle"><i class="fas fa-chevron-up"></i></button>
                        </div>
                        <div class="panel-content">
                            <div class="control-group">
                                <label for="sun-month">Mois:</label>
                                <select id="sun-month">
                                    <option value="1">Janvier</option>
                                    <option value="2">Février</option>
                                    <option value="3">Mars</option>
                                    <option value="4">Avril</option>
                                    <option value="5">Mai</option>
                                    <option value="6" selected>Juin</option>
                                    <option value="7">Juillet</option>
                                    <option value="8">Août</option>
                                    <option value="9">Septembre</option>
                                    <option value="10">Octobre</option>
                                    <option value="11">Novembre</option>
                                    <option value="12">Décembre</option>
                                </select>
                            </div>
                            
                            <div class="control-group">
                                <label for="sun-hour">Heure: <span id="hour-display">12h</span></label>
                                <input type="range" id="sun-hour" min="6" max="18" value="12" step="0.5">
                            </div>
                            
                            <div class="control-group">
                                <label>
                                    <input type="checkbox" id="show-sun-helper"> Afficher l'indicateur solaire
                                </label>
                            </div>
                            
                            <div class="control-group">
                                <label>
                                    <input type="checkbox" id="enable-shadows" checked> Activer les ombres
                                </label>
                            </div>
                            
                            <!-- Contrôles du Nord -->
                            <div class="control-group north-controls">
                                <h4><i class="fas fa-compass"></i> Orientation du Nord</h4>
                                
                                <div class="control-group">
                                    <label>
                                        <input type="checkbox" id="show-north-indicator"> 
                                        Afficher l'indicateur Nord
                                    </label>
                                </div>
                                
                                <div class="control-group">
                                    <label for="north-angle">Angle: <span id="north-angle-display">0°</span></label>
                                    <input type="range" id="north-angle" min="0" max="359" value="0" step="1">
                                </div>
                                
                                <div class="control-group">
                                    <label for="north-angle-input">Valeur précise:</label>
                                    <input type="number" id="north-angle-input" min="0" max="359" value="0" step="0.1">
                                </div>
                                
                                <div class="preset-directions">
                                    <h5>Orienter le Nord à</h5>
                                    <div class="direction-buttons">
                                        <button class="direction-btn" data-angle="0">Nord</button>
                                        <button class="direction-btn" data-angle="90">Est
                                        <button class="direction-btn" data-angle="180">Sud</button>
                                        <button class="direction-btn" data-angle="270">Ouest</button>
                                    </div>
                                </div>
                                
                                <div class="compass-info">
                                    <small>
                                        0°=Nord • 90°=Est • 180°=Sud • 270°=Ouest
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Panneau Historique -->
                    <div class="panel sidebar-panel" id="history-panel" style="display: none;">
                        <div class="panel-header">
                            <h3>Historique</h3>
                            <button class="panel-toggle" title="Réduire">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="panel-content">
                            <div id="history-list"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Ligne de commande -->
        <div class="command-line">
            <span class="command-prompt">Commande:</span>
            <input type="text" id="command-input" placeholder="Entrez une commande...">
            <div id="command-output"></div>
        </div>
    </div>

    <!-- Chargement des scripts avec type="module" -->
    <script type="module" src="app.js"></script>
    
    <script>
    // Variable globale pour stocker l'outil actuel
    window.lastUsedTool = 'select';
    
    // Ajouter la méthode manquante immédiatement
    window.addEventListener('load', () => {
        // Intercepter les changements d'outils avec possibilité de désélection
        setTimeout(() => {
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const toolId = this.id.replace('sidebar-', '');
                    
                    // Si c'est le bouton sélectionner, toujours l'activer et désactiver les autres
                    if (toolId === 'select') {
                        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        window.lastUsedTool = 'select';
                        if (window.app && window.app.setTool) {
                            window.app.setTool('select');
                        }
                        console.log('Mode sélection activé');
                    } else {
                        // Pour les autres outils, permettre la désélection
                        if (this.classList.contains('active') && toolId === window.lastUsedTool) {
                            // Désélectionner l'outil actuel et retourner au mode sélection
                            this.classList.remove('active');
                            document.getElementById('sidebar-select').classList.add('active');
                            window.lastUsedTool = 'select';
                            if (window.app && window.app.setTool) {
                                window.app.setTool('select');
                            }
                            console.log('Outil désélectionné, retour au mode sélection');
                        } else {
                            // Activer le nouvel outil
                            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                            this.classList.add('active');
                            window.lastUsedTool = toolId;
                            console.log('Outil sélectionné:', toolId);
                        }
                    }
                });
            });
            
            // Activer le mode sélection par défaut
            document.getElementById('sidebar-select')?.classList.add('active');
        }, 1000);
        
        // Vérifier périodiquement jusqu'à ce que UIManager soit disponible
        const checkInterval = setInterval(() => {
            if (window.app && window.app.uiManager) {
                if (!window.app.uiManager.updateHistoryPanel) {
                    window.app.uiManager.updateHistoryPanel = function() {
                        console.log('updateHistoryPanel appelé (méthode temporaire)');
                        const historyList = document.getElementById('history-list');
                        if (historyList) {
                            // Mettre à jour même si le panneau n'est pas visible
                            if (window.app.history && window.app.history.length > 0) {
                                historyList.innerHTML = '';
                                
                                window.app.history.forEach((item, index) => {
                                    const historyItem = document.createElement('div');
                                    historyItem.style.cssText = 'padding: 8px 10px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 12px; transition: background-color 0.2s;';
                                    
                                    // Déterminer le texte à afficher
                                    let actionText = 'Action';
                                    
                                    // Utiliser 'action' au lieu de 'type' car c'est ce qui est dans l'historique
                                    const itemAction = item.action || item.type || '';
                                    
                                    if (itemAction === 'create') {
                                        // Utiliser l'outil stocké ou le dernier outil utilisé
                                        const toolUsed = item.tool || window.lastUsedTool || window.app.currentTool;
                                        
                                        switch(toolUsed) {
                                            case 'rect':
                                            case 'rectangle':
                                                actionText = 'Rectangle créé';
                                                break;
                                            case 'circle':
                                                actionText = 'Cercle créé';
                                                break;
                                            case 'arc':
                                                actionText = 'Arc créé';
                                                break;
                                            case 'polyline':
                                                actionText = 'Polyligne créée';
                                                break;
                                            case 'line':
                                                actionText = 'Ligne créée';
                                                break;
                                            case 'parallel':
                                                actionText = 'Parallèle créée';
                                                break;
                                            default:
                                                actionText = 'Objet créé';
                                        }
                                    } else if (itemAction === 'extrude') {
                                        actionText = 'Extrusion appliquée';
                                    } else if (itemAction === 'delete') {
                                        actionText = 'Objet supprimé';
                                    } else if (itemAction === 'move') {
                                        actionText = 'Objet déplacé';
                                    } else if (itemAction === 'rotate') {
                                        actionText = 'Objet pivoté';
                                    } else if (itemAction === 'scale') {
                                        actionText = 'Échelle modifiée';
                                    } else if (itemAction === 'texture') {
                                        actionText = 'Texture appliquée';
                                    } else if (itemAction === 'color') {
                                        actionText = 'Couleur appliquée';
                                    } else if (itemAction === 'element') {
                                        // Pour les éléments de construction
                                        if (item.elementType) {
                                            actionText = `${item.elementType} ajouté`;
                                        } else {
                                            actionText = 'Élément ajouté';
                                        }
                                    } else if (itemAction && itemAction.length > 0) {
                                        // Utiliser l'action directement si elle n'est pas reconnue
                                        actionText = itemAction.charAt(0).toUpperCase() + itemAction.slice(1);
                                    }
                                    
                                    historyItem.innerHTML = `
                                        <div style="font-weight: bold; color: #333;">${index + 1}. ${actionText}</div>
                                        ${item.timestamp ? `<div style="font-size: 10px; color: #666; margin-top: 2px;">${new Date(item.timestamp).toLocaleTimeString()}</div>` : ''}
                                    `;
                                    historyItem.onmouseenter = function() { this.style.backgroundColor = '#f5f5f5'; };
                                    historyItem.onmouseleave = function() { this.style.backgroundColor = 'transparent'; };
                                    historyItem.onclick = () => {
                                        console.log('Historique item cliqué:', index, item);
                                    };
                                    historyList.appendChild(historyItem);
                                });
                            } else {
                                historyList.innerHTML = '<p style="text-align: center; color: #999; font-size: 12px; padding: 20px;">Aucune action dans l\'historique</p>';
                            }
                        }
                    };
                    
                    // Intercepter la méthode addToHistory pour ajouter l'outil actuel
                    setTimeout(() => {
                        if (window.app && window.app.addToHistory) {
                            const originalAddToHistory = window.app.addToHistory.bind(window.app);
                            window.app.addToHistory = function(action, data = {}) {
                                // Ajouter l'outil actuel aux données
                                const enhancedData = {
                                    ...data,
                                    tool: window.lastUsedTool || window.app.currentTool
                                };
                                return originalAddToHistory(action, enhancedData);
                            };
                            console.log('Méthode addToHistory interceptée');
                        }
                    }, 2000);
                    
                    console.log('Méthode updateHistoryPanel ajoutée à UIManager');
                }
                clearInterval(checkInterval);
            }
        }, 10); // Vérifier toutes les 10ms
    });
    
    document.addEventListener('DOMContentLoaded', () => {
        // Système de tracking des éléments de construction
        window.trackedConstructionElements = window.trackedConstructionElements || [];

        const elementDisplayInfo = {
            'brique-standard': { name: 'Brique Std.', icon: '🧱' },
            'bloc-beton': { name: 'Bloc Béton', icon: '⬜' },
            'linteau-beton': { name: 'Linteau', icon: '━' },
            'isolant-laine': { name: 'Isolant', icon: '🟨' },
            'brique-m90': { name: 'Brique M90', icon: '🧱' },
            'brique-m65': { name: 'Brique M65', icon: '🧱' },
            'brique': { name: 'Brique', icon: '🧱' },
            'bloc': { name: 'Bloc', icon: '⬜' },
            'linteau': { name: 'Linteau', icon: '━' },
            'isolant': { name: 'Isolant', icon: '🟨' },
            'unknown': { name: 'Élément', icon: '📦' }
        };

        function updateUsedElementsDisplay() {
            const displayList = document.getElementById('used-elements-list-display');
            if (!displayList) return;
            
            displayList.innerHTML = '';

            const counts = {};
            window.trackedConstructionElements.forEach(elementObj => {
                if (elementObj && elementObj.type) {
                    counts[elementObj.type] = (counts[elementObj.type] || 0) + 1;
                }
            });

            if (Object.keys(counts).length === 0) {
                displayList.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #999; font-size: 12px;">Aucun élément utilisé dans le modèle</p>`;
                return;
            }

            for (const type in counts) {
                const info = elementDisplayInfo[type] || elementDisplayInfo['unknown'];
                const count = counts[type];
                const itemDiv = document.createElement('div');
                itemDiv.style.cssText = `
                    padding: 8px; text-align: center; background: #f9f9f9; 
                    border: 1px solid #eee; border-radius: 4px; font-size: 11px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer;
                `;
                itemDiv.innerHTML = `
                    <div style="font-size: 20px; margin-bottom: 2px;">${info.icon}</div>
                    <div>${info.name}</div>
                    <div style="font-size: 10px; color: #777;">(x${count})</div>
                `;
                itemDiv.onmouseenter = function() { this.style.background = '#f0f0f0'; };
                itemDiv.onmouseleave = function() { this.style.background = '#f9f9f9'; };
                displayList.appendChild(itemDiv);
            }
        }
        window.updateUsedElementsDisplay = updateUsedElementsDisplay;

        function addTrackedElementWithUUID(elementType, uuid) {
            if (elementType && uuid) {
                if (!window.trackedConstructionElements.find(el => el.id === uuid)) {
                    window.trackedConstructionElements.push({ type: elementType, id: uuid });
                    updateUsedElementsDisplay();
                }
            }
        }

        function removeTrackedElementByUUID(uuid) {
            const initialLength = window.trackedConstructionElements.length;
            window.trackedConstructionElements = window.trackedConstructionElements.filter(el => el.id !== uuid);
            if (window.trackedConstructionElements.length < initialLength) {
                updateUsedElementsDisplay();
            }
        }

        // Intercepter les ajouts/suppressions à la scène
        let sceneReadyCheckInterval = setInterval(() => {
            if (window.app && window.app.scene && typeof window.app.scene.add === 'function') {
                clearInterval(sceneReadyCheckInterval);

                const originalSceneAdd = window.app.scene.add;
                window.app.scene.add = function(...objects) {
                    objects.forEach(obj => {
                        if (obj && obj.uuid && obj.userData && obj.userData.isConstructionElement && obj.userData.elementType) {
                            addTrackedElementWithUUID(obj.userData.elementType, obj.uuid);
                        }
                    });
                    return originalSceneAdd.apply(this, objects);
                };

                const originalSceneRemove = window.app.scene.remove;
                window.app.scene.remove = function(...objects) {
                    objects.forEach(obj => {
                        if (obj && obj.uuid && obj.userData && obj.userData.isConstructionElement) {
                           removeTrackedElementByUUID(obj.uuid);
                        }
                    });
                    return originalSceneRemove.apply(this, objects);
                };
                
                updateUsedElementsDisplay();
            }
        }, 200);
        
        setTimeout(() => clearInterval(sceneReadyCheckInterval), 10000);

        // Gestion des onglets de la sidebar
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.sidebar-panel').forEach(p => {
                    p.style.display = 'none';
                    p.classList.remove('active');
                });
                document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
                
                this.classList.add('active');
                const panelId = this.dataset.panel + '-panel';
                const panel = document.getElementById(panelId);
                
                if (panel) {
                    panel.style.display = 'block';
                    panel.classList.add('active');
                    
                    if (this.dataset.panel === 'biblio') {
                        updateUsedElementsDisplay();
                    }
                    
                    // Mettre à jour l'historique quand on clique sur l'onglet
                    if (this.dataset.panel === 'history' && window.app && window.app.uiManager && window.app.uiManager.updateHistoryPanel) {
                        window.app.uiManager.updateHistoryPanel();
                    }
                }
            });
        });

        // Modal show/hide
        document.getElementById('show-elements-library')?.addEventListener('click', () => {
            document.getElementById('elements-modal').style.display = 'block';
        });

        document.getElementById('close-elements-modal')?.addEventListener('click', () => {
            document.getElementById('elements-modal').style.display = 'none';
        });

        // Clic en dehors de la modal pour fermer
        document.getElementById('elements-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'elements-modal') {
                e.target.style.display = 'none';
            }
        });

        updateUsedElementsDisplay();
    });
    </script>
</body>
</html>