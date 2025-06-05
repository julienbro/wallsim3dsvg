#!/usr/bin/env pwsh
# Script de validation pour l'implémentation Hourdis axe Z

Write-Host "🔍 Validation de l'implémentation Hourdis - Axe Z" -ForegroundColor Cyan
Write-Host "=" * 50

$errors = @()
$warnings = @()
$success = @()

# Test 1: Vérifier UIManager.js
Write-Host "`n1. Vérification UIManager.js..." -ForegroundColor Yellow
$uiManagerPath = "js/managers/UIManager.js"

if (Test-Path $uiManagerPath) {
    $content = Get-Content $uiManagerPath -Raw
    
    # Vérifier l'ID custom-length-z
    if ($content -match 'id="custom-length-z"') {
        $success += "✅ ID custom-length-z trouvé dans UIManager.js"
    } else {
        $errors += "❌ ID custom-length-z non trouvé dans UIManager.js"
    }
    
    # Vérifier l'utilisation de dims.z
    if ($content -match 'element\.dims\.z' -and $content -match 'custom-length-z') {
        $success += "✅ Utilisation de element.dims.z avec custom-length-z"
    } else {
        $errors += "❌ element.dims.z non utilisé avec custom-length-z"
    }
    
    # Vérifier le commentaire axe Z
    if ($content -match 'axe Z' -or $content -match 'Z-axis') {
        $success += "✅ Commentaires mis à jour pour axe Z"
    } else {
        $warnings += "⚠️ Commentaires pour axe Z à vérifier"
    }
} else {
    $errors += "❌ Fichier UIManager.js non trouvé"
}

# Test 2: Vérifier le fichier de test
Write-Host "`n2. Vérification test-hourdis-custom-length.html..." -ForegroundColor Yellow
$testPath = "test-hourdis-custom-length.html"

if (Test-Path $testPath) {
    $content = Get-Content $testPath -Raw
    
    # Vérifier customZLength
    if ($content -match 'customZLength') {
        $success += "✅ Paramètre customZLength trouvé dans le test"
    } else {
        $errors += "❌ Paramètre customZLength non trouvé dans le test"
    }
    
    # Vérifier valeur par défaut 13
    if ($content -match 'value="13"') {
        $success += "✅ Valeur par défaut 13 configurée"
    } else {
        $warnings += "⚠️ Valeur par défaut 13 à vérifier"
    }
    
    # Vérifier texte axe Z
    if ($content -match 'axe Z') {
        $success += "✅ Texte d'aide mis à jour pour axe Z"
    } else {
        $warnings += "⚠️ Texte d'aide pour axe Z à vérifier"
    }
} else {
    $errors += "❌ Fichier de test non trouvé"
}

# Test 3: Vérifier la documentation
Write-Host "`n3. Vérification documentation..." -ForegroundColor Yellow
$docPaths = @(
    "HOURDIS-CUSTOM-LENGTH-IMPLEMENTATION.md",
    "HOURDIS-IMPLEMENTATION-SUMMARY.md"
)

foreach ($docPath in $docPaths) {
    if (Test-Path $docPath) {
        $content = Get-Content $docPath -Raw
        
        if ($content -match 'axe Z' -or $content -match 'Z-axis') {
            $success += "✅ Documentation $docPath mise à jour pour axe Z"
        } else {
            $warnings += "⚠️ Documentation $docPath - axe Z à vérifier"
        }
        
        if ($content -match '13cm' -or $content -match '13 cm') {
            $success += "✅ Valeur par défaut 13cm dans $docPath"
        } else {
            $warnings += "⚠️ Valeur par défaut 13cm à vérifier dans $docPath"
        }
    } else {
        $warnings += "⚠️ Fichier de documentation $docPath non trouvé"
    }
}

# Test 4: Vérifier ElementsLibrary.js
Write-Host "`n4. Vérification ElementsLibrary.js..." -ForegroundColor Yellow
$libPath = "js/managers/ElementsLibrary.js"

if (Test-Path $libPath) {
    $content = Get-Content $libPath -Raw
    
    if ($content -match 'customLength: true') {
        $success += "✅ Configuration customLength trouvée dans ElementsLibrary.js"
    } else {
        $errors += "❌ Configuration customLength non trouvée"
    }
    
    # Vérifier les dimensions Hourdis
    if ($content -match 'z: 13') {
        $success += "✅ Dimension Z: 13 configurée pour Hourdis"
    } else {
        $warnings += "⚠️ Dimension Z: 13 à vérifier pour Hourdis"
    }
} else {
    $errors += "❌ Fichier ElementsLibrary.js non trouvé"
}

# Affichage des résultats
Write-Host "`n📊 RÉSULTATS DE LA VALIDATION" -ForegroundColor Cyan
Write-Host "=" * 50

if ($success.Count -gt 0) {
    Write-Host "`n✅ SUCCÈS ($($success.Count)):" -ForegroundColor Green
    foreach ($item in $success) {
        Write-Host "  $item" -ForegroundColor Green
    }
}

if ($warnings.Count -gt 0) {
    Write-Host "`n⚠️ AVERTISSEMENTS ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($item in $warnings) {
        Write-Host "  $item" -ForegroundColor Yellow
    }
}

if ($errors.Count -gt 0) {
    Write-Host "`n❌ ERREURS ($($errors.Count)):" -ForegroundColor Red
    foreach ($item in $errors) {
        Write-Host "  $item" -ForegroundColor Red
    }
}

# Résumé final
Write-Host "`n🎯 RÉSUMÉ FINAL" -ForegroundColor Cyan
if ($errors.Count -eq 0) {
    Write-Host "✅ Implémentation de l'axe Z validée avec succès!" -ForegroundColor Green
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️ Quelques avertissements à vérifier manuellement." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Des erreurs critiques ont été détectées." -ForegroundColor Red
    Write-Host "📝 Veuillez corriger les erreurs avant de continuer." -ForegroundColor Yellow
}

Write-Host "`n🔧 ÉTAPES SUIVANTES RECOMMANDÉES:" -ForegroundColor Cyan
Write-Host "1. Tester l'interface dans l'application principale" -ForegroundColor White
Write-Host "2. Vérifier le test unitaire test-hourdis-custom-length.html" -ForegroundColor White
Write-Host "3. Valider le scaling sur axe Z en mode visuel" -ForegroundColor White
Write-Host "4. Tester avec différentes valeurs (10, 20, 50 cm)" -ForegroundColor White

exit $errors.Count
