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
  
  // Créer un plan principal comme base du t-shirt plié
  const mainShape = new THREE.Shape();
  
  // Forme rectangulaire légèrement arrondie pour le corps principal
  const w = width * 0.5;
  const h = height * 0.6;
  
  mainShape.moveTo(-w, -h);
  mainShape.lineTo(w, -h);
  mainShape.quadraticCurveTo(w * 1.1, -h * 0.8, w, -h * 0.5); // Coin arrondi
  mainShape.lineTo(w, h * 0.5);
  mainShape.quadraticCurveTo(w * 1.1, h * 0.8, w, h);
  mainShape.lineTo(-w, h);
  mainShape.quadraticCurveTo(-w * 1.1, h * 0.8, -w, h * 0.5);
  mainShape.lineTo(-w, -h * 0.5);
  mainShape.quadraticCurveTo(-w * 1.1, -h * 0.8, -w, -h);
  
  // Extruder le corps principal
  const extrudeSettings = {
    depth: depth * 0.15,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 2,
    bevelSize: depth * 0.02,
    bevelThickness: depth * 0.01,
  };
  
  const mainBodyGeometry = new THREE.ExtrudeGeometry(mainShape, extrudeSettings);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  mainBody.rotation.x = -Math.PI / 2; // Poser à plat
  group.add(mainBody);

  // Créer les manches pliées de manière plus réaliste
  const sleeveShape = new THREE.Shape();
  sleeveShape.moveTo(0, 0);
  sleeveShape.lineTo(width * 0.25, 0);
  sleeveShape.quadraticCurveTo(width * 0.3, height * 0.1, width * 0.25, height * 0.2);
  sleeveShape.lineTo(0, height * 0.15);
  sleeveShape.closePath();
  
  const sleeveGeometry = new THREE.ExtrudeGeometry(sleeveShape, {
    depth: depth * 0.1,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: depth * 0.01,
  });
  
  // Manche gauche pliée
  const leftSleeve = new THREE.Mesh(sleeveGeometry, mainBodyMaterial);
  leftSleeve.position.set(-width * 0.3, depth * 0.05, height * 0.1);
  leftSleeve.rotation.set(-Math.PI / 2, 0, Math.PI);
  group.add(leftSleeve);
  
  // Manche droite pliée
  const rightSleeve = new THREE.Mesh(sleeveGeometry, mainBodyMaterial);
  rightSleeve.position.set(width * 0.3, depth * 0.05, height * 0.1);
  rightSleeve.rotation.set(-Math.PI / 2, 0, 0);
  group.add(rightSleeve);

  // Ajouter des plis pour l'effet plié
  const foldGeometry = new THREE.CylinderGeometry(depth * 0.01, depth * 0.01, height * 0.4, 8);
  const fold1 = new THREE.Mesh(foldGeometry, mainBodyMaterial);
  fold1.position.set(-width * 0.15, depth * 0.1, 0);
  fold1.rotation.x = Math.PI / 2;
  group.add(fold1);
  
  const fold2 = new THREE.Mesh(foldGeometry, mainBodyMaterial);
  fold2.position.set(width * 0.15, depth * 0.1, 0);
  fold2.rotation.x = Math.PI / 2;
  group.add(fold2);

  return group;
};

// Crée un jean plié
const createFoldedJeans = (width: number, height: number, depth: number) => {
  const group = new THREE.Group();
  
  // Créer la forme principale du jean plié
  const jeanShape = new THREE.Shape();
  
  // Forme rectangulaire pour un jean plié en deux
  const w = width * 0.4;
  const h = height * 0.8;
  
  jeanShape.moveTo(-w, -h);
  jeanShape.lineTo(w, -h);
  jeanShape.lineTo(w, h);
  jeanShape.lineTo(-w, h);
  jeanShape.closePath();
  
  // Extruder avec plus d'épaisseur pour un jean
  const jeanExtrudeSettings = {
    depth: depth * 0.3,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 3,
    bevelSize: depth * 0.03,
    bevelThickness: depth * 0.02,
  };
  
  const mainBodyGeometry = new THREE.ExtrudeGeometry(jeanShape, jeanExtrudeSettings);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  mainBody.rotation.x = -Math.PI / 2;
  group.add(mainBody);

  // Jambes pliées qui dépassent légèrement
  const legShape = new THREE.Shape();
  legShape.moveTo(0, 0);
  legShape.lineTo(width * 0.15, 0);
  legShape.lineTo(width * 0.15, height * 0.4);
  legShape.lineTo(0, height * 0.4);
  legShape.closePath();
  
  const legGeometry = new THREE.ExtrudeGeometry(legShape, {
    depth: depth * 0.25,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: depth * 0.01,
  });
  
  // Jambe gauche
  const leftLeg = new THREE.Mesh(legGeometry, mainBodyMaterial);
  leftLeg.position.set(-width * 0.2, depth * 0.15, -height * 0.3);
  leftLeg.rotation.x = -Math.PI / 2;
  group.add(leftLeg);
  
  // Jambe droite
  const rightLeg = new THREE.Mesh(legGeometry, mainBodyMaterial);
  rightLeg.position.set(width * 0.05, depth * 0.15, -height * 0.3);
  rightLeg.rotation.x = -Math.PI / 2;
  group.add(rightLeg);

  // Couture centrale du jean
  const seamGeometry = new THREE.CylinderGeometry(depth * 0.005, depth * 0.005, height * 0.6, 8);
  const centralSeam = new THREE.Mesh(seamGeometry, mainBodyMaterial);
  centralSeam.position.set(0, depth * 0.16, 0);
  centralSeam.rotation.x = Math.PI / 2;
  group.add(centralSeam);

  return group;
};

// Crée une chemise pliée
const createFoldedShirt = (width: number, height: number, depth: number) => {
  const group = new THREE.Group();
  
  // Forme de chemise plus sophistiquée
  const shirtShape = new THREE.Shape();
  
  // Forme avec col et épaules plus définies
  const w = width * 0.45;
  const h = height * 0.7;
  
  shirtShape.moveTo(-w, -h);
  shirtShape.lineTo(w, -h);
  // Épaules plus larges
  shirtShape.lineTo(w * 1.2, -h * 0.7);
  shirtShape.lineTo(w * 1.2, -h * 0.3);
  shirtShape.lineTo(w, -h * 0.1);
  shirtShape.lineTo(w, h * 0.8);
  shirtShape.lineTo(-w, h * 0.8);
  shirtShape.lineTo(-w, -h * 0.1);
  shirtShape.lineTo(-w * 1.2, -h * 0.3);
  shirtShape.lineTo(-w * 1.2, -h * 0.7);
  shirtShape.closePath();
  
  const shirtExtrudeSettings = {
    depth: depth * 0.12,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 2,
    bevelSize: depth * 0.015,
    bevelThickness: depth * 0.01,
  };
  
  const mainBodyGeometry = new THREE.ExtrudeGeometry(shirtShape, shirtExtrudeSettings);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  mainBody.rotation.x = -Math.PI / 2;
  group.add(mainBody);

  // Manches pliées de façon professionnelle
  const sleeveShape = new THREE.Shape();
  sleeveShape.moveTo(0, 0);
  sleeveShape.lineTo(width * 0.2, 0);
  sleeveShape.lineTo(width * 0.18, height * 0.25);
  sleeveShape.lineTo(width * 0.02, height * 0.2);
  sleeveShape.closePath();
  
  const sleeveGeometry = new THREE.ExtrudeGeometry(sleeveShape, {
    depth: depth * 0.08,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: depth * 0.005,
  });
  
  // Manche gauche
  const leftSleeve = new THREE.Mesh(sleeveGeometry, mainBodyMaterial);
  leftSleeve.position.set(-width * 0.35, depth * 0.06, height * 0.15);
  leftSleeve.rotation.set(-Math.PI / 2, 0, Math.PI);
  group.add(leftSleeve);
  
  // Manche droite
  const rightSleeve = new THREE.Mesh(sleeveGeometry, mainBodyMaterial);
  rightSleeve.position.set(width * 0.35, depth * 0.06, height * 0.15);
  rightSleeve.rotation.set(-Math.PI / 2, 0, 0);
  group.add(rightSleeve);

  // Col visible de chemise
  const collarGeometry = new THREE.CylinderGeometry(width * 0.25, width * 0.3, depth * 0.03, 16);
  const collar = new THREE.Mesh(collarGeometry, mainBodyMaterial);
  collar.position.set(0, depth * 0.08, height * 0.35);
  collar.rotation.x = Math.PI / 2;
  group.add(collar);

  // Lignes de pliage précises
  const foldGeometry = new THREE.CylinderGeometry(depth * 0.003, depth * 0.003, height * 0.5, 8);
  
  const fold1 = new THREE.Mesh(foldGeometry, mainBodyMaterial);
  fold1.position.set(-width * 0.2, depth * 0.07, 0);
  fold1.rotation.x = Math.PI / 2;
  group.add(fold1);
  
  const fold2 = new THREE.Mesh(foldGeometry, mainBodyMaterial);
  fold2.position.set(width * 0.2, depth * 0.07, 0);
  fold2.rotation.x = Math.PI / 2;
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