# Script pour créer la structure de dossiers pour les modèles 3D

# Créer le dossier principal assets s'il n'existe pas
New-Item -ItemType Directory -Force -Path ".\assets"

# Créer le dossier models
New-Item -ItemType Directory -Force -Path ".\assets\models"

# Créer les sous-dossiers par catégorie
$categories = @(
    "briques",
    "blocs", 
    "linteaux",
    "isolants",
    "planchers",
    "autres"
)

foreach ($category in $categories) {
    $path = ".\assets\models\$category"
    New-Item -ItemType Directory -Force -Path $path
    Write-Host "Dossier créé : $path" -ForegroundColor Green
}

# Créer le fichier README
$readmeContent = @"
# Bibliothèque de modèles 3D

Ce dossier contient tous les modèles 3D au format GLB utilisés dans la bibliothèque d'éléments de construction.

## Structure des dossiers

- **briques/** - Modèles de briques (M50, M57, M65, M90, WF, WFD, etc.)
- **blocs/** - Modèles de blocs (B9, B14, B19, B29, Argex, béton cellulaire, etc.)
- **linteaux/** - Modèles de linteaux béton (L100 à L500)
- **isolants/** - Modèles d'isolants (PUR5, PUR6, PUR7, etc.)
- **planchers/** - Modèles de planchers et hourdis
- **autres/** - Autres éléments (profils, vides, etc.)

## Convention de nommage

Les fichiers GLB doivent suivre cette convention :
- Nom en minuscules
- Remplacer les espaces par des tirets
- Inclure les dimensions si pertinent

Exemples :
- brique-m50.glb
- bloc-b14.glb
- linteau-l120.glb
- isolant-pur5.glb
"@

# Sauvegarder le README
$readmeContent | Out-File -FilePath ".\assets\models\README.md" -Encoding UTF8

Write-Host "`nStructure de dossiers créée avec succès !" -ForegroundColor Cyan
Write-Host "Emplacement : $(Get-Location)\assets\models" -ForegroundColor Yellow
