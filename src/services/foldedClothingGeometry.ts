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
  // Conversion précise des dimensions en unités 3D (cm vers unités Three.js)
  const width = dimensions ? dimensions.width / 20 : 2;  // Plus de précision dans la conversion
  const height = dimensions ? dimensions.height / 20 : 1.5;
  const depth = dimensions ? Math.max(dimensions.depth / 20, 0.1) : 0.8;

  console.log('Creating geometry for:', type, 'with dimensions:', { width, height, depth });

  // Calculer les dimensions finales basées sur la découpe et les dimensions réelles
  let finalWidth = width;
  let finalHeight = height;
  
  if (cropSettings) {
    // Utiliser les proportions exactes de la découpe pour ajuster les dimensions
    const cropWidthRatio = cropSettings.widthPercent / 100;
    const cropHeightRatio = cropSettings.heightPercent / 100;
    const aspectRatio = cropSettings.targetAspectRatio;
    
    // Appliquer les proportions de découpe directement aux dimensions
    finalWidth = width * cropWidthRatio;
    finalHeight = height * cropHeightRatio;
    
    // Ajuster selon le ratio d'aspect pour maintenir les proportions
    if (aspectRatio > 1) {
      // Image plus large que haute
      finalHeight = finalWidth / aspectRatio;
    } else {
      // Image plus haute que large  
      finalWidth = finalHeight * aspectRatio;
    }
    
    console.log('Dimensions ajustées selon découpe:', { 
      original: { width, height }, 
      crop: { cropWidthRatio, cropHeightRatio, aspectRatio },
      final: { finalWidth, finalHeight } 
    });
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

// Crée un t-shirt plié avec une forme organique et des détails réalistes
const createFoldedTShirt = (width: number, height: number, depth: number, cropSettings?: CropSettings) => {
  const group = new THREE.Group();
  
  // Adapter les proportions selon la découpe
  let w = width * 0.5;
  let h = height * 0.6;
  
  if (cropSettings) {
    const aspectRatio = cropSettings.targetAspectRatio;
    if (aspectRatio < 0.8) {
      h = height * 0.8;
      w = width * 0.4;
    }
  }
  
  // Corps principal du t-shirt avec forme plus réaliste
  const mainShape = new THREE.Shape();
  mainShape.moveTo(-w * 0.8, -h * 0.85);
  mainShape.bezierCurveTo(-w * 0.9, -h * 0.65, -w * 0.85, -h * 0.35, -w * 0.8, -h * 0.05);
  mainShape.bezierCurveTo(-w * 0.75, h * 0.25, -w * 0.7, h * 0.55, -w * 0.65, h * 0.75);
  mainShape.bezierCurveTo(-w * 0.45, h * 0.8, -w * 0.2, h * 0.75, 0, h * 0.8);
  mainShape.bezierCurveTo(w * 0.2, h * 0.75, w * 0.45, h * 0.8, w * 0.65, h * 0.75);
  mainShape.bezierCurveTo(w * 0.7, h * 0.55, w * 0.75, h * 0.25, w * 0.8, -h * 0.05);
  mainShape.bezierCurveTo(w * 0.85, -h * 0.35, w * 0.9, -h * 0.65, w * 0.8, -h * 0.85);
  mainShape.bezierCurveTo(w * 0.55, -h * 0.9, w * 0.2, -h * 0.85, 0, -h * 0.9);
  mainShape.bezierCurveTo(-w * 0.2, -h * 0.85, -w * 0.55, -h * 0.9, -w * 0.8, -h * 0.85);
  
  const extrudeSettings = {
    depth: depth * 0.25,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 4,
    bevelSize: depth * 0.04,
    bevelThickness: depth * 0.03,
    curveSegments: 32
  };
  
  const mainBodyGeometry = new THREE.ExtrudeGeometry(mainShape, extrudeSettings);
  const mainBody = new THREE.Mesh(mainBodyGeometry, new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.7,
    metalness: 0.0,
    side: THREE.DoubleSide 
  }));
  mainBody.rotation.x = -Math.PI / 2;
  group.add(mainBody);

  // Ajouter des plis réalistes sur les côtés
  createFoldLines(group, w, h, depth, 'tshirt');
  
  // Ajouter de la texture de surface pour plus de réalisme
  addSurfaceDetail(group, w, h, depth, 0.15);

  return group;
};

// Crée un jean plié avec forme organique et détails réalistes
const createFoldedJeans = (width: number, height: number, depth: number, cropSettings?: CropSettings) => {
  const group = new THREE.Group();
  
  let w = width * 0.4;
  let h = height * 0.8;
  
  if (cropSettings) {
    const aspectRatio = cropSettings.targetAspectRatio;
    if (aspectRatio > 1) {
      w = width * 0.6;
      h = height * 0.5;
    }
  }
  
  // Corps principal du jean avec épaisseur réaliste
  const jeanShape = new THREE.Shape();
  jeanShape.moveTo(-w * 0.9, -h * 0.85);
  jeanShape.bezierCurveTo(-w * 0.95, -h * 0.65, -w * 0.9, -h * 0.35, -w * 0.85, -h * 0.05);
  jeanShape.bezierCurveTo(-w * 0.8, h * 0.15, -w * 0.75, h * 0.45, -w * 0.8, h * 0.65);
  jeanShape.bezierCurveTo(-w * 0.6, h * 0.8, -w * 0.3, h * 0.85, 0, h * 0.83);
  jeanShape.bezierCurveTo(w * 0.3, h * 0.85, w * 0.6, h * 0.8, w * 0.8, h * 0.65);
  jeanShape.bezierCurveTo(w * 0.75, h * 0.45, w * 0.8, h * 0.15, w * 0.85, -h * 0.05);
  jeanShape.bezierCurveTo(w * 0.9, -h * 0.35, w * 0.95, -h * 0.65, w * 0.9, -h * 0.85);
  jeanShape.bezierCurveTo(w * 0.7, -h * 0.9, w * 0.3, -h * 0.87, 0, -h * 0.89);
  jeanShape.bezierCurveTo(-w * 0.3, -h * 0.87, -w * 0.7, -h * 0.9, -w * 0.9, -h * 0.85);
  
  const jeanExtrudeSettings = {
    depth: depth * 0.4,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 5,
    bevelSize: depth * 0.05,
    bevelThickness: depth * 0.04,
    curveSegments: 28
  };
  
  const mainBodyGeometry = new THREE.ExtrudeGeometry(jeanShape, jeanExtrudeSettings);
  const mainBody = new THREE.Mesh(mainBodyGeometry, new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide 
  }));
  mainBody.rotation.x = -Math.PI / 2;
  group.add(mainBody);

  // Ajouter des coutures et plis de jean
  createFoldLines(group, w, h, depth, 'jean');
  addSurfaceDetail(group, w, h, depth, 0.25);

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

// Applique une texture réaliste avec effet de plis et découpe précise
export const applyFoldedTexture = (
  mesh: THREE.Group, 
  texture: THREE.Texture,
  type: 'jean' | 'tshirt' | 'chemise',
  cropSettings?: CropSettings
) => {
  // Configuration de la texture selon la découpe
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  
  // Si on a des paramètres de découpe, ajuster la texture en conséquence
  if (cropSettings) {
    // Utiliser la zone découpée de la texture
    texture.repeat.set(
      cropSettings.widthPercent / 100,
      cropSettings.heightPercent / 100
    );
    texture.offset.set(
      cropSettings.xPercent / 100,
      cropSettings.yPercent / 100
    );
  } else {
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
  }
  
  // Matériau avec propriétés réalistes pour vêtements pliés
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: getClothingRoughness(type),
    metalness: 0.0,
    normalScale: new THREE.Vector2(0.3, 0.3), // Effet de texture subtil
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.1 // Pour respecter la transparence de l'image découpée
  });

  // Appliquer le matériau à tous les meshes
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = material.clone();
      child.castShadow = true;
      child.receiveShadow = true;
      
      // Ajuster les UV mapping avec les paramètres de découpe
      adjustUVMappingWithCrop(child, type, cropSettings);
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

// Ajuste le mapping UV avec prise en compte de la découpe
const adjustUVMappingWithCrop = (mesh: THREE.Mesh, type: string, cropSettings?: CropSettings) => {
  if (!mesh.geometry.attributes.uv) return;
  
  const uvAttribute = mesh.geometry.attributes.uv;
  const uvArray = uvAttribute.array as Float32Array;
  
  // Paramètres de découpe (par défaut : image complète)
  const cropX = cropSettings ? cropSettings.xPercent / 100 : 0;
  const cropY = cropSettings ? cropSettings.yPercent / 100 : 0;
  const cropWidth = cropSettings ? cropSettings.widthPercent / 100 : 1;
  const cropHeight = cropSettings ? cropSettings.heightPercent / 100 : 1;
  
  // Ajuster les coordonnées UV pour mapper la zone découpée
  for (let i = 0; i < uvArray.length; i += 2) {
    let u = uvArray[i];
    let v = uvArray[i + 1];
    
    // Appliquer la transformation de découpe
    u = cropX + (u * cropWidth);
    v = cropY + (v * cropHeight);
    
    // Ajouter une légère variation pour l'effet de pli
    u += (Math.random() - 0.5) * 0.01;
    v += (Math.random() - 0.5) * 0.01;
    
    // S'assurer que les coordonnées restent dans les limites de la texture
    uvArray[i] = Math.max(0, Math.min(1, u));
    uvArray[i + 1] = Math.max(0, Math.min(1, v));
  }
  
  uvAttribute.needsUpdate = true;
  mesh.geometry.computeBoundingBox();
};

// Maintenir la fonction originale pour compatibilité
const adjustUVMapping = (mesh: THREE.Mesh, type: string) => {
  adjustUVMappingWithCrop(mesh, type);
};

// Crée des lignes de plis réalistes pour ajouter du volume
const createFoldLines = (group: THREE.Group, w: number, h: number, depth: number, type: string) => {
  const foldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.0,
    opacity: 0.7,
    transparent: true
  });

  // Pli central horizontal
  const foldGeometry = new THREE.CylinderGeometry(depth * 0.01, depth * 0.01, w * 1.2, 8);
  const centralFold = new THREE.Mesh(foldGeometry, foldMaterial);
  centralFold.rotation.z = Math.PI / 2;
  centralFold.position.set(0, depth * 0.1, h * 0.1);
  group.add(centralFold);

  // Plis latéraux selon le type de vêtement
  if (type === 'jean') {
    // Couture centrale pour le jean
    const seamGeometry = new THREE.CylinderGeometry(depth * 0.005, depth * 0.005, h * 1.2, 6);
    const seam = new THREE.Mesh(seamGeometry, foldMaterial);
    seam.position.set(0, depth * 0.12, 0);
    group.add(seam);
  }

  // Plis de côté
  const sideFoldLeft = new THREE.Mesh(foldGeometry.clone(), foldMaterial);
  sideFoldLeft.rotation.z = Math.PI / 2;
  sideFoldLeft.position.set(-w * 0.3, depth * 0.08, h * 0.05);
  group.add(sideFoldLeft);

  const sideFoldRight = new THREE.Mesh(foldGeometry.clone(), foldMaterial);
  sideFoldRight.rotation.z = Math.PI / 2;
  sideFoldRight.position.set(w * 0.3, depth * 0.08, h * 0.05);
  group.add(sideFoldRight);
};

// Ajoute des détails de surface pour plus de réalisme
const addSurfaceDetail = (group: THREE.Group, w: number, h: number, depth: number, intensity: number) => {
  const detailMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
    opacity: 0.3,
    transparent: true
  });

  // Petites irrégularités de surface
  for (let i = 0; i < 8; i++) {
    const x = (Math.random() - 0.5) * w * 0.8;
    const z = (Math.random() - 0.5) * h * 0.8;
    const size = depth * 0.02 * intensity;
    
    const detailGeometry = new THREE.SphereGeometry(size, 6, 4);
    const detail = new THREE.Mesh(detailGeometry, detailMaterial);
    detail.position.set(x, depth * 0.05, z);
    detail.scale.y = 0.3; // Aplatir pour simuler des plis
    group.add(detail);
  }
};