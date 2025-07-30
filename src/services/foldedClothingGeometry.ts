import * as THREE from 'three';

// Crée une géométrie de vêtement plié réaliste avec des courbes et des plis
export const createFoldedClothingGeometry = (
  type: 'jean' | 'tshirt' | 'chemise',
  dimensions?: { width: number; height: number; depth: number }
) => {
  const width = dimensions ? dimensions.width * 0.01 : 2;
  const height = dimensions ? dimensions.height * 0.01 : 1.5;
  const depth = dimensions ? dimensions.depth * 0.01 : 0.8;

  switch (type) {
    case 'tshirt':
      return createFoldedTShirt(width, height, depth);
    case 'jean':
      return createFoldedJeans(width, height, depth);
    case 'chemise':
      return createFoldedShirt(width, height, depth);
    default:
      return createFoldedTShirt(width, height, depth);
  }
};

// Crée un t-shirt plié simple par extrusion
const createFoldedTShirt = (width: number, height: number, depth: number) => {
  const group = new THREE.Group();
  
  // Forme simple arrondie pour le corps principal seulement
  const mainShape = new THREE.Shape();
  
  const w = width * 0.5;
  const h = height * 0.6;
  const radius = Math.min(w, h) * 0.08;
  
  // Rectangle avec coins arrondis simples
  mainShape.moveTo(-w + radius, -h);
  mainShape.lineTo(w - radius, -h);
  mainShape.quadraticCurveTo(w, -h, w, -h + radius);
  mainShape.lineTo(w, h - radius);
  mainShape.quadraticCurveTo(w, h, w - radius, h);
  mainShape.lineTo(-w + radius, h);
  mainShape.quadraticCurveTo(-w, h, -w, h - radius);
  mainShape.lineTo(-w, -h + radius);
  mainShape.quadraticCurveTo(-w, -h, -w + radius, -h);
  
  // Extrusion simple et propre
  const extrudeSettings = {
    depth: depth * 0.2,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: depth * 0.01,
    bevelThickness: depth * 0.005,
    curveSegments: 12
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

// Crée un jean plié simple par extrusion
const createFoldedJeans = (width: number, height: number, depth: number) => {
  const group = new THREE.Group();
  
  // Forme simple pour jean
  const jeanShape = new THREE.Shape();
  
  const w = width * 0.4;
  const h = height * 0.8;
  const radius = Math.min(w, h) * 0.06;
  
  // Rectangle simple avec coins légèrement arrondis
  jeanShape.moveTo(-w + radius, -h);
  jeanShape.lineTo(w - radius, -h);
  jeanShape.quadraticCurveTo(w, -h, w, -h + radius);
  jeanShape.lineTo(w, h - radius);
  jeanShape.quadraticCurveTo(w, h, w - radius, h);
  jeanShape.lineTo(-w + radius, h);
  jeanShape.quadraticCurveTo(-w, h, -w, h - radius);
  jeanShape.lineTo(-w, -h + radius);
  jeanShape.quadraticCurveTo(-w, -h, -w + radius, -h);
  
  const jeanExtrudeSettings = {
    depth: depth * 0.3,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: depth * 0.02,
    bevelThickness: depth * 0.01,
    curveSegments: 8
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

// Crée une chemise pliée simple par extrusion
const createFoldedShirt = (width: number, height: number, depth: number) => {
  const group = new THREE.Group();
  
  // Forme simple pour chemise
  const shirtShape = new THREE.Shape();
  
  const w = width * 0.45;
  const h = height * 0.7;
  const radius = Math.min(w, h) * 0.05;
  
  // Rectangle simple avec coins arrondis
  shirtShape.moveTo(-w + radius, -h);
  shirtShape.lineTo(w - radius, -h);
  shirtShape.quadraticCurveTo(w, -h, w, -h + radius);
  shirtShape.lineTo(w, h - radius);
  shirtShape.quadraticCurveTo(w, h, w - radius, h);
  shirtShape.lineTo(-w + radius, h);
  shirtShape.quadraticCurveTo(-w, h, -w, h - radius);
  shirtShape.lineTo(-w, -h + radius);
  shirtShape.quadraticCurveTo(-w, -h, -w + radius, -h);
  
  const shirtExtrudeSettings = {
    depth: depth * 0.15,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: depth * 0.01,
    bevelThickness: depth * 0.005,
    curveSegments: 8
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