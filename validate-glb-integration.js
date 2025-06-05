/**
 * Script de validation de l'intégration GLB Preview
 * Vérifie que tous les composants sont correctement configurés
 */

const fs = require('fs');
const path = require('path');

function validateGLBPreviewIntegration() {
    console.log('🔍 Validation de l\'integration GLB Preview...\n');
    
    const baseDir = process.cwd();
    let errors = [];
    let warnings = [];
    let successes = [];
    
    try {
        // 1. Vérifier l'existence du fichier GLB
        const glbPath = path.join(baseDir, 'assets', 'models', 'planchers', 'hourdis_60_13.glb');
        try {
            const glbStats = fs.statSync(glbPath);
            successes.push(`✅ Fichier GLB trouvé: ${glbPath} (${Math.round(glbStats.size/1024)}KB)`);
        } catch (e) {
            errors.push(`❌ Fichier GLB manquant: ${glbPath}`);
        }
        
        // 2. Vérifier ElementsLibrary.js
        const elementsLibraryPath = path.join(baseDir, 'js', 'managers', 'ElementsLibrary.js');
        try {
            const elementsLibraryContent = fs.readFileSync(elementsLibraryPath, 'utf8');
            
            // Vérifier la définition hourdis avec type GLB
            if (elementsLibraryContent.includes("'Hourdis 60+13'") && 
                elementsLibraryContent.includes("type: 'glb'") &&
                elementsLibraryContent.includes("path: 'planchers/hourdis_60_13.glb'")) {
                successes.push('✅ ElementsLibrary: Élément hourdis correctement configuré avec type GLB');
            } else if (elementsLibraryContent.includes("'Hourdis 60+13'")) {
                if (!elementsLibraryContent.includes("type: 'glb'")) {
                    errors.push('❌ ElementsLibrary: Propriété type: "glb" manquante pour hourdis');
                }
                if (!elementsLibraryContent.includes("path: 'planchers/hourdis_60_13.glb'")) {
                    errors.push('❌ ElementsLibrary: Chemin GLB incorrect pour hourdis');
                }
            } else {
                errors.push('❌ ElementsLibrary: Élément hourdis non trouvé');
            }
            
        } catch (e) {
            errors.push(`❌ Impossible de lire ElementsLibrary.js: ${e.message}`);
        }
        
        // 3. Vérifier UIManager.js
        const uiManagerPath = path.join(baseDir, 'js', 'managers', 'UIManager.js');
        try {
            const uiManagerContent = fs.readFileSync(uiManagerPath, 'utf8');
            
            // Vérifier les composants GLB preview
            const checks = [
                { pattern: 'glbPreviews = new Map()', message: 'Initialisation glbPreviews Map' },
                { pattern: 'previewCanvas = new Map()', message: 'Initialisation previewCanvas Map' },
                { pattern: 'createGLBPreview(element, previewDiv)', message: 'Méthode createGLBPreview' },
                { pattern: "element.type === 'glb' && element.path", message: 'Détection éléments GLB' },
                { pattern: 'await this.elementsLibrary.loadModel', message: 'Chargement modèle GLB' },
                { pattern: 'new THREE.WebGLRenderer', message: 'Renderer WebGL pour preview' },
                { pattern: 'requestAnimationFrame(animate)', message: 'Animation rotation GLB' }
            ];
            
            checks.forEach(check => {
                if (uiManagerContent.includes(check.pattern)) {
                    successes.push(`✅ UIManager: ${check.message}`);
                } else {
                    errors.push(`❌ UIManager: ${check.message} manquant`);
                }
            });
            
        } catch (e) {
            errors.push(`❌ Impossible de lire UIManager.js: ${e.message}`);
        }
        
        // 4. Vérifier les imports Three.js
        const indexPath = path.join(baseDir, 'index.html');
        try {
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            if (indexContent.includes('three.module.js')) {
                successes.push('✅ Import Three.js trouvé dans index.html');
            } else {
                warnings.push('⚠️ Import Three.js non trouvé dans index.html');
            }
            
            if (indexContent.includes('GLTFLoader.js')) {
                successes.push('✅ Import GLTFLoader trouvé dans index.html');
            } else {
                warnings.push('⚠️ Import GLTFLoader non trouvé dans index.html');
            }
            
        } catch (e) {
            warnings.push(`⚠️ Impossible de vérifier index.html: ${e.message}`);
        }
        
        // 5. Résumé
        console.log('\n📊 RÉSUMÉ DE LA VALIDATION\n');
        
        if (successes.length > 0) {
            console.log('🎉 SUCCÈS:');
            successes.forEach(success => console.log(`   ${success}`));
            console.log('');
        }
        
        if (warnings.length > 0) {
            console.log('⚠️  AVERTISSEMENTS:');
            warnings.forEach(warning => console.log(`   ${warning}`));
            console.log('');
        }
        
        if (errors.length > 0) {
            console.log('🚨 ERREURS:');
            errors.forEach(error => console.log(`   ${error}`));
            console.log('');
        }
        
        // Conclusion
        if (errors.length === 0) {
            console.log('🎯 CONCLUSION: Intégration GLB Preview validée avec succès!');
            console.log('   ✅ Le système de prévisualisation GLB devrait fonctionner correctement');
            console.log('   ✅ Les éléments hourdis apparaîtront avec des previews 3D WebGL');
            
            if (warnings.length > 0) {
                console.log('   ⚠️  Quelques avertissements à vérifier mais non bloquants');
            }
        } else {
            console.log('❌ CONCLUSION: Des erreurs doivent être corrigées avant utilisation');
            console.log(`   🔧 ${errors.length} erreur(s) à corriger`);
        }
        
        console.log('\n📋 ÉTAPES DE TEST RECOMMANDÉES:');
        console.log('   1. Ouvrir l\'application dans un navigateur');
        console.log('   2. Cliquer sur "Bibliothèque d\'éléments" dans le panneau droit');
        console.log('   3. Sélectionner l\'onglet "Planchers"');
        console.log('   4. Vérifier que "Hourdis 60+13" affiche une preview 3D rotative');
        console.log('   5. Comparer avec les autres éléments qui utilisent des cubes CSS');
        
    } catch (error) {
        console.error('❌ Erreur lors de la validation:', error.message);
    }
}

// Exécuter la validation
validateGLBPreviewIntegration();
