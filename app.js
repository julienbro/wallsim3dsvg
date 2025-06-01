import * as THREE from 'three';
import { WebCAD } from './js/core/WebCAD.js';

// Liste des modules à charger
const loadingSteps = [
    { message: "Chargement de Three.js...", duration: 300 },
    { message: "Initialisation du moteur 3D...", duration: 400 },
    { message: "Chargement des outils de dessin...", duration: 300 },
    { message: "Configuration de l'interface...", duration: 350 },
    { message: "Chargement des textures de murs...", duration: 400 },
    { message: "Initialisation du gestionnaire de fichiers...", duration: 200 },
    { message: "Configuration des contrôles...", duration: 300 },
    { message: "Chargement du système d'éclairage solaire...", duration: 250 },
    { message: "Préparation de l'espace de travail...", duration: 200 },
    { message: "Finalisation...", duration: 300 }
];

// Fonction pour simuler le chargement
async function simulateLoading() {
    const loadingText = document.getElementById('loading-text');
    const loadingProgress = document.querySelector('.loading-progress');
    const totalSteps = loadingSteps.length;
    
    for (let i = 0; i < totalSteps; i++) {
        const step = loadingSteps[i];
        
        // Mettre à jour le texte
        loadingText.textContent = step.message;
        
        // Mettre à jour la barre de progression
        const progress = ((i + 1) / totalSteps) * 100;
        loadingProgress.style.width = `${progress}%`;
        
        // Attendre avant la prochaine étape
        await new Promise(resolve => setTimeout(resolve, step.duration));
    }
    
    // Attendre un peu avant de masquer l'écran
    await new Promise(resolve => setTimeout(resolve, 500));
}

// Masquer l'écran de chargement
function hideSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    splashScreen.classList.add('fade-out');
    
    // Supprimer complètement après la transition
    setTimeout(() => {
        splashScreen.style.display = 'none';
    }, 500);
}

// Fonction pour démarrer l'application après le clic
async function startApplication() {
    const startButton = document.getElementById('start-button');
    const loadingSection = document.getElementById('loading-section');
    
    // Masquer le bouton et afficher la section de chargement
    startButton.classList.add('hidden');
    loadingSection.style.display = 'block';
    
    try {
        // Lancer la simulation de chargement
        await simulateLoading();
        
        // Créer l'instance de l'application
        window.app = new WebCAD();
        
        // Exposer THREE à window.app pour les scripts externes
        window.app.THREE = THREE;
        
        // Rendre l'application globale pour le débogage
        window.app = app;
        
        console.log('Application WallSim3D initialisée');
        
        // Masquer l'écran de chargement
        hideSplashScreen();
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        
        // En cas d'erreur, afficher un message
        const loadingText = document.getElementById('loading-text');
        loadingText.textContent = 'Erreur lors du chargement. Veuillez rafraîchir la page.';
        loadingText.style.color = '#ff4444';
    }
}

// Initialisation au chargement de la page
function initializeApp() {
    const startButton = document.getElementById('start-button');
    
    if (startButton) {
        // Ajouter l'écouteur d'événement pour le bouton démarrer
        startButton.addEventListener('click', startApplication);
    } else {
        console.error('Bouton démarrer non trouvé');
    }
}

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
