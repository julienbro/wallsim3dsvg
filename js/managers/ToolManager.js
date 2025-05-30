export class ToolManager {
    constructor(app) {
        this.app = app;
        // Ne pas configurer les outils immédiatement car le DOM n'est pas encore prêt
        // L'UIManager s'occupera de la configuration des outils
    }
    
    setupTools() {
        // Cette méthode est maintenant gérée par UIManager
        // Pour éviter les conflits, on la laisse vide ou on vérifie l'existence des éléments
        
        // Vérification sécurisée des éléments avant ajout des gestionnaires
        const elements = [
            'line-tool', 'rect-tool', 'circle-tool', 'arc-tool', 'polyline-tool',
            'box-tool', 'sphere-tool', 'cylinder-tool',
            'select-tool', 'extrude-tool', 'move-tool', 'rotate-tool', 'scale-tool'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // L'élément existe, le gestionnaire sera ajouté par UIManager
                console.log(`Élément ${id} trouvé`);
            }
        });
    }
    
    setTool(tool) {
        // Annuler le dessin en cours si on change d'outil
        // Deactivate current tool if it's one of the new system tools
        if (this.app.drawingManager) {
            if (this.app.drawingManager.lineTool && this.app.drawingManager.lineTool.active) {
                this.app.drawingManager.lineTool.deactivate();
            }
            if (this.app.drawingManager.rectangleTool && this.app.drawingManager.rectangleTool.active) {
                this.app.drawingManager.rectangleTool.deactivate();
            }
            if (this.app.drawingManager.circleTool && this.app.drawingManager.circleTool.active) {
                this.app.drawingManager.circleTool.deactivate();
            }
            if (this.app.drawingManager.parallelTool && this.app.drawingManager.parallelTool.active) {
                this.app.drawingManager.parallelTool.deactivate();
            }
            if (this.app.drawingManager.trimTool && this.app.drawingManager.trimTool.active) {
                this.app.drawingManager.trimTool.deactivate();
            }
            if (this.app.drawingManager.extendTool && this.app.drawingManager.extendTool.active) {
                this.app.drawingManager.extendTool.deactivate();
            }
            if (this.app.drawingManager.hatchTool && this.app.drawingManager.hatchTool.active) {
                this.app.drawingManager.hatchTool.deactivate();
            }
            // If DrawingManager's generic isDrawing is true (e.g. for polyline)
            if (this.app.drawingManager.isDrawing) {
                 this.app.drawingManager.cancelDrawing(); // This will call endDrawing
            }
        }
        if (this.app.extrusionManager && this.app.extrusionManager.isExtruding) {
            this.app.extrusionManager.cancelExtrusion();
        }
        
        // S'assurer que le menu contextuel est caché
        if (this.app.drawingManager && this.app.drawingManager.contextMenu) {
            this.app.drawingManager.hideContextMenu();
        }
        
        this.app.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        
        const sidebarBtn = document.getElementById(`sidebar-${tool}`);
        if (sidebarBtn) sidebarBtn.classList.add('active');
        
        // Activate the tool via DrawingManager's startDrawing, which now routes to specific tool.activate()
        this.app.drawingManager.startDrawing(tool); 
        
        // Command output is now mostly handled by individual tool's activate() method.
        // We can set a generic message or remove some of these.
        const cmdOutput = document.getElementById('command-output');
        if (tool === 'select') { // Select tool might not have an activate message
             cmdOutput.textContent = 'Outil Sélection activé.';
        } else if (tool === 'extrude') { // Extrude tool might also manage its own messages
             cmdOutput.textContent = 'Cliquez sur une surface à extruder';
        }
        // For other tools, their activate() method should set the initial message.
        // If not, a generic message can be set here:
        // else {
        //    cmdOutput.textContent = `Outil ${tool} activé.`;
        // }
    }
    
    setTransformMode(mode) {
        this.app.currentTool = 'select';
        this.app.transformControls.setMode(mode);
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode === 'translate' ? 'move' : mode}-tool`).classList.add('active');
    }
}
