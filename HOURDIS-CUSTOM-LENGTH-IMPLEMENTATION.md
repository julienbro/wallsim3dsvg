# Implémentation - Option de Longueur Personnalisée pour Hourdis 60+13

## Résumé
Cette implémentation ajoute une option de longueur personnalisée pour les éléments "Hourdis 60+13", permettant d'étirer l'objet le long de l'axe Z pour ajuster l'épaisseur par défaut de 13cm.

## Modifications Apportées

### 1. Configuration dans ElementsLibrary.js
**Fichier:** `js/managers/ElementsLibrary.js`
**Lignes:** 148-154

```javascript
'Hourdis 60+13': { 
    type: 'glb',
    path: 'planchers/hourdis_60_13.glb',
    dims: { x: 60, y: 20, z: 13 },
    color: 0x808080,
    customLength: true  // ← Nouvelle propriété ajoutée
}
```

**Changement:** Ajout de la propriété `customLength: true` pour indiquer que cet élément supporte la longueur personnalisée.

### 2. Interface Utilisateur dans UIManager.js
**Fichier:** `js/managers/UIManager.js`
**Lignes:** 1508-1519

```javascript
if (element.customLength) { // Pour Hourdis: Longueur (axe Z) personnalisable
    const lengthGroup = document.createElement('div');
    lengthGroup.className = 'option-group';
    lengthGroup.innerHTML = `
        <label>Longueur personnalisée (cm):</label>
        <input type="number" id="custom-length-z" value="${element.dims.z}" min="10" max="500">
        <small style="color: #666; display: block; margin-top: 5px;">
            Étire l'élément le long de l'axe Z (par défaut: ${element.dims.z} cm)
        </small>
    `;
    optionsContent.appendChild(lengthGroup);
}
```

**Changement:** Ajout d'un contrôle d'interface pour saisir la longueur personnalisée avec :
- Input numérique avec valeur par défaut (13 cm)
- Plage de valeurs : 10-500 cm
- Texte d'aide explicatif

### 3. Logique de Scaling dans UIManager.js
**Fichier:** `js/managers/UIManager.js` 
**Lignes:** 1578-1590

```javascript
// For elements with customLength (like Hourdis), allow non-uniform scaling on Z-axis
if (element.customLength) {
    // Apply specific scaling for each axis
    if (Math.abs(scaleX - 1) > 0.01) model.scale.x = scaleX;
    if (Math.abs(scaleY - 1) > 0.01) model.scale.y = scaleY;
    if (Math.abs(scaleZ - 1) > 0.01) model.scale.z = scaleZ;
} else {
    // Use uniform scale to maintain proportions for other elements
    const uniformScale = Math.min(scaleX, scaleY, scaleZ);
    if (Math.abs(uniformScale - 1) > 0.01) {
        model.scale.multiplyScalar(uniformScale);
    }
}
```

**Changement:** Modification de la logique de scaling pour permettre :
- **Scaling non-uniforme** pour les éléments avec `customLength`
- **Scaling uniforme** préservé pour les autres éléments
- Application spécifique sur l'axe Z pour étirer l'épaisseur

## Fonctionnement

### 1. Détection de l'Élément
Lorsque l'utilisateur sélectionne "Hourdis 60+13", le système détecte la propriété `customLength: true` dans la configuration.

### 2. Affichage de l'Option
L'interface affiche automatiquement un champ de saisie pour la longueur personnalisée avec :
- Valeur par défaut : 13 cm
- Limites : 10-500 cm
- Description claire de l'effet

### 3. Application du Scaling
Lors de l'ajout à la scène :
1. Le modèle GLB original est chargé
2. Sa taille réelle est mesurée via `Box3`
3. Le ratio de scaling Z est calculé : `scaleZ = longueurPersonnalisée / tailleOriginaleZ`
4. Le scaling est appliqué spécifiquement sur l'axe Z : `model.scale.z = scaleZ`

### 4. Résultat
L'élément Hourdis est étiré uniquement le long de l'axe Z, permettant d'obtenir l'épaisseur désirée tout en préservant les proportions sur les axes X et Y.

## Tests

### Test Unitaire
**Fichier:** `test-hourdis-custom-length.html`
- Interface de test dédiée
- Test de différentes longueurs (10, 20, 50, 100, 200 cm)
- Visualisation 3D en temps réel
- Validation des dimensions après scaling

### Test d'Intégration  
**Fichier:** `test-hourdis-integration.html`
- Test complet de l'intégration dans l'application
- Vérification de la configuration
- Test de l'interface utilisateur
- Validation du chargement et du scaling

## Utilisation

1. **Sélectionner l'élément** : Choisir "Hourdis 60+13" dans la bibliothèque
2. **Définir la longueur** : Saisir la longueur désirée dans le champ "Longueur personnalisée"
3. **Ajouter à la scène** : Cliquer sur "Ajouter" pour insérer l'élément avec les dimensions personnalisées

## Avantages

- **Flexibilité** : Permet d'adapter la longueur selon les besoins du projet
- **Simplicité** : Interface intuitive avec valeurs par défaut
- **Performance** : Scaling en temps réel sans rechargement
- **Cohérence** : S'intègre parfaitement avec les autres options d'éléments
- **Robustesse** : Validation des valeurs et gestion d'erreurs

## Compatibilité

- Compatible avec tous les navigateurs modernes
- Ne casse pas la fonctionnalité existante
- Extensible à d'autres éléments GLB
- Préserve les performances de rendu 3D

## Extensions Possibles

Cette implémentation peut être facilement étendue pour :
- D'autres éléments de plancher
- Scaling sur d'autres axes (X, Z)
- Presets de longueurs courantes
- Sauvegarde des préférences utilisateur
