@echo off
echo.
echo ========================================
echo   TEST FINAL - GLB PREVIEW SYSTEM
echo ========================================
echo.

cd /d "c:\Users\julie\Documents\DAO NEW1 - Copie\web-cad-app"

echo [1/3] Validation des fichiers...
if exist "assets\models\planchers\hourdis_60_13.glb" (
    echo   ✅ Fichier GLB trouve
) else (
    echo   ❌ Fichier GLB manquant
)

if exist "js\managers\UIManager.js" (
    echo   ✅ UIManager trouve
) else (
    echo   ❌ UIManager manquant
)

if exist "js\managers\ElementsLibrary.js" (
    echo   ✅ ElementsLibrary trouve
) else (
    echo   ❌ ElementsLibrary manquant
)

echo.
echo [2/3] Validation technique...
node validate-glb-integration.js

echo.
echo [3/3] Instructions de test...
echo.
echo   📋 ETAPES DE TEST:
echo   1. Ouvrir index.html dans un navigateur
echo   2. Cliquer sur "Bibliotheque d'elements"
echo   3. Selectionner l'onglet "Planchers"
echo   4. Verifier la preview 3D du "Hourdis 60+13"
echo.
echo   🌐 TESTS DISPONIBLES:
echo   - test-validation-complete.html (Test complet)
echo   - test-correction-elements-library.html
echo   - test-final-glb-integration.html
echo.
echo ✅ VALIDATION TERMINEE
echo.
pause
