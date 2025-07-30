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
  
  // Créer une forme arrondie pour le corps principal
  const mainShape = new THREE.Shape();
  
  // Forme organique arrondie pour un t-shirt plié
  const w = width * 0.5;
  const h = height * 0.6;
  const radius = Math.min(w, h) * 0.15;
  
  // Commencer par les coins arrondis
  mainShape.moveTo(-w + radius, -h);
  mainShape.lineTo(w - radius, -h);
  mainShape.quadraticCurveTo(w, -h, w, -h + radius);
  mainShape.lineTo(w, h - radius);
  mainShape.quadraticCurveTo(w, h, w - radius, h);
  mainShape.lineTo(-w + radius, h);
  mainShape.quadraticCurveTo(-w, h, -w, h - radius);
  mainShape.lineTo(-w, -h + radius);
  mainShape.quadraticCurveTo(-w, -h, -w + radius, -h);
  
  // Ajouter des courbes douces sur les côtés pour l'effet plié
  const curve1 = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-w * 0.3, 0, 0),
    new THREE.Vector3(0, depth * 0.2, 0),
    new THREE.Vector3(w * 0.3, 0, 0)
  );
  
  const extrudeSettings = {
    depth: depth * 0.15,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 8,
    bevelSize: depth * 0.03,
    bevelThickness: depth * 0.02,
    curveSegments: 16
  };
  
  const mainBodyGeometry = new THREE.ExtrudeGeometry(mainShape, extrudeSettings);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const mainBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  mainBody.rotation.x = -Math.PI / 2;
  group.add(mainBody);

  // Manches arrondies et pliées
  const sleeveShape = new THREE.Shape();
  const sleeveRadius = width * 0.05;
  
  // Forme de manche arrondie
  sleeveShape.moveTo(sleeveRadius, 0);
  sleeveShape.absarc(0, 0, sleeveRadius, 0, Math.PI, false);
  sleeveShape.lineTo(-sleeveRadius, height * 0.2);
  sleeveShape.absarc(0, height * 0.2, sleeveRadius, Math.PI, 0, false);
  sleeveShape.closePath();
  
  const sleeveGeometry = new THREE.ExtrudeGeometry(sleeveShape, {
    depth: depth * 0.08,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: depth * 0.01,
    curveSegments: 12
  });
  
  // Manche gauche
  const leftSleeve = new THREE.Mesh(sleeveGeometry, mainBodyMaterial);
  leftSleeve.position.set(-width * 0.4, depth * 0.08, height * 0.1);
  leftSleeve.rotation.set(-Math.PI / 2, 0, Math.PI / 6);
  group.add(leftSleeve);
  
  // Manche droite
  const rightSleeve = new THREE.Mesh(sleeveGeometry, mainBodyMaterial);
  rightSleeve.position.set(width * 0.4, depth * 0.08, height * 0.1);
  rightSleeve.rotation.set(-Math.PI / 2, 0, -Math.PI / 6);
  group.add(rightSleeve);

  // Plis organiques avec des courbes
  const foldCurve = new THREE.EllipseCurve(
    0, 0,
    width * 0.02, height * 0.3,
    0, 2 * Math.PI,
    false,
    0
  );
  
  const foldPoints = foldCurve.getPoints(20);
  const foldGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(foldPoints.map(p => new THREE.Vector3(p.x, 0, p.y))),
    20,
    depth * 0.008,
    8,
    false
  );
  
  const fold1 = new THREE.Mesh(foldGeometry, mainBodyMaterial);
  fold1.position.set(-width * 0.15, depth * 0.12, 0);
  group.add(fold1);
  
  const fold2 = new THREE.Mesh(foldGeometry, mainBodyMaterial);
  fold2.position.set(width * 0.15, depth * 0.12, 0);
  group.add(fold2);

  return group;
};

// Crée un jean plié avec forme arrondie
const createFoldedJeans = (width: number, height: number, depth: number) => {
  const group = new THREE.Group();
  
  // Forme arrondie pour jean plié
  const jeanShape = new THREE.Shape();
  
  const w = width * 0.4;
  const h = height * 0.8;
  const cornerRadius = Math.min(w, h) * 0.1;
  
  // Forme avec coins arrondis
  jeanShape.moveTo(-w + cornerRadius, -h);
  jeanShape.lineTo(w - cornerRadius, -h);
  jeanShape.arc(0, 0, cornerRadius, -Math.PI / 2, 0);
  jeanShape.lineTo(w, h - cornerRadius);
  jeanShape.arc(0, 0, cornerRadius, 0, Math.PI / 2);
  jeanShape.lineTo(-w + cornerRadius, h);
  jeanShape.arc(0, 0, cornerRadius, Math.PI / 2, Math.PI);
  jeanShape.lineTo(-w, -h + cornerRadius);
  jeanShape.arc(0, 0, cornerRadius, Math.PI, -Math.PI / 2);
  
  const jeanExtrudeSettings = {
    depth: depth * 0.25,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 6,
    bevelSize: depth * 0.04,
    bevelThickness: depth * 0.03,
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

  // Jambes arrondies qui dépassent
  const legShape = new THREE.Shape();
  const legRadius = width * 0.05;
  
  // Forme de jambe arrondie
  legShape.moveTo(legRadius, 0);
  legShape.absarc(legRadius, legRadius, legRadius, -Math.PI / 2, 0, false);
  legShape.lineTo(width * 0.15, height * 0.4 - legRadius);
  legShape.absarc(width * 0.15 - legRadius, height * 0.4 - legRadius, legRadius, 0, Math.PI / 2, false);
  legShape.lineTo(legRadius, height * 0.4);
  legShape.absarc(legRadius, height * 0.4 - legRadius, legRadius, Math.PI / 2, Math.PI, false);
  legShape.lineTo(0, legRadius);
  legShape.absarc(legRadius, legRadius, legRadius, Math.PI, -Math.PI / 2, false);
  
  const legGeometry = new THREE.ExtrudeGeometry(legShape, {
    depth: depth * 0.2,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: depth * 0.02,
    curveSegments: 16
  });
  
  // Jambe gauche
  const leftLeg = new THREE.Mesh(legGeometry, mainBodyMaterial);
  leftLeg.position.set(-width * 0.25, depth * 0.13, -height * 0.3);
  leftLeg.rotation.x = -Math.PI / 2;
  group.add(leftLeg);
  
  // Jambe droite
  const rightLeg = new THREE.Mesh(legGeometry, mainBodyMaterial);
  rightLeg.position.set(0, depth * 0.13, -height * 0.3);
  rightLeg.rotation.x = -Math.PI / 2;
  group.add(rightLeg);

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