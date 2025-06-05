import { WebCAD } from './core/WebCAD.js';
import { addRectangleDeleteMethods } from './ui/UIManager.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Application WebCAD en cours d\'initialisation...');
    
    const app = new WebCAD();
    
    // Ajouter les méthodes de suppression de rectangle
    addRectangleDeleteMethods(app);
    
    // S'assurer que l'app est globalement accessible pour le débogage
    window.app = app;
    
    console.log('Application WebCAD initialisée avec fonctionnalités surfaces');
});
