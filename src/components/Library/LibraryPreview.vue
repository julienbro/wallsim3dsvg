<template>
  <div class="library-preview">
    <div class="model-viewer" ref="modelViewerRef"></div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';

export default {
  name: 'LibraryPreview',
  props: {
    modelPath: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const modelViewerRef = ref(null);
    const isRotating = ref(true);

    onMounted(() => {
      // Initialisation du visualiseur de modèle
      const viewer = new window.THREE.WebGLRenderer({ antialias: true });
      viewer.setSize(window.innerWidth, window.innerHeight);
      modelViewerRef.value.appendChild(viewer.domElement);

      const scene = new window.THREE.Scene();
      const camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      const light = new window.THREE.DirectionalLight(0xffffff, 1);
      light.position.set(0, 1, 1).normalize();
      scene.add(light);

      const loader = new window.THREE.GLTFLoader();
      loader.load(
        props.modelPath,
        (gltf) => {
          scene.add(gltf.scene);
          animate();
        },
        undefined,
        (error) => {
          console.error('Une erreur est survenue lors du chargement du modèle GLB.', error);
        }
      );

      const animate = () => {
        if (modelRef.value && isRotating.value) {
          // Rotation autour de l'axe Z au lieu de Y
          modelRef.value.rotation.z += 0.01;
        }
        requestAnimationFrame(animate);
      };
    });

    onBeforeUnmount(() => {
      // Nettoyage des ressources
      while (modelViewerRef.value.firstChild) {
        modelViewerRef.value.removeChild(modelViewerRef.value.firstChild);
      }
    });

    return {
      modelViewerRef,
    };
  },
};
</script>

<style scoped>
.library-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.model-viewer {
  width: 100%;
  height: 100%;
}
</style>