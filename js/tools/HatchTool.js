import * as THREE from 'three';

export class HatchTool {
    constructor(app) {
        this.app = app;
        this.selectedSurface = null;
        this.hatchPattern = 'parallel'; // parallel, cross, diagonal, dots, bricks
        this.hatchDensity = 5; // espacement en unités
        this.hatchAngle = 45; // angle en degrés
        this.hatchLines = [];
        this.patternDialog = null;
        this.createPatternDialog();
    }

    createPatternDialog() {
        this.patternDialog = document.createElement('div');
        this.patternDialog.className = 'hatch-pattern-dialog';
        this.patternDialog.style.cssText = `
            position: fixed;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: none;
            z-index: 1000;
            font-family: Arial, sans-serif;
            min-width: 300px;
        `;
        
        this.patternDialog.innerHTML = `
            <div style="margin-bottom: 15px; font-weight: bold; text-align: center;">
                Motifs de hachures
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Motif:</label>
                <select id="hatch-pattern" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="parallel">Traits parallèles</option>
                    <option value="cross">Quadrillage</option>
                    <option value="diagonal">Diagonales croisées</option>
                    <option value="dots">Points</option>
                    <option value="bricks">Briques</option>
                    <option value="concrete">Béton</option>
                    <option value="insulation">Isolation</option>
                    <option value="wood">Bois</option>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Espacement: <span id="density-value">${this.hatchDensity}</span> cm</label>
                <input type="range" id="hatch-density" min="2" max="20" value="${this.hatchDensity}" 
                       style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Angle: <span id="angle-value">${this.hatchAngle}</span>°</label>
                <input type="range" id="hatch-angle" min="0" max="180" value="${this.hatchAngle}" 
                       style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <canvas id="hatch-preview" width="200" height="100" 
                        style="border: 1px solid #ccc; display: block; margin: 0 auto;"></canvas>
            </div>
            
            <div style="text-align: center;">
                <button id="hatch-apply" style="
                    background: #007bff; color: white; border: none; 
                    padding: 8px 16px; border-radius: 4px; margin-right: 10px;
                    cursor: pointer;">Appliquer</button>
                <button id="hatch-cancel" style="
                    background: #6c757d; color: white; border: none; 
                    padding: 8px 16px; border-radius: 4px; cursor: pointer;">Annuler</button>
            </div>
        `;
        
        document.body.appendChild(this.patternDialog);
        this.setupPatternDialogEvents();
    }

    setupPatternDialogEvents() {
        document.getElementById('hatch-pattern').addEventListener('change', (e) => {
            this.hatchPattern = e.target.value;
            this.updatePreview();
        });

        document.getElementById('hatch-density').addEventListener('input', (e) => {
            this.hatchDensity = parseFloat(e.target.value);
            document.getElementById('density-value').textContent = this.hatchDensity;
            this.updatePreview();
        });

        document.getElementById('hatch-angle').addEventListener('input', (e) => {
            this.hatchAngle = parseFloat(e.target.value);
            document.getElementById('angle-value').textContent = this.hatchAngle;
            this.updatePreview();
        });

        document.getElementById('hatch-apply').addEventListener('click', () => {
            this.applyHatch();
            this.hidePatternDialog();
        });

        document.getElementById('hatch-cancel').addEventListener('click', () => {
            this.hidePatternDialog();
            this.cancel();
        });
    }

    updatePreview() {
        const canvas = document.getElementById('hatch-preview');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        
        // Dessiner un aperçu du motif
        const rect = { x: 20, y: 20, width: 160, height: 60 };
        
        switch(this.hatchPattern) {
            case 'parallel':
                this.drawParallelPreview(ctx, rect);
                break;
            case 'cross':
                this.drawCrossPreview(ctx, rect);
                break;
            case 'diagonal':
                this.drawDiagonalPreview(ctx, rect);
                break;
            case 'dots':
                this.drawDotsPreview(ctx, rect);
                break;
            case 'bricks':
                this.drawBricksPreview(ctx, rect);
                break;
            case 'concrete':
                this.drawConcretePreview(ctx, rect);
                break;
            case 'insulation':
                this.drawInsulationPreview(ctx, rect);
                break;
            case 'wood':
                this.drawWoodPreview(ctx, rect);
                break;
        }
        
        // Dessiner le contour
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    drawParallelPreview(ctx, rect) {
        const spacing = this.hatchDensity * 2;
        const angle = this.hatchAngle * Math.PI / 180;
        
        for (let i = 0; i < rect.width; i += spacing) {
            const x = rect.x + i;
            ctx.beginPath();
            ctx.moveTo(x, rect.y);
            ctx.lineTo(x + rect.height * Math.tan(angle), rect.y + rect.height);
            ctx.stroke();
        }
    }

    drawCrossPreview(ctx, rect) {
        const spacing = this.hatchDensity * 2;
        
        // Lignes verticales
        for (let i = 0; i < rect.width; i += spacing) {
            ctx.beginPath();
            ctx.moveTo(rect.x + i, rect.y);
            ctx.lineTo(rect.x + i, rect.y + rect.height);
            ctx.stroke();
        }
        
        // Lignes horizontales
        for (let i = 0; i < rect.height; i += spacing) {
            ctx.beginPath();
            ctx.moveTo(rect.x, rect.y + i);
            ctx.lineTo(rect.x + rect.width, rect.y + i);
            ctx.stroke();
        }
    }

    drawDiagonalPreview(ctx, rect) {
        const spacing = this.hatchDensity * 2;
        
        // Diagonales descendantes
        for (let i = -rect.height; i < rect.width; i += spacing) {
            ctx.beginPath();
            ctx.moveTo(rect.x + i, rect.y);
            ctx.lineTo(rect.x + i + rect.height, rect.y + rect.height);
            ctx.stroke();
        }
        
        // Diagonales montantes
        for (let i = 0; i < rect.width + rect.height; i += spacing) {
            ctx.beginPath();
            ctx.moveTo(rect.x + i, rect.y + rect.height);
            ctx.lineTo(rect.x + i - rect.height, rect.y);
            ctx.stroke();
        }
    }

    drawDotsPreview(ctx, rect) {
        const spacing = this.hatchDensity * 2;
        
        for (let x = 0; x < rect.width; x += spacing) {
            for (let y = 0; y < rect.height; y += spacing) {
                ctx.beginPath();
                ctx.arc(rect.x + x, rect.y + y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawBricksPreview(ctx, rect) {
        const brickWidth = this.hatchDensity * 4;
        const brickHeight = this.hatchDensity * 2;
        
        for (let y = 0; y < rect.height; y += brickHeight) {
            const offset = (y / brickHeight) % 2 * (brickWidth / 2);
            for (let x = -brickWidth; x < rect.width + brickWidth; x += brickWidth) {
                ctx.strokeRect(rect.x + x + offset, rect.y + y, brickWidth, brickHeight);
            }
        }
    }

    drawConcretePreview(ctx, rect) {
        // Motif de béton avec points aléatoires
        ctx.fillStyle = '#000';
        for (let i = 0; i < 30; i++) {
            const x = rect.x + Math.random() * rect.width;
            const y = rect.y + Math.random() * rect.height;
            const size = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawInsulationPreview(ctx, rect) {
        // Motif d'isolation avec lignes ondulées
        const spacing = this.hatchDensity * 2;
        
        for (let y = 0; y < rect.height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(rect.x, rect.y + y);
            
            for (let x = 0; x < rect.width; x += 10) {
                const waveY = rect.y + y + Math.sin(x / 10) * 3;
                ctx.lineTo(rect.x + x, waveY);
            }
            ctx.stroke();
        }
    }

    drawWoodPreview(ctx, rect) {
        // Motif de bois avec lignes courbes
        const spacing = this.hatchDensity * 1.5;
        
        for (let y = 0; y < rect.height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(rect.x, rect.y + y);
            
            const cp1x = rect.x + rect.width * 0.3;
            const cp1y = rect.y + y + (Math.random() - 0.5) * 5;
            const cp2x = rect.x + rect.width * 0.7;
            const cp2y = rect.y + y + (Math.random() - 0.5) * 5;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, rect.x + rect.width, rect.y + y);
            ctx.stroke();
        }
    }

    activate() {
        this.selectedSurface = null;
        this.clearHatchLines();
        document.getElementById('command-output').textContent = 'Sélectionnez une surface à hachurer';
    }

    deactivate() {
        this.selectedSurface = null;
        this.clearHatchLines();
        this.hidePatternDialog();
    }

    handleClick(point) {
        const intersects = this.getSurfaceIntersections(point);
        if (intersects.length > 0) {
            this.selectedSurface = intersects[0].object;
            this.showPatternDialog();
        } else {
            document.getElementById('command-output').textContent = 'Aucune surface trouvée - Sélectionnez une surface à hachurer';
        }
    }

    getSurfaceIntersections(clickPoint) {
        // Trouver les surfaces (Mesh) proches du point de clic
        const surfaces = this.app.objects.filter(obj => 
            obj instanceof THREE.Mesh && 
            (obj.geometry instanceof THREE.PlaneGeometry || 
             obj.geometry instanceof THREE.CircleGeometry ||
             obj.geometry instanceof THREE.ShapeGeometry ||
             obj.userData.type === 'surface')
        );
        
        const intersections = [];
        
        for (let surface of surfaces) {
            // Vérifier si le point est proche de la surface
            const distance = clickPoint.distanceTo(surface.position);
            if (distance < 50) { // Tolérance large pour les surfaces
                intersections.push({
                    object: surface,
                    distance: distance,
                    point: clickPoint
                });
            }
        }
        
        intersections.sort((a, b) => a.distance - b.distance);
        return intersections;
    }

    showPatternDialog() {
        this.patternDialog.style.display = 'block';
        this.updatePreview();
        document.getElementById('command-output').textContent = 'Choisissez le motif de hachure';
    }

    hidePatternDialog() {
        this.patternDialog.style.display = 'none';
    }

    applyHatch() {
        if (!this.selectedSurface) return;

        this.clearHatchLines();
        
        // Créer les lignes de hachure selon le motif choisi
        const bounds = this.getSurfaceBounds(this.selectedSurface);
        this.hatchLines = this.generateHatchLines(bounds);
        
        // Ajouter les lignes à la scène
        this.hatchLines.forEach(line => {
            this.app.scene.add(line);
            this.app.objects.push(line);
            if (this.app.layers && this.app.layers[this.app.currentLayer]) {
                this.app.layers[this.app.currentLayer].objects.push(line);
            }
        });

        if (this.app.addToHistory) {
            this.app.addToHistory('hatch', this.selectedSurface);
        }

        document.getElementById('command-output').textContent = 'Hachures appliquées';
        this.selectedSurface = null;
    }

    getSurfaceBounds(surface) {
        const geometry = surface.geometry;
        const position = surface.position;
        
        if (geometry instanceof THREE.PlaneGeometry) {
            const width = geometry.parameters.width;
            const height = geometry.parameters.height;
            return {
                minX: position.x - width/2,
                maxX: position.x + width/2,
                minY: position.y - height/2,
                maxY: position.y + height/2,
                z: position.z + 0.001
            };
        } else if (geometry instanceof THREE.CircleGeometry) {
            const radius = geometry.parameters.radius;
            return {
                minX: position.x - radius,
                maxX: position.x + radius,
                minY: position.y - radius,
                maxY: position.y + radius,
                z: position.z + 0.001,
                isCircle: true,
                radius: radius,
                center: position
            };
        }
        
        // Pour les autres géométries, calculer les bounds
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        return {
            minX: position.x + box.min.x,
            maxX: position.x + box.max.x,
            minY: position.y + box.min.y,
            maxY: position.y + box.max.y,
            z: position.z + 0.001
        };
    }

    generateHatchLines(bounds) {
        const lines = [];
        
        switch(this.hatchPattern) {
            case 'parallel':
                lines.push(...this.generateParallelLines(bounds));
                break;
            case 'cross':
                lines.push(...this.generateCrossLines(bounds));
                break;
            case 'diagonal':
                lines.push(...this.generateDiagonalLines(bounds));
                break;
            case 'dots':
                lines.push(...this.generateDots(bounds));
                break;
            case 'bricks':
                lines.push(...this.generateBrickLines(bounds));
                break;
            case 'concrete':
                lines.push(...this.generateConcretePattern(bounds));
                break;
            case 'insulation':
                lines.push(...this.generateInsulationLines(bounds));
                break;
            case 'wood':
                lines.push(...this.generateWoodLines(bounds));
                break;
        }
        
        return lines;
    }

    generateParallelLines(bounds) {
        const lines = [];
        const angle = this.hatchAngle * Math.PI / 180;
        
        for (let x = bounds.minX; x <= bounds.maxX; x += this.hatchDensity) {
            const points = [
                new THREE.Vector3(x, bounds.minY, bounds.z),
                new THREE.Vector3(x + (bounds.maxY - bounds.minY) * Math.tan(angle), bounds.maxY, bounds.z)
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            const line = new THREE.Line(geometry, material);
            lines.push(line);
        }
        
        return lines;
    }

    generateCrossLines(bounds) {
        const lines = [];
        
        // Lignes verticales
        for (let x = bounds.minX; x <= bounds.maxX; x += this.hatchDensity) {
            const points = [
                new THREE.Vector3(x, bounds.minY, bounds.z),
                new THREE.Vector3(x, bounds.maxY, bounds.z)
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            const line = new THREE.Line(geometry, material);
            lines.push(line);
        }
        
        // Lignes horizontales
        for (let y = bounds.minY; y <= bounds.maxY; y += this.hatchDensity) {
            const points = [
                new THREE.Vector3(bounds.minX, y, bounds.z),
                new THREE.Vector3(bounds.maxX, y, bounds.z)
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            const line = new THREE.Line(geometry, material);
            lines.push(line);
        }
        
        return lines;
    }

    generateDiagonalLines(bounds) {
        const lines = [];
        
        // Diagonales descendantes
        for (let i = bounds.minX - (bounds.maxY - bounds.minY); i <= bounds.maxX; i += this.hatchDensity) {
            const points = [
                new THREE.Vector3(i, bounds.minY, bounds.z),
                new THREE.Vector3(i + (bounds.maxY - bounds.minY), bounds.maxY, bounds.z)
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            const line = new THREE.Line(geometry, material);
            lines.push(line);
        }
        
        // Diagonales montantes
        for (let i = bounds.minX; i <= bounds.maxX + (bounds.maxY - bounds.minY); i += this.hatchDensity) {
            const points = [
                new THREE.Vector3(i, bounds.maxY, bounds.z),
                new THREE.Vector3(i - (bounds.maxY - bounds.minY), bounds.minY, bounds.z)
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            const line = new THREE.Line(geometry, material);
            lines.push(line);
        }
        
        return lines;
    }

    generateDots(bounds) {
        const dots = [];
        
        for (let x = bounds.minX; x <= bounds.maxX; x += this.hatchDensity) {
            for (let y = bounds.minY; y <= bounds.maxY; y += this.hatchDensity) {
                const geometry = new THREE.SphereGeometry(0.2, 8, 6);
                const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
                const dot = new THREE.Mesh(geometry, material);
                dot.position.set(x, y, bounds.z);
                dots.push(dot);
            }
        }
        
        return dots;
    }

    generateBrickLines(bounds) {
        const lines = [];
        const brickWidth = this.hatchDensity * 2;
        const brickHeight = this.hatchDensity;
        
        for (let y = bounds.minY; y <= bounds.maxY; y += brickHeight) {
            const offset = (Math.floor((y - bounds.minY) / brickHeight) % 2) * (brickWidth / 2);
            
            // Ligne horizontale
            const hPoints = [
                new THREE.Vector3(bounds.minX, y, bounds.z),
                new THREE.Vector3(bounds.maxX, y, bounds.z)
            ];
            const hGeometry = new THREE.BufferGeometry().setFromPoints(hPoints);
            const hMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            const hLine = new THREE.Line(hGeometry, hMaterial);
            lines.push(hLine);
            
            // Lignes verticales
            for (let x = bounds.minX + offset; x <= bounds.maxX; x += brickWidth) {
                if (x >= bounds.minX && x <= bounds.maxX) {
                    const vPoints = [
                        new THREE.Vector3(x, y, bounds.z),
                        new THREE.Vector3(x, Math.min(y + brickHeight, bounds.maxY), bounds.z)
                    ];
                    const vGeometry = new THREE.BufferGeometry().setFromPoints(vPoints);
                    const vMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
                    const vLine = new THREE.Line(vGeometry, vMaterial);
                    lines.push(vLine);
                }
            }
        }
        
        return lines;
    }

    generateConcretePattern(bounds) {
        const dots = [];
        const numDots = Math.floor((bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY) / (this.hatchDensity * this.hatchDensity) * 0.3);
        
        for (let i = 0; i < numDots; i++) {
            const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
            const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
            const size = Math.random() * 0.5 + 0.2;
            
            const geometry = new THREE.SphereGeometry(size, 6, 4);
            const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const dot = new THREE.Mesh(geometry, material);
            dot.position.set(x, y, bounds.z);
            dots.push(dot);
        }
        
        return dots;
    }

    generateInsulationLines(bounds) {
        const lines = [];
        
        for (let y = bounds.minY; y <= bounds.maxY; y += this.hatchDensity) {
            const points = [];
            const numPoints = Math.floor((bounds.maxX - bounds.minX) / 2) + 1;
            
            for (let i = 0; i <= numPoints; i++) {
                const x = bounds.minX + i * 2;
                const waveY = y + Math.sin(i * 0.5) * (this.hatchDensity * 0.3);
                points.push(new THREE.Vector3(Math.min(x, bounds.maxX), waveY, bounds.z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            const line = new THREE.Line(geometry, material);
            lines.push(line);
        }
        
        return lines;
    }

    generateWoodLines(bounds) {
        const lines = [];
        
        for (let y = bounds.minY; y <= bounds.maxY; y += this.hatchDensity) {
            const points = [];
            const numSegments = 20;
            
            for (let i = 0; i <= numSegments; i++) {
                const t = i / numSegments;
                const x = bounds.minX + t * (bounds.maxX - bounds.minX);
                const waveY = y + Math.sin(t * Math.PI * 2 + y) * (this.hatchDensity * 0.2);
                points.push(new THREE.Vector3(x, waveY, bounds.z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            const line = new THREE.Line(geometry, material);
            lines.push(line);
        }
        
        return lines;
    }

    clearHatchLines() {
        this.hatchLines.forEach(line => {
            this.app.scene.remove(line);
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
        });
        this.hatchLines = [];
    }

    cancel() {
        this.selectedSurface = null;
        document.getElementById('command-output').textContent = 'Opération annulée - Sélectionnez une surface à hachurer';
    }

    destroy() {
        if (this.patternDialog && this.patternDialog.parentNode) {
            this.patternDialog.parentNode.removeChild(this.patternDialog);
        }
        this.clearHatchLines();
    }
}
