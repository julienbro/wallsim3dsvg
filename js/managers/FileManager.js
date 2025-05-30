export class FileManager {
    constructor(app) {
        this.app = app;
    }
    
    newProject() {
        if (confirm('Créer un nouveau projet ? Les modifications non sauvegardées seront perdues.')) {
            this.app.objects.forEach(obj => this.app.scene.remove(obj));
            this.app.objects = [];
            this.app.selectedObject = null;
            this.app.transformControls.detach();
            this.app.history = [];
            this.app.historyIndex = -1;
            this.app.uiManager.updateHistoryPanel();
            this.app.uiManager.updatePropertiesPanel(null);
        }
    }
    
    saveProject() {
        const projectData = {
            objects: this.app.objects.map(obj => ({
                type: obj.geometry.type,
                position: obj.position.toArray(),
                rotation: obj.rotation.toArray(),
                scale: obj.scale.toArray(),
                color: obj.material.color ? obj.material.color.getHex() : 0xffffff
            })),
            camera: {
                position: this.app.camera.position.toArray(),
                rotation: this.app.camera.rotation.toArray()
            }
        };
        
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', 'project.wcad');
        link.click();
        
        document.getElementById('command-output').textContent = 'Projet sauvegardé';
    }
    
    exportProject() {
        const exportData = {
            format: 'WebCAD Export',
            version: '1.0',
            objects: []
        };
        
        this.app.objects.forEach(obj => {
            if (obj.geometry && obj.geometry.attributes) {
                exportData.objects.push({
                    type: obj.geometry.type,
                    position: obj.position.toArray(),
                    rotation: obj.rotation.toArray(),
                    scale: obj.scale.toArray(),
                    vertices: obj.geometry.attributes.position ? 
                        Array.from(obj.geometry.attributes.position.array) : []
                });
            }
        });
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', 'export.json');
        link.click();
        
        document.getElementById('command-output').textContent = 'Projet exporté';
    }
}
