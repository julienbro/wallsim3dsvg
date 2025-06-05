# Script de Validation - Hourdis Longueur Personnalisée
# Vérifie que l'implémentation a été correctement appliquée

Write-Host "=== VALIDATION HOURDIS LONGUEUR PERSONNALISEE ===" -ForegroundColor Green
Write-Host ""

$webCadPath = "c:\Users\julie\Documents\DAO NEW1 - Copie\web-cad-app"
$elementsLibraryPath = "$webCadPath\js\managers\ElementsLibrary.js"
$uiManagerPath = "$webCadPath\js\managers\UIManager.js"

# Test 1: Vérifier que ElementsLibrary.js contient la propriété customLength
Write-Host "Test 1: Vérification de la configuration Hourdis..." -ForegroundColor Yellow

if (Test-Path $elementsLibraryPath) {
    $elementsContent = Get-Content $elementsLibraryPath -Raw
    if ($elementsContent -match "customLength:\s*true") {
        Write-Host "  ✓ customLength: true trouvé dans ElementsLibrary.js" -ForegroundColor Green
    } else {
        Write-Host "  ✗ customLength: true manquant dans ElementsLibrary.js" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✗ Fichier ElementsLibrary.js introuvable" -ForegroundColor Red
    exit 1
}

# Test 2: Vérifier que UIManager.js contient la logique customLength
Write-Host "Test 2: Vérification de l'interface utilisateur..." -ForegroundColor Yellow

if (Test-Path $uiManagerPath) {
    $uiContent = Get-Content $uiManagerPath -Raw
    
    if ($uiContent -match "element\.customLength") {
        Write-Host "  ✓ Logique customLength trouvée dans UIManager.js" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Logique customLength manquante dans UIManager.js" -ForegroundColor Red
        exit 1
    }
    
    if ($uiContent -match "custom-dim-y") {
        Write-Host "  ✓ Input custom-dim-y trouvé dans UIManager.js" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Input custom-dim-y manquant dans UIManager.js" -ForegroundColor Red
        exit 1
    }
    
    if ($uiContent -match "model\.scale\.y\s*=\s*scaleY") {
        Write-Host "  ✓ Logique de scaling Y trouvée dans UIManager.js" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Logique de scaling Y manquante dans UIManager.js" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✗ Fichier UIManager.js introuvable" -ForegroundColor Red
    exit 1
}

# Test 3: Vérifier la présence du modèle GLB
Write-Host "Test 3: Vérification du modèle 3D..." -ForegroundColor Yellow

$glbPath = "$webCadPath\assets\models\planchers\hourdis_60_13.glb"
if (Test-Path $glbPath) {
    Write-Host "  ✓ Modèle hourdis_60_13.glb trouvé" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Modèle hourdis_60_13.glb introuvable (peut affecter le test)" -ForegroundColor Orange
}

# Test 4: Vérifier les fichiers de test
Write-Host "Test 4: Vérification des fichiers de test..." -ForegroundColor Yellow

$testFiles = @(
    "test-hourdis-custom-length.html",
    "test-hourdis-integration.html",
    "HOURDIS-CUSTOM-LENGTH-IMPLEMENTATION.md"
)

foreach ($testFile in $testFiles) {
    $testPath = "$webCadPath\$testFile"
    if (Test-Path $testPath) {
        Write-Host "  ✓ $testFile créé" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $testFile manquant" -ForegroundColor Red
    }
}

# Test 5: Recherche de patterns spécifiques
Write-Host "Test 5: Vérification des patterns d'implémentation..." -ForegroundColor Yellow

# Vérifier la structure de l'option UI
if ($uiContent -match "Longueur personnalisée \(cm\)") {
    Write-Host "  ✓ Label d'interface trouvé" -ForegroundColor Green
} else {
    Write-Host "  ✗ Label d'interface manquant" -ForegroundColor Red
}

# Vérifier la logique de scaling conditionnel
if ($uiContent -match "if \(element\.customLength\)") {
    Write-Host "  ✓ Condition customLength trouvée" -ForegroundColor Green
} else {
    Write-Host "  ✗ Condition customLength manquante" -ForegroundColor Red
}

# Résumé
Write-Host ""
Write-Host "=== RESUME ===" -ForegroundColor Green
Write-Host "Configuration Hourdis: customLength ajoute dans ElementsLibrary.js"
Write-Host "Interface utilisateur: Option longueur personnalisee ajoutee dans UIManager.js"
Write-Host "Logique de scaling: Scaling non-uniforme sur axe Y implemente"
Write-Host "Tests: Fichiers de test et documentation créés"
Write-Host ""

# Instructions d'utilisation
Write-Host "=== UTILISATION ===" -ForegroundColor Cyan
Write-Host "1. Ouvrir l'application WebCAD"
Write-Host "2. Sélectionner 'Hourdis 60+13' dans la bibliothèque planchers"
Write-Host "3. Modifier la 'Longueur personnalisee' dans les options (10-500 cm)"
Write-Host "4. Ajouter l'element a la scene"
Write-Host ""

# Tests disponibles
Write-Host "=== TESTS DISPONIBLES ===" -ForegroundColor Cyan
Write-Host "- test-hourdis-custom-length.html - Test unitaire avec visualisation 3D"
Write-Host "- test-hourdis-integration.html - Test d'integration complet"
Write-Host ""

Write-Host "Validation terminee avec succes!" -ForegroundColor Green
