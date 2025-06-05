# Script de validation simple pour l'axe Z
Write-Host "Validation de l'implementation Hourdis - Axe Z" -ForegroundColor Cyan

# Verification UIManager.js
Write-Host "`nVerification UIManager.js..." -ForegroundColor Yellow
$uiContent = Get-Content "js/managers/UIManager.js" -Raw
if ($uiContent -match 'custom-length-z') {
    Write-Host "✓ custom-length-z trouve" -ForegroundColor Green
} else {
    Write-Host "✗ custom-length-z manquant" -ForegroundColor Red
}

# Verification test file
Write-Host "`nVerification test file..." -ForegroundColor Yellow
$testContent = Get-Content "test-hourdis-custom-length.html" -Raw
if ($testContent -match 'customZLength') {
    Write-Host "✓ customZLength trouve" -ForegroundColor Green
} else {
    Write-Host "✗ customZLength manquant" -ForegroundColor Red
}

Write-Host "`nValidation terminee!" -ForegroundColor Cyan
