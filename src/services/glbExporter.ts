import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export const exportToGLB = async (
  mesh: THREE.Mesh,
  filename: string = 'clothing_model.glb'
): Promise<void> => {
  try {
    const exporter = new GLTFExporter();
    
    // Create a scene with the mesh
    const scene = new THREE.Scene();
    scene.add(mesh.clone());
    
    // Export options
    const options = {
      binary: true, // Export as GLB (binary format)
      onlyVisible: true,
      truncateDrawRange: true,
      embedImages: true,
      animations: [],
      includeCustomExtensions: false
    };
    
    // Export the scene
    const result = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        scene,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            resolve(gltf);
          } else {
            reject(new Error('Expected ArrayBuffer but got JSON'));
          }
        },
        (error) => reject(error),
        options
      );
    });
    
    // Create and download the file
    const blob = new Blob([result], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log('GLB export completed successfully');
  } catch (error) {
    console.error('Error exporting to GLB:', error);
    throw error;
  }
};