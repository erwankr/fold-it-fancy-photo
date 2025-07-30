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

// Crée un t-shirt plié avec des plis réalistes
const createFoldedTShirt = (width: number, height: number, depth: number) => {
  const group = new THREE.Group();
  
  // Corps principal plié
  const mainBodyGeometry = new THREE.BoxGeometry(width, height * 0.7, depth * 0.3);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  mainBody.position.y = 0;
  group.add(mainBody);

  // Manches pliées sur les côtés
  const sleeveGeometry = new THREE.BoxGeometry(width * 0.3, height * 0.5, depth * 0.4);
  
  // Manche gauche
  const leftSleeve = new THREE.Mesh(sleeveGeometry, mainBodyMaterial);
  leftSleeve.position.set(-width * 0.4, height * 0.1, depth * 0.2);
  leftSleeve.rotation.z = 0.2;
  group.add(leftSleeve);
  
  // Manche droite
  const rightSleeve = new THREE.Mesh(sleeveGeometry, mainBodyMaterial);
  rightSleeve.position.set(width * 0.4, height * 0.1, depth * 0.2);
  rightSleeve.rotation.z = -0.2;
  group.add(rightSleeve);

  // Pli central pour donner l'effet de t-shirt plié
  const foldGeometry = new THREE.BoxGeometry(width * 0.1, height * 0.6, depth * 0.6);
  const fold = new THREE.Mesh(foldGeometry, mainBodyMaterial);
  fold.position.set(0, 0, depth * 0.3);
  group.add(fold);

  // Partie supérieure légèrement décalée pour l'effet plié
  const topPartGeometry = new THREE.BoxGeometry(width * 0.8, height * 0.3, depth * 0.2);
  const topPart = new THREE.Mesh(topPartGeometry, mainBodyMaterial);
  topPart.position.set(0, height * 0.35, depth * 0.4);
  topPart.rotation.x = -0.1;
  group.add(topPart);

  return group;
};

// Crée un jean plié
const createFoldedJeans = (width: number, height: number, depth: number) => {
  const group = new THREE.Group();
  
  // Corps principal du jean plié
  const mainBodyGeometry = new THREE.BoxGeometry(width, height, depth * 0.5);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  group.add(mainBody);

  // Jambes pliées
  const legGeometry = new THREE.BoxGeometry(width * 0.4, height * 0.8, depth * 0.7);
  
  const leftLeg = new THREE.Mesh(legGeometry, mainBodyMaterial);
  leftLeg.position.set(-width * 0.15, -height * 0.1, depth * 0.2);
  group.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, mainBodyMaterial);
  rightLeg.position.set(width * 0.15, -height * 0.1, depth * 0.2);
  group.add(rightLeg);

  // Pli central
  const centralFoldGeometry = new THREE.BoxGeometry(width * 0.05, height, depth * 0.8);
  const centralFold = new THREE.Mesh(centralFoldGeometry, mainBodyMaterial);
  centralFold.position.z = depth * 0.3;
  group.add(centralFold);

  return group;
};

// Crée une chemise pliée
const createFoldedShirt = (width: number, height: number, depth: number) => {
  const group = new THREE.Group();
  
  // Corps principal de la chemise
  const mainBodyGeometry = new THREE.BoxGeometry(width, height * 0.8, depth * 0.3);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  group.add(mainBody);

  // Manches pliées plus formelles
  const sleeveGeometry = new THREE.BoxGeometry(width * 0.25, height * 0.4, depth * 0.4);
  
  const leftSleeve = new THREE.Mesh(sleeveGeometry, mainBodyMaterial);
  leftSleeve.position.set(-width * 0.45, height * 0.05, depth * 0.15);
  leftSleeve.rotation.z = 0.15;
  group.add(leftSleeve);
  
  const rightSleeve = new THREE.Mesh(sleeveGeometry, mainBodyMaterial);
  rightSleeve.position.set(width * 0.45, height * 0.05, depth * 0.15);
  rightSleeve.rotation.z = -0.15;
  group.add(rightSleeve);

  // Col de chemise visible
  const collarGeometry = new THREE.BoxGeometry(width * 0.6, height * 0.1, depth * 0.1);
  const collar = new THREE.Mesh(collarGeometry, mainBodyMaterial);
  collar.position.set(0, height * 0.45, depth * 0.4);
  group.add(collar);

  // Plis de pliage propres
  const foldLine1 = new THREE.BoxGeometry(width * 0.02, height * 0.7, depth * 0.5);
  const fold1 = new THREE.Mesh(foldLine1, mainBodyMaterial);
  fold1.position.set(-width * 0.25, 0, depth * 0.2);
  group.add(fold1);
  
  const fold2 = new THREE.Mesh(foldLine1, mainBodyMaterial);
  fold2.position.set(width * 0.25, 0, depth * 0.2);
  group.add(fold2);

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