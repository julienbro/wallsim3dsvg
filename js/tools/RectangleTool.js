import * as THREE from 'three';

export class RectangleTool {
    constructor(app) {
        this.app = app;
        this.active = false;
        this.startPoint = null;
        this.previewRect = null;
    }

    activate() {
        this.active = true;
        this.startPoint = null;
        this.clearPreview();
        document.getElementById('command-output').textContent = 'Rectangle : Cliquez pour définir le premier coin';
        this.app.controls.enabled = false; // Disable orbit controls
        // console.log("RectangleTool: Activated");
    }

    deactivate() {
        this.active = false;
        this.clearPreview();
        this.startPoint = null;
        this.app.controls.enabled = true; // Re-enable orbit controls
        // console.log("RectangleTool: Deactivated");
    }

    handleClick(point) {
        if (!this.active) {
            // console.log("RectangleTool.handleClick: Inactive, returning.");
            return;
        }
        if (!point) {
            // console.error("RectangleTool.handleClick: Received null point!");
            return;
        }

        // console.log(`RectangleTool.handleClick: point=(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`);

        if (!this.startPoint) {
            // First click: define the starting point
            this.startPoint = point.clone();
            document.getElementById('command-output').textContent = 'Cliquez pour définir le coin opposé du rectangle';
            // console.log("RectangleTool: startPoint set to", this.startPoint);
            // Preview will be updated by handleMouseMove
        } else {
            // Second click: finalize the rectangle
            // console.log("RectangleTool: Second click, finalizing rectangle.");
            this.createRectangle(this.startPoint, point);
            this.app.toolManager.setTool('select'); // Return to select tool
        }
    }

    handleMouseMove(currentPoint) {
        // console.log(`RectangleTool.handleMouseMove: active=${this.active}, startPoint=${!!this.startPoint}, currentPoint=(${currentPoint?.x.toFixed(2)}, ${currentPoint?.y.toFixed(2)})`);
        if (!currentPoint) {
            // console.warn("RectangleTool.handleMouseMove: currentPoint is null or undefined.");
            return;
        }
        if (!this.active || !this.startPoint) {
            // console.log("RectangleTool.handleMouseMove: Not active or no startPoint, returning.");
            return;
        }
        this.updatePreview(this.startPoint, currentPoint);
    }

    updatePreview(p1, p2) {
        this.clearPreview();
        // console.log(`RectangleTool.updatePreview: p1=(${p1?.x.toFixed(2)}, ${p1?.y.toFixed(2)}), p2=(${p2?.x.toFixed(2)}, ${p2?.y.toFixed(2)})`);

        const width = Math.abs(p2.x - p1.x) || 0.01; // Ensure non-zero for geometry
        const height = Math.abs(p2.y - p1.y) || 0.01;
        const centerX = (p1.x + p2.x) / 2;
        const centerY = (p1.y + p2.y) / 2;

        if (isNaN(width) || isNaN(height) || isNaN(centerX) || isNaN(centerY)) {
            // console.error("RectangleTool: NaN values in updatePreview calculations", {width, height, centerX, centerY});
            return;
        }
        
        // console.log(`RectangleTool: Creating preview geometry with w=${width.toFixed(2)}, h=${height.toFixed(2)} at (${centerX.toFixed(2)}, ${centerY.toFixed(2)})`);
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // Green preview
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        this.previewRect = new THREE.Mesh(geometry, material);
        this.previewRect.position.set(centerX, centerY, 0.05); // Slightly above workplane
        this.previewRect.name = "RECTANGLE_PREVIEW_GHOST"; // For debugging in scene graph
        
        // console.log("RectangleTool: Adding previewRect to scene", this.previewRect);
        this.app.scene.add(this.previewRect);
    }

    createRectangle(p1, p2) {
        this.clearPreview();
        const width = Math.abs(p2.x - p1.x);
        const height = Math.abs(p2.y - p1.y);

        if (width < 0.01 || height < 0.01) { // Prevent zero-size or too small rectangles
            document.getElementById('command-output').textContent = 'Rectangle trop petit, annulé.';
            this.cancel();
            return;
        }

        const centerX = (p1.x + p2.x) / 2;
        const centerY = (p1.y + p2.y) / 2;

        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff, // Default white
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        const rectMesh = new THREE.Mesh(geometry, material);
        rectMesh.position.set(centerX, centerY, 0.01); // On workplane
        rectMesh.castShadow = true;
        rectMesh.receiveShadow = true;
        rectMesh.userData.type = 'rectangle';

        const edges = new THREE.EdgesGeometry(geometry);
        const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
        rectMesh.add(edgeLines);

        this.app.scene.add(rectMesh);
        this.app.objects.push(rectMesh);
        if (this.app.layers && this.app.layers[this.app.currentLayer]) {
            this.app.layers[this.app.currentLayer].objects.push(rectMesh);
        }
        if (this.app.addToHistory) {
            this.app.addToHistory('create', rectMesh);
        }
        if (this.app.uiManager && this.app.uiManager.updateHistoryPanel) {
            this.app.uiManager.updateHistoryPanel();
        }
        document.getElementById('command-output').textContent = 'Rectangle créé.';
        // console.log("RectangleTool: Rectangle created.");
    }

    clearPreview() {
        if (this.previewRect) {
            // console.log("RectangleTool: Clearing previewRect", this.previewRect.uuid);
            this.app.scene.remove(this.previewRect);
            if (this.previewRect.geometry) this.previewRect.geometry.dispose();
            if (this.previewRect.material) this.previewRect.material.dispose();
            this.previewRect = null;
        }
    }

    cancel() {
        this.deactivate(); // This calls clearPreview
        document.getElementById('command-output').textContent = 'Rectangle annulé.';
        // console.log("RectangleTool: Cancelled.");
        if (this.app.toolManager) {
            this.app.toolManager.setTool('select');
        }
    }
}