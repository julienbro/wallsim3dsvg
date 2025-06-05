// Quick validation script to test ElementsLibrary integration
import { ElementsLibrary } from './js/managers/ElementsLibrary.js';

console.log('=== ElementsLibrary Integration Test ===');

// Mock app object
const mockApp = {
    scene: { add: () => console.log('Mock scene.add called') },
    camera: {},
    renderer: {},
    objects: []
};

try {
    // Test ElementsLibrary initialization
    const elementsLibrary = new ElementsLibrary(mockApp);
    console.log('✓ ElementsLibrary initialized successfully');

    // Test getting planchers category
    const planchers = elementsLibrary.getElementsByCategory('planchers');
    console.log('✓ Planchers category retrieved:', Object.keys(planchers));

    // Test specific element
    const hourdis = planchers['Hourdis 60+13'];
    if (hourdis) {
        console.log('✓ Hourdis 60+13 found:', hourdis);
        
        // Test path resolution
        if (hourdis.path) {
            console.log('✓ GLB path:', hourdis.path);
            const fullPath = `assets/models/${hourdis.path}`;
            console.log('✓ Full path:', fullPath);
        }
    } else {
        console.log('✗ Hourdis 60+13 not found in planchers');
    }

    // Test model loading (if needed)
    console.log('=== Starting GLB load test ===');
    elementsLibrary.loadModel('Hourdis 60+13', 'planchers')
        .then(model => {
            if (model) {
                console.log('✓ GLB model loaded successfully!');
                console.log('Model type:', model.type);
                console.log('Model position:', model.position);
                console.log('Model rotation:', model.rotation);
                console.log('Model scale:', model.scale);
                console.log('Model children:', model.children.length);
            } else {
                console.log('✗ GLB model loading returned null');
            }
        })
        .catch(error => {
            console.log('✗ GLB model loading failed:', error.message);
        });

} catch (error) {
    console.log('✗ ElementsLibrary test failed:', error.message);
}
