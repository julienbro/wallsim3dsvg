import { WebCAD } from './core/WebCAD.js';
import { addRectangleDeleteMethods, createTestShapes } from './WebCAD.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Application WebCAD en cours d\'initialisation...');
    
    const app = new WebCAD();
    
    // Ajouter les méthodes de suppression de rectangle et les fonctionnalités surfaces
    addRectangleDeleteMethods(app);
    
    // S'assurer que l'app est globalement accessible pour le débogage
    window.app = app;
    
    // Ajouter un bouton pour créer des formes de test
    const testButton = document.createElement('button');
    testButton.textContent = 'Créer Formes Test';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1001;
    `;
    testButton.onclick = () => createTestShapes(app);
    document.body.appendChild(testButton);
    
    console.log('Application WebCAD initialisée avec fonctionnalités surfaces');
    console.log('Raccourcis: Ctrl+Shift+S (créer surfaces), Ctrl+Shift+E (extruder)');
});
