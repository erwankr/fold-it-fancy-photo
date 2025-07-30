import * as THREE from 'three';
import { extractShapeFromTransparency, createGeometryFromTransparency } from './shapeFromTransparency';

// Interface pour les paramètres de découpe
interface CropSettings {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  targetAspectRatio: number;
  maxFinalWidth: number;
  maxFinalHeight: number;
}

// Crée une géométrie de vêtement plié réaliste avec des courbes et des plis
export const createFoldedClothingGeometry = (
  type: 'jean' | 'tshirt' | 'chemise',
  imageUrl?: string,
  dimensions?: { width: number; height: number; depth: number },
  cropSettings?: CropSettings
) => {
  const width = dimensions ? dimensions.width * 0.01 : 2;
  const height = dimensions ? dimensions.height * 0.01 : 1.5;
  const depth = dimensions ? dimensions.depth * 0.01 : 0.8;

  console.log('Creating geometry for:', type, 'with dimensions:', { width, height, depth });

  // Calculer les dimensions finales basées sur la découpe si disponible
  let finalWidth = width;
  let finalHeight = height;
  
  if (cropSettings) {
    // Adapter les proportions selon la découpe
    const cropAspectRatio = cropSettings.targetAspectRatio;
    if (cropAspectRatio > 1) {
      // Plus large que haut
      finalWidth = width * cropSettings.widthPercent * 1.5;
      finalHeight = height * cropSettings.heightPercent;
    } else {
      // Plus haut que large
      finalWidth = width * cropSettings.widthPercent;
      finalHeight = height * cropSettings.heightPercent * 1.2;
    }
    console.log('Adjusted dimensions based on crop settings:', { finalWidth, finalHeight });
  }

  let geometry;
  switch (type) {
    case 'tshirt':
      geometry = createFoldedTShirt(finalWidth, finalHeight, depth, cropSettings);
      break;
    case 'jean':
      geometry = createFoldedJeans(finalWidth, finalHeight, depth, cropSettings);
      break;
    case 'chemise':
      geometry = createFoldedShirt(finalWidth, finalHeight, depth, cropSettings);
      break;
    default:
      geometry = createFoldedTShirt(finalWidth, finalHeight, depth, cropSettings);
  }

  console.log('Geometry created successfully:', geometry);
  return geometry;
};

// Crée un t-shirt plié avec une forme organique
const createFoldedTShirt = (width: number, height: number, depth: number, cropSettings?: CropSettings) => {
  const group = new THREE.Group();
  
  // Forme organique pour le corps principal adaptée à la découpe
  const mainShape = new THREE.Shape();
  
  // Adapter les proportions selon la découpe
  let w = width * 0.5;
  let h = height * 0.6;
  
  if (cropSettings) {
    const aspectRatio = cropSettings.targetAspectRatio;
    if (aspectRatio < 0.8) {
      // Forme verticale pour t-shirt (plus haut que large)
      h = height * 0.8;
      w = width * 0.4;
    }
  }
  
  // Créer une forme adaptée à la découpe
  mainShape.moveTo(-w * 0.85, -h * 0.9);
  mainShape.bezierCurveTo(-w * 0.95, -h * 0.7, -w * 0.9, -h * 0.4, -w * 0.85, -h * 0.1);
  mainShape.bezierCurveTo(-w * 0.8, h * 0.2, -w * 0.75, h * 0.5, -w * 0.7, h * 0.8);
  mainShape.bezierCurveTo(-w * 0.5, h * 0.85, -w * 0.25, h * 0.8, 0, h * 0.85);
  mainShape.bezierCurveTo(w * 0.25, h * 0.8, w * 0.5, h * 0.85, w * 0.7, h * 0.8);
  mainShape.bezierCurveTo(w * 0.75, h * 0.5, w * 0.8, h * 0.2, w * 0.85, -h * 0.1);
  mainShape.bezierCurveTo(w * 0.9, -h * 0.4, w * 0.95, -h * 0.7, w * 0.85, -h * 0.9);
  mainShape.bezierCurveTo(w * 0.6, -h * 0.95, w * 0.25, -h * 0.9, 0, -h * 0.95);
  mainShape.bezierCurveTo(-w * 0.25, -h * 0.9, -w * 0.6, -h * 0.95, -w * 0.85, -h * 0.9);
  
  // Extrusion avec des paramètres pour une forme plus douce
  const extrudeSettings = {
    depth: depth * 0.2,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 2,
    bevelSize: depth * 0.03,
    bevelThickness: depth * 0.02,
    curveSegments: 24
  };
  
  const mainBodyGeometry = new THREE.ExtrudeGeometry(mainShape, extrudeSettings);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  mainBody.rotation.x = -Math.PI / 2;
  group.add(mainBody);

  return group;
};

// Crée un jean plié avec forme organique
const createFoldedJeans = (width: number, height: number, depth: number, cropSettings?: CropSettings) => {
  const group = new THREE.Group();
  
  // Forme organique pour jean adaptée à la découpe
  const jeanShape = new THREE.Shape();
  
  let w = width * 0.4;
  let h = height * 0.8;
  
  if (cropSettings) {
    const aspectRatio = cropSettings.targetAspectRatio;
    if (aspectRatio > 1) {
      // Forme horizontale pour jean plié (plus large que haut)
      w = width * 0.6;
      h = height * 0.5;
    }
  }
  
  // Forme naturelle avec des irrégularités subtiles
  jeanShape.moveTo(-w * 0.95, -h * 0.9);
  jeanShape.bezierCurveTo(-w * 1.02, -h * 0.7, -w * 0.98, -h * 0.4, -w * 0.92, -h * 0.1);
  jeanShape.bezierCurveTo(-w * 0.88, h * 0.1, -w * 0.85, h * 0.4, -w * 0.9, h * 0.7);
  jeanShape.bezierCurveTo(-w * 0.7, h * 0.85, -w * 0.4, h * 0.9, 0, h * 0.88);
  jeanShape.bezierCurveTo(w * 0.4, h * 0.9, w * 0.7, h * 0.85, w * 0.9, h * 0.7);
  jeanShape.bezierCurveTo(w * 0.85, h * 0.4, w * 0.88, h * 0.1, w * 0.92, -h * 0.1);
  jeanShape.bezierCurveTo(w * 0.98, -h * 0.4, w * 1.02, -h * 0.7, w * 0.95, -h * 0.9);
  jeanShape.bezierCurveTo(w * 0.75, -h * 0.95, w * 0.35, -h * 0.92, 0, -h * 0.94);
  jeanShape.bezierCurveTo(-w * 0.35, -h * 0.92, -w * 0.75, -h * 0.95, -w * 0.95, -h * 0.9);
  
  const jeanExtrudeSettings = {
    depth: depth * 0.3,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 3,
    bevelSize: depth * 0.04,
    bevelThickness: depth * 0.025,
    curveSegments: 20
  };
  
  const mainBodyGeometry = new THREE.ExtrudeGeometry(jeanShape, jeanExtrudeSettings);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  mainBody.rotation.x = -Math.PI / 2;
  group.add(mainBody);

  return group;
};

// Crée une chemise pliée avec forme organique
const createFoldedShirt = (width: number, height: number, depth: number, cropSettings?: CropSettings) => {
  const group = new THREE.Group();
  
  // Forme organique pour chemise adaptée à la découpe
  const shirtShape = new THREE.Shape();
  
  let w = width * 0.45;
  let h = height * 0.7;
  
  if (cropSettings) {
    const aspectRatio = cropSettings.targetAspectRatio;
    if (aspectRatio < 0.8) {
      // Forme verticale pour chemise (plus haut que large)
      h = height * 0.85;
      w = width * 0.35;
    }
  }
  
  // Forme fluide avec des variations naturelles
  shirtShape.moveTo(-w * 0.9, -h * 0.85);
  shirtShape.bezierCurveTo(-w * 1.05, -h * 0.65, -w * 1.0, -h * 0.35, -w * 0.92, -h * 0.05);
  shirtShape.bezierCurveTo(-w * 0.87, h * 0.15, -w * 0.83, h * 0.45, -w * 0.88, h * 0.75);
  shirtShape.bezierCurveTo(-w * 0.65, h * 0.82, -w * 0.32, h * 0.78, 0, h * 0.8);
  shirtShape.bezierCurveTo(w * 0.32, h * 0.78, w * 0.65, h * 0.82, w * 0.88, h * 0.75);
  shirtShape.bezierCurveTo(w * 0.83, h * 0.45, w * 0.87, h * 0.15, w * 0.92, -h * 0.05);
  shirtShape.bezierCurveTo(w * 1.0, -h * 0.35, w * 1.05, -h * 0.65, w * 0.9, -h * 0.85);
  shirtShape.bezierCurveTo(w * 0.68, -h * 0.88, w * 0.33, -h * 0.83, 0, -h * 0.86);
  shirtShape.bezierCurveTo(-w * 0.33, -h * 0.83, -w * 0.68, -h * 0.88, -w * 0.9, -h * 0.85);
  
  const shirtExtrudeSettings = {
    depth: depth * 0.15,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 2,
    bevelSize: depth * 0.02,
    bevelThickness: depth * 0.015,
    curveSegments: 18
  };
  
  const mainBodyGeometry = new THREE.ExtrudeGeometry(shirtShape, shirtExtrudeSettings);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  mainBody.rotation.x = -Math.PI / 2;
  group.add(mainBody);

  return group;
};

// Applique une texture réaliste avec effet de plis
export const applyFoldedTexture = (
  mesh: THREE.Group, 
  texture: THREE.Texture,
  type: 'jean' | 'tshirt' | 'chemise'
) => {
  // Configuration de la texture pour les plis
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  
  // Matériau avec propriétés réalistes pour vêtements pliés
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: getClothingRoughness(type),
    metalness: 0.0,
    normalScale: new THREE.Vector2(0.3, 0.3), // Effet de texture subtil
    side: THREE.DoubleSide,
    transparent: false
  });

  // Appliquer le matériau à tous les meshes
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = material.clone();
      child.castShadow = true;
      child.receiveShadow = true;
      
      // Ajuster les UV mapping pour chaque partie du vêtement
      adjustUVMapping(child, type);
    }
  });
};

// Ajuste les propriétés de rugosité selon le type de tissu
const getClothingRoughness = (type: 'jean' | 'tshirt' | 'chemise'): number => {
  switch (type) {
    case 'jean': return 0.9; // Denim plus rugueux
    case 'tshirt': return 0.7; // Coton standard
    case 'chemise': return 0.5; // Tissu plus lisse
    default: return 0.7;
  }
};

// Ajuste le mapping UV pour un rendu réaliste de la texture
const adjustUVMapping = (mesh: THREE.Mesh, type: string) => {
  if (!mesh.geometry.attributes.uv) return;
  
  const uvAttribute = mesh.geometry.attributes.uv;
  const uvArray = uvAttribute.array as Float32Array;
  
  // Ajuster les coordonnées UV pour éviter les étirements sur les plis
  for (let i = 0; i < uvArray.length; i += 2) {
    // Normaliser les coordonnées UV
    uvArray[i] = Math.max(0, Math.min(1, uvArray[i]));
    uvArray[i + 1] = Math.max(0, Math.min(1, uvArray[i + 1]));
  }
  
  uvAttribute.needsUpdate = true;
  mesh.geometry.computeBoundingBox();
};