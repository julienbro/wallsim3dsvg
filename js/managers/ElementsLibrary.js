import * as THREE from 'three';

export class ElementsLibrary {
    constructor(app) {
        this.app = app;
        this.modelCache = new Map();
        
        // Configuration des éléments de construction
        this.elementsConfig = {
            briques: {
                'Brique M50': { 
                    dims: { x: 19, y: 9, z: 5 },
                    color: 0xB87333,
                    cuts: [1, 0.75, 0.5, 0.25]
                },
                'Brique M57': { 
                    dims: { x: 19, y: 9, z: 5.7 },
                    color: 0xB87333,
                    cuts: [1, 0.75, 0.5, 0.25]
                },
                'Brique M65': { 
                    dims: { x: 19, y: 9, z: 6.5 },
                    color: 0xB87333,
                    cuts: [1, 0.75, 0.5, 0.25]
                },
                'Brique M90': { 
                    dims: { x: 19, y: 9, z: 9 },
                    color: 0xB87333,
                    cuts: [1, 0.75, 0.5, 0.25]
                },
                'Brique WF': { 
                    dims: { x: 21, y: 10, z: 5 },
                    color: 0xB87333,
                    cuts: [1, 0.75, 0.5, 0.25]
                },
                'Brique WFD': { 
                    dims: { x: 21, y: 10, z: 6.5 },
                    color: 0xB87333,
                    cuts: [1, 0.75, 0.5, 0.25]
                }
            },
            blocs: {
                'Bloc B9': { 
                    path: 'blocs/bloc-b9.glb',
                    dims: { x: 39, y: 19, z: 9 },
                    color: 0xCCCCCC
                },
                'Bloc B14': { 
                    path: 'blocs/bloc-b14.glb',
                    dims: { x: 39, y: 19, z: 14 },
                    color: 0xCCCCCC
                },
                'Bloc B19': { 
                    path: 'blocs/bloc-b19.glb',
                    dims: { x: 39, y: 19, z: 19 },
                    color: 0xCCCCCC
                },
                'Bloc B29': { 
                    path: 'blocs/bloc-b29.glb',
                    dims: { x: 39, y: 19, z: 29 },
                    color: 0xCCCCCC
                },
                'Bloc Argex 39x9x19': { 
                    path: 'blocs/bloc-argex-9.glb',
                    dims: { x: 39, y: 19, z: 9 },
                    color: 0x999999
                },
                'Bloc Argex 39x14x19': { 
                    path: 'blocs/bloc-argex-14.glb',
                    dims: { x: 39, y: 19, z: 14 },
                    color: 0x999999
                },
                'Bloc Argex 39x19x19': { 
                    path: 'blocs/bloc-argex-19.glb',
                    dims: { x: 39, y: 19, z: 19 },
                    color: 0x999999
                },
                'Bloc béton cell. 5cm': { 
                    path: 'blocs/bloc-beton-cell-5.glb',
                    dims: { x: 60, y: 25, z: 5 },
                    color: 0xF0F0F0
                },
                'Bloc béton cell. 7cm': { 
                    path: 'blocs/bloc-beton-cell-7.glb',
                    dims: { x: 60, y: 25, z: 7 },
                    color: 0xF0F0F0
                },
                'Bloc béton cell. 10cm': { 
                    path: 'blocs/bloc-beton-cell-10.glb',
                    dims: { x: 60, y: 25, z: 10 },
                    color: 0xF0F0F0
                },
                'Bloc béton cell. 15cm': { 
                    path: 'blocs/bloc-beton-cell-15.glb',
                    dims: { x: 60, y: 25, z: 15 },
                    color: 0xF0F0F0
                },
                'Bloc béton cell. 20cm': { 
                    path: 'blocs/bloc-beton-cell-20.glb',
                    dims: { x: 60, y: 25, z: 20 },
                    color: 0xF0F0F0
                },
                'Stepoc15N': {
                    type: 'glb',
                    path: 'blocs/stepoc15N.glb',
                    dims: { x: 39, y: 19, z: 15 },
                    color: 0xCCCCCC,
                    cuts: [1, 0.75, 0.5, 0.25]
                }
            },
            linteaux: {
                'Linteau L120_14': { 
                    path: 'linteaux/linteau-l120-14.glb',
                    dims: { x: 120, y: 19, z: 14 },
                    color: 0x808080
                },
                'Linteau L140_14': { 
                    path: 'linteaux/linteau-l140-14.glb',
                    dims: { x: 140, y: 19, z: 14 },
                    color: 0x808080
                },
                'Linteau L160_14': { 
                    path: 'linteaux/linteau-l160-14.glb',
                    dims: { x: 160, y: 19, z: 14 },
                    color: 0x808080
                },
                'Linteau L180_14': { 
                    path: 'linteaux/linteau-l180-14.glb',
                    dims: { x: 180, y: 19, z: 14 },
                    color: 0x808080
                },
                'Linteau L200_14': { 
                    path: 'linteaux/linteau-l200-14.glb',
                    dims: { x: 200, y: 19, z: 14 },
                    color: 0x808080
                }
            },
            isolants: {
                'Isolant PUR5': { 
                    path: 'isolants/isolant-pur5.glb',
                    dims: { x: 120, y: 60, z: 5 },
                    color: 0xFFFF99
                },
                'Isolant PUR6': { 
                    path: 'isolants/isolant-pur6.glb',
                    dims: { x: 120, y: 60, z: 6 },
                    color: 0xFFFF99
                },                'Isolant PUR7': { 
                    path: 'isolants/isolant-pur7.glb',
                    dims: { x: 120, y: 60, z: 7 },
                    color: 0xFFFF99
                }
            },            planchers: {
                'Hourdis 60+13': { 
                    type: 'glb',
                    path: 'planchers/hourdis_60_13.glb',
                    dims: { x: 60, y: 20, z: 13 },
                    color: 0x808080,
                    customLength: true
                }
            },
            autres: {
                'Vide': { 
                    path: 'autres/vide.glb',
                    dims: { x: 10, y: 10, z: 10 },
                    color: 0xEEEEEE,
                    transparent: true,
                    opacity: 0.3
                },
                'Profil': { 
                    path: 'autres/profil.glb',
                    dims: { x: 10, y: 10, z: 10 },
                    color: 0x444444
                }
            }
        };
    }

    async loadModel(elementName, category) {
        const config = this.elementsConfig[category]?.[elementName];
        if (!config) {
            console.warn(`Configuration non trouvée pour: ${elementName} dans ${category}`);
            return this.createFallbackGeometry(elementName, category);
        }

        const cacheKey = `${category}/${elementName}`;
        
        // Vérifier le cache
        if (this.modelCache.has(cacheKey)) {
            return this.modelCache.get(cacheKey).clone();
        }

        // Essayer d'abord GLB, puis STL si GLB non disponible
        const modelPath = this.basePath + config.path;
        const stlPath = modelPath.replace('.glb', '.stl');

        try {
            // Vérifier si le fichier GLB existe
            const response = await fetch(modelPath, { method: 'HEAD' });
            if (response.ok) {
                // Charger le modèle GLB (préféré)
                const model = await this.loadGLBModel(modelPath, config);
                this.modelCache.set(cacheKey, model);
                return model.clone();
            } else {
                // Si GLB n'existe pas, essayer STL
                const stlResponse = await fetch(stlPath, { method: 'HEAD' });
                if (stlResponse.ok) {
                    console.log(`GLB non trouvé, chargement du STL pour ${elementName}`);
                    const model = await this.loadSTLModel(stlPath, config);
                    this.modelCache.set(cacheKey, model);
                    return model.clone();
                } else {
                    // Ni GLB ni STL disponible
                    console.log(`Aucun modèle 3D trouvé pour ${elementName}, création d'une géométrie de substitution`);
                    return this.createFallbackGeometry(elementName, category);
                }
            }
        } catch (error) {
            console.warn(`Erreur lors du chargement du modèle:`, error);
            return this.createFallbackGeometry(elementName, category);
        }
    }    async loadGLBModel(path, config) {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        
        return new Promise((resolve, reject) => {
            // Essayer de charger le fichier comme ArrayBuffer pour plus de fiabilité
            fetch(path)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Impossible de charger ${path}: ${response.status}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    console.log(`Chargement du modèle GLB depuis la bibliothèque: ${path}`);
                    console.log(`Taille du fichier: ${arrayBuffer.byteLength} bytes`);
                    
                    loader.parse(
                        arrayBuffer,
                        '', // resource path
                        (gltf) => {
                            console.log(`Modèle GLB chargé avec succès depuis la bibliothèque: ${path}`);
                            const model = gltf.scene;
                            model.userData.elementConfig = config;
                            
                            // Appliquer la même rotation que dans processGLTFScene (+90° sur l'axe X)
                            model.rotation.set(Math.PI / 2, 0, 0);
                            console.log(`Rotation +90° sur l'axe X appliquée au modèle de la bibliothèque`);
                            
                            // Appliquer l'échelle correcte si nécessaire
                            const box = new THREE.Box3().setFromObject(model);
                            const size = box.getSize(new THREE.Vector3());
                            
                            // Si le modèle n'est pas à la bonne échelle, l'ajuster
                            const targetSize = new THREE.Vector3(config.dims.x, config.dims.y, config.dims.z);
                            const scaleX = targetSize.x / size.x;
                            const scaleY = targetSize.y / size.y;
                            const scaleZ = targetSize.z / size.z;
                            
                            // Utiliser l'échelle uniforme la plus petite pour préserver les proportions
                            const uniformScale = Math.min(scaleX, scaleY, scaleZ);
                            if (Math.abs(uniformScale - 1) > 0.01) {
                                model.scale.multiplyScalar(uniformScale);
                                console.log(`Échelle appliquée au modèle de la bibliothèque: ${uniformScale}`);
                            }
                            
                            resolve(model);
                        },
                        (error) => {
                            console.error(`Erreur lors du parsing du modèle GLB de la bibliothèque: ${path}`, error);
                            reject(error);
                        }
                    );
                })
                .catch(error => {
                    console.error(`Erreur lors du chargement du fichier GLB de la bibliothèque: ${path}`, error);
                    reject(error);
                });
        });
    }

    async loadSTLModel(path, config) {
        const { STLLoader } = await import('three/addons/loaders/STLLoader.js');
        const loader = new STLLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                path,
                (geometry) => {
                    // Créer un matériau avec la couleur de la configuration
                    const material = new THREE.MeshPhongMaterial({
                        color: config.color,
                        side: THREE.DoubleSide
                    });
                    
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.userData.elementConfig = config;
                    
                    // Centrer et mettre à l'échelle
                    geometry.center();
                    const box = new THREE.Box3().setFromObject(mesh);
                    const size = box.getSize(new THREE.Vector3());
                    
                    const targetSize = new THREE.Vector3(config.dims.x, config.dims.y, config.dims.z);
                    const scaleX = targetSize.x / size.x;
                    const scaleY = targetSize.y / size.y;
                    const scaleZ = targetSize.z / size.z;
                    
                    const uniformScale = Math.min(scaleX, scaleY, scaleZ);
                    if (Math.abs(uniformScale - 1) > 0.01) {
                        mesh.scale.multiplyScalar(uniformScale);
                    }
                    
                    const group = new THREE.Group();
                    group.add(mesh);
                    group.userData.elementConfig = config;
                    group.userData.isSTLFallback = true;
                    
                    resolve(group);
                },
                (progress) => {
                    // Progress callback si besoin
                },
                reject
            );
        });
    }

    createFallbackGeometry(elementName, category) {
        const config = this.elementsConfig[category]?.[elementName];
        if (!config) {
            console.error(`Configuration non trouvée pour: ${elementName}`);
            return null;
        }

        // Créer une boîte simple comme géométrie de substitution
        const geometry = new THREE.BoxGeometry(
            config.dims.x,
            config.dims.z, // Z devient la hauteur en Three.js
            config.dims.y
        );

        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            transparent: config.transparent || false,
            opacity: config.opacity || 1.0,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.elementConfig = config;
        mesh.userData.isFallback = true; // Marquer comme géométrie de substitution

        const group = new THREE.Group();
        group.add(mesh);
        group.userData.elementConfig = config;

        return group;
    }

    getAllElements() {
        const elements = [];
        for (const [category, items] of Object.entries(this.elementsConfig)) {
            for (const [name, config] of Object.entries(items)) {
                elements.push({
                    name,
                    category,
                    ...config
                });
            }
        }
        return elements;
    }

    getElementsByCategory(category) {
        return this.elementsConfig[category] || {};
    }
}
