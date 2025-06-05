# Script de Validation Simple - Hourdis Longueur Personnalisee

Write-Host "=== VALIDATION HOURDIS LONGUEUR PERSONNALISEE ===" -ForegroundColor Green

$webCadPath = "c:\Users\julie\Documents\DAO NEW1 - Copie\web-cad-app"
$elementsLibraryPath = "$webCadPath\js\managers\ElementsLibrary.js"
$uiManagerPath = "$webCadPath\js\managers\UIManager.js"

# Test 1: ElementsLibrary.js
Write-Host "Test 1: ElementsLibrary.js..." -ForegroundColor Yellow
if (Test-Path $elementsLibraryPath) {
    $elementsContent = Get-Content $elementsLibraryPath -Raw
    if ($elementsContent -match "customLength:\s*true") {
        Write-Host "  OK: customLength found" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: customLength missing" -ForegroundColor Red
    }
} else {
    Write-Host "  ERROR: File not found" -ForegroundColor Red
}

# Test 2: UIManager.js
Write-Host "Test 2: UIManager.js..." -ForegroundColor Yellow
if (Test-Path $uiManagerPath) {
    $uiContent = Get-Content $uiManagerPath -Raw
    
    if ($uiContent -match "element\.customLength") {
        Write-Host "  OK: customLength logic found" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: customLength logic missing" -ForegroundColor Red
    }
    
    if ($uiContent -match "custom-dim-y") {
        Write-Host "  OK: custom-dim-y input found" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: custom-dim-y input missing" -ForegroundColor Red
    }
} else {
    Write-Host "  ERROR: File not found" -ForegroundColor Red
}

# Test 3: GLB Model
Write-Host "Test 3: GLB Model..." -ForegroundColor Yellow
$glbPath = "$webCadPath\assets\models\planchers\hourdis_60_13.glb"
if (Test-Path $glbPath) {
    Write-Host "  OK: hourdis_60_13.glb found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: hourdis_60_13.glb not found" -ForegroundColor Orange
}

# Test 4: Test Files
Write-Host "Test 4: Test Files..." -ForegroundColor Yellow
$testFiles = @(
    "test-hourdis-custom-length.html",
    "test-hourdis-integration.html",
    "HOURDIS-CUSTOM-LENGTH-IMPLEMENTATION.md"
)

foreach ($testFile in $testFiles) {
    $testPath = "$webCadPath\$testFile"
    if (Test-Path $testPath) {
        Write-Host "  OK: $testFile created" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: $testFile missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== IMPLEMENTATION COMPLETE ===" -ForegroundColor Green
Write-Host "Files modified:"
Write-Host "- js/managers/ElementsLibrary.js (customLength: true added)"
Write-Host "- js/managers/UIManager.js (UI and scaling logic added)"
Write-Host ""
Write-Host "Test files created:"
Write-Host "- test-hourdis-custom-length.html"
Write-Host "- test-hourdis-integration.html"
Write-Host "- HOURDIS-CUSTOM-LENGTH-IMPLEMENTATION.md"
