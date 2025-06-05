// Test script pour vérifier le fonctionnement de l'application principale
console.log('🧪 Test de l\'application principale...');

// Fonction pour simuler un clic sur le bouton de la bibliothèque d'éléments
function testElementsLibraryModal() {
    return new Promise((resolve) => {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => performTest(resolve), 1000);
            });
        } else {
            setTimeout(() => performTest(resolve), 1000);
        }
    });
}

function performTest(resolve) {
    console.log('🔍 Recherche du bouton de la bibliothèque d\'éléments...');
    
    // Chercher le bouton qui ouvre la modal de la bibliothèque
    const elementsButton = document.querySelector('button[onclick*="showElementsLibrary"]') ||
                          document.querySelector('#elements-library-btn') ||
                          document.querySelector('[data-action="elements-library"]');
    
    if (elementsButton) {
        console.log('✅ Bouton bibliothèque trouvé:', elementsButton);
        
        // Simuler un clic sur le bouton
        elementsButton.click();
        
        // Attendre un peu pour que la modal s'ouvre
        setTimeout(() => {
            const modal = document.querySelector('#elements-library-modal') ||
                         document.querySelector('.modal') ||
                         document.querySelector('[data-modal="elements-library"]');
            
            if (modal && (modal.style.display !== 'none' || modal.classList.contains('show'))) {
                console.log('✅ Modal bibliothèque ouverte avec succès');
                
                // Chercher l'onglet planchers
                const planchersTab = document.querySelector('[data-category="planchers"]') ||
                                   document.querySelector('button[onclick*="planchers"]');
                
                if (planchersTab) {
                    console.log('✅ Onglet planchers trouvé, test du clic...');
                    planchersTab.click();
                    
                    // Attendre que le contenu se charge
                    setTimeout(() => {
                        const hourdisElement = document.querySelector('[data-element="Hourdis 60+13"]') ||
                                             document.querySelector('.element-item:contains("Hourdis")') ||
                                             Array.from(document.querySelectorAll('.element-item')).find(el => 
                                                 el.textContent.includes('Hourdis') || el.textContent.includes('60+13')
                                             );
                        
                        if (hourdisElement) {
                            console.log('✅ Élément Hourdis trouvé dans la liste');
                            
                            // Vérifier si il y a un canvas WebGL (preview GLB)
                            const glbCanvas = hourdisElement.querySelector('canvas');
                            const cssPreview = hourdisElement.querySelector('.preview-cube');
                            
                            if (glbCanvas) {
                                console.log('🎉 SUCCESS: Preview GLB WebGL détecté pour Hourdis!');
                                resolve({ success: true, type: 'glb', element: hourdisElement });
                            } else if (cssPreview) {
                                console.log('ℹ️ Preview CSS cube détecté (pas GLB)');
                                resolve({ success: false, type: 'css', element: hourdisElement });
                            } else {
                                console.log('⚠️ Aucun preview détecté pour Hourdis');
                                resolve({ success: false, type: 'none', element: hourdisElement });
                            }
                        } else {
                            console.log('❌ Élément Hourdis non trouvé');
                            resolve({ success: false, error: 'hourdis_not_found' });
                        }
                    }, 2000);
                } else {
                    console.log('❌ Onglet planchers non trouvé');
                    resolve({ success: false, error: 'planchers_tab_not_found' });
                }
            } else {
                console.log('❌ Modal bibliothèque non ouverte');
                resolve({ success: false, error: 'modal_not_opened' });
            }
        }, 1000);
    } else {
        console.log('❌ Bouton bibliothèque non trouvé');
        resolve({ success: false, error: 'button_not_found' });
    }
}

// Exporter la fonction de test
if (typeof window !== 'undefined') {
    window.testElementsLibraryModal = testElementsLibraryModal;
    
    // Auto-lancement du test après chargement
    testElementsLibraryModal().then(result => {
        console.log('📊 Résultat du test:', result);
        
        if (result.success) {
            console.log('🎉 TEST RÉUSSI: Le système de preview GLB fonctionne!');
        } else {
            console.log('⚠️ TEST PARTIEL: Preview GLB non détecté, erreur:', result.error || result.type);
        }
    }).catch(error => {
        console.error('❌ Erreur pendant le test:', error);
    });
}
