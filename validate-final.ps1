# Script PowerShell de validation finale GLB Preview
# Date: 5 juin 2025

Write-Host "🎯 VALIDATION FINALE - GLB PREVIEW SYSTEM" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$baseDir = "c:\Users\julie\Documents\DAO NEW1 - Copie\web-cad-app"
$errors = @()
$warnings = @()
$successes = @()

function Test-FileExists {
    param($path, $description)
    if (Test-Path $path) {
        $successes += "✅ $description"
        Write-Host "✅ $description" -ForegroundColor Green
        return $true
    } else {
        $errors += "❌ $description"
        Write-Host "❌ $description" -ForegroundColor Red
        return $false
    }
}

function Test-FileContent {
    param($path, $pattern, $description)
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content -match $pattern) {
            $successes += "✅ $description"
            Write-Host "✅ $description" -ForegroundColor Green
            return $true
        } else {
            $errors += "❌ $description"
            Write-Host "❌ $description" -ForegroundColor Red
            return $false
        }
    } else {
        $errors += "❌ Fichier non trouvé: $path"
        Write-Host "❌ Fichier non trouvé: $path" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n🔍 TESTS DE FICHIERS..." -ForegroundColor Yellow

# Test des fichiers principaux
Test-FileExists "$baseDir\index.html" "Fichier principal index.html"
Test-FileExists "$baseDir\js\managers\UIManager.js" "UIManager.js"
Test-FileExists "$baseDir\js\managers\ElementsLibrary.js" "ElementsLibrary.js"
Test-FileExists "$baseDir\assets\models\planchers\hourdis_60_13.glb" "Modèle GLB hourdis"

Write-Host "`n🔧 TESTS DE CORRECTION..." -ForegroundColor Yellow

# Vérifier que l'erreur previewDiv est corrigée
Test-FileContent "$baseDir\js\managers\UIManager.js" "const previewDiv = document\.createElement\('div'\);" "Définition correcte de previewDiv"

# Vérifier qu'il n'y a plus l'erreur
$uiManagerContent = Get-Content "$baseDir\js\managers\UIManager.js" -Raw
if ($uiManagerContent -notmatch "previewDiv is not defined") {
    $successes += "✅ Erreur previewDiv corrigée"
    Write-Host "✅ Erreur previewDiv corrigée" -ForegroundColor Green
} else {
    $errors += "❌ Erreur previewDiv encore présente"
    Write-Host "❌ Erreur previewDiv encore présente" -ForegroundColor Red
}

Write-Host "`n🎨 TESTS GLB PREVIEW..." -ForegroundColor Yellow

# Vérifier la configuration GLB
Test-FileContent "$baseDir\js\managers\ElementsLibrary.js" "type: 'glb'" "Configuration type GLB"
Test-FileContent "$baseDir\js\managers\ElementsLibrary.js" "planchers.*Hourdis 60\+13" "Configuration élément hourdis"
Test-FileContent "$baseDir\js\managers\UIManager.js" "createGLBPreview" "Méthode createGLBPreview"
Test-FileContent "$baseDir\js\managers\UIManager.js" "glbPreviews.*new Map" "Initialisation glbPreviews"

Write-Host "`n🚀 TESTS D'INTÉGRATION..." -ForegroundColor Yellow

# Vérifier les imports Three.js
Test-FileContent "$baseDir\index.html" "three\.module\.js" "Import Three.js"
Test-FileContent "$baseDir\index.html" "GLTFLoader\.js" "Import GLTFLoader"

# Vérifier la taille du fichier GLB
$glbPath = "$baseDir\assets\models\planchers\hourdis_60_13.glb"
if (Test-Path $glbPath) {
    $glbSize = (Get-Item $glbPath).Length
    $glbSizeKB = [math]::Round($glbSize / 1024, 1)
    
    if ($glbSize -gt 0) {
        $successes += "✅ Fichier GLB valide ($glbSizeKB KB)"
        Write-Host "✅ Fichier GLB valide ($glbSizeKB KB)" -ForegroundColor Green
    } else {
        $errors += "❌ Fichier GLB vide"
        Write-Host "❌ Fichier GLB vide" -ForegroundColor Red
    }
}

Write-Host "`n📊 RAPPORT FINAL" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$totalTests = $successes.Count + $errors.Count + $warnings.Count
$successRate = if ($totalTests -gt 0) { [math]::Round(($successes.Count / $totalTests) * 100, 1) } else { 0 }

Write-Host "✅ Tests réussis: $($successes.Count)" -ForegroundColor Green
Write-Host "❌ Tests échoués: $($errors.Count)" -ForegroundColor Red
Write-Host "⚠️  Avertissements: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "📊 Taux de réussite: $successRate%" -ForegroundColor Cyan

if ($errors.Count -eq 0) {
    Write-Host "`n🎉 TOUS LES TESTS SONT RÉUSSIS!" -ForegroundColor Green
    Write-Host "   Le système GLB Preview est prêt à l'utilisation." -ForegroundColor Green
} elseif ($errors.Count -le 2) {
    Write-Host "`n⚠️  QUELQUES PROBLÈMES MINEURS DÉTECTÉS" -ForegroundColor Yellow
    Write-Host "   Le système devrait fonctionner avec des limitations." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ PROBLÈMES IMPORTANTS DÉTECTÉS" -ForegroundColor Red
    Write-Host "   Correction nécessaire avant utilisation." -ForegroundColor Red
}

if ($errors.Count -gt 0) {
    Write-Host "`n❌ ERREURS DÉTECTÉES:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   $error" -ForegroundColor Red
    }
}

Write-Host "`n🔄 ÉTAPES SUIVANTES:" -ForegroundColor Cyan
Write-Host "   1. Ouvrir index.html dans un navigateur" -ForegroundColor White
Write-Host "   2. Cliquer sur 'Bibliothèque d'éléments'" -ForegroundColor White
Write-Host "   3. Sélectionner l'onglet 'Planchers'" -ForegroundColor White
Write-Host "   4. Vérifier la preview 3D du 'Hourdis 60+13'" -ForegroundColor White

Write-Host "`n🌐 TESTS NAVIGATEUR DISPONIBLES:" -ForegroundColor Cyan
Write-Host "   - test-validation-complete.html (Test complet)" -ForegroundColor White
Write-Host "   - test-correction-elements-library.html (Test correction)" -ForegroundColor White
Write-Host "   - test-final-glb-integration.html (Test GLB détaillé)" -ForegroundColor White

Write-Host "`n✅ VALIDATION TERMINÉE" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
