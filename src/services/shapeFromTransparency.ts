import * as THREE from 'three';

interface ContourPoint {
  x: number;
  y: number;
}

// Analyse une image PNG pour extraire le contour basé sur la transparence
export const extractShapeFromTransparency = async (imageUrl: string): Promise<THREE.Shape | null> => {
  try {
    console.log('Starting transparency extraction for:', imageUrl);
    
    // Charger l'image
    const img = await loadImageFromUrl(imageUrl);
    
    // Créer un canvas pour analyser les pixels
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return null;
    }
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    console.log('Canvas created and image drawn:', canvas.width, 'x', canvas.height);
    
    // Obtenir les données des pixels
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    console.log('Image data extracted, analyzing transparency...');
    
    // Créer une carte de transparence
    const alphaMap = createAlphaMap(data, canvas.width, canvas.height);
    
    // Détecter les contours
    const contour = detectContour(alphaMap, canvas.width, canvas.height);
    
    console.log('Contour detected with', contour.length, 'points');
    
    if (contour.length < 3) {
      console.warn('Not enough contour points, falling back to default shape');
      return null;
    }
    
    // Convertir en forme Three.js
    const shape = createShapeFromContour(contour, canvas.width, canvas.height);
    
    console.log('Shape created successfully');
    return shape;
    
  } catch (error) {
    console.error('Erreur lors de l\'extraction de forme:', error);
    return null;
  }
};

// Charge une image depuis une URL
const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('Image loaded successfully:', img.width, 'x', img.height);
      resolve(img);
    };
    img.onerror = (error) => {
      console.error('Error loading image:', error);
      reject(error);
    };
    img.src = url;
  });
};

// Crée une carte binaire basée sur le canal alpha
const createAlphaMap = (data: Uint8ClampedArray, width: number, height: number): boolean[][] => {
  const alphaMap: boolean[][] = [];
  
  for (let y = 0; y < height; y++) {
    alphaMap[y] = [];
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3]; // Canal alpha
      alphaMap[y][x] = alpha > 128; // Seuil à 50% de transparence
    }
  }
  
  return alphaMap;
};

// Détecte le contour principal de la forme
const detectContour = (alphaMap: boolean[][], width: number, height: number): ContourPoint[] => {
  const contour: ContourPoint[] = [];
  
  // Algorithme de contour simplifié - on trace le périmètre
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alphaMap[y][x]) {
        // Vérifier si c'est un point de contour (adjacent à une zone transparente)
        const isEdge = isEdgePixel(alphaMap, x, y, width, height);
        if (isEdge) {
          contour.push({ x, y });
        }
      }
    }
  }
  
  // Simplifier le contour pour réduire le nombre de points
  return simplifyContour(contour, width, height);
};

// Vérifie si un pixel est sur le bord (adjacent à une zone transparente)
const isEdgePixel = (alphaMap: boolean[][], x: number, y: number, width: number, height: number): boolean => {
  if (!alphaMap[y][x]) return false; // Pixel transparent
  
  // Vérifier les 8 directions
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    
    // Si on sort des limites ou si le pixel adjacent est transparent
    if (nx < 0 || nx >= width || ny < 0 || ny >= height || !alphaMap[ny][nx]) {
      return true;
    }
  }
  
  return false;
};

// Simplifie le contour en réduisant le nombre de points
const simplifyContour = (contour: ContourPoint[], width: number, height: number): ContourPoint[] => {
  if (contour.length < 3) return contour;
  
  const simplified: ContourPoint[] = [];
  const tolerance = Math.min(width, height) * 0.01; // 1% de la taille de l'image
  
  // Algorithme de simplification Douglas-Peucker simplifié
  let i = 0;
  while (i < contour.length) {
    simplified.push(contour[i]);
    
    // Sauter les points trop proches
    let j = i + 1;
    while (j < contour.length && distance(contour[i], contour[j]) < tolerance) {
      j++;
    }
    i = j;
  }
  
  return simplified.length >= 3 ? simplified : contour;
};

// Calcule la distance entre deux points
const distance = (p1: ContourPoint, p2: ContourPoint): number => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

// Convertit un contour en forme Three.js
const createShapeFromContour = (contour: ContourPoint[], width: number, height: number): THREE.Shape => {
  const shape = new THREE.Shape();
  
  if (contour.length === 0) return shape;
  
  // Normaliser les coordonnées entre -1 et 1
  const normalizeX = (x: number) => (x / width - 0.5) * 2;
  const normalizeY = (y: number) => -(y / height - 0.5) * 2; // Inverser Y
  
  // Commencer par le premier point
  const firstPoint = contour[0];
  shape.moveTo(normalizeX(firstPoint.x), normalizeY(firstPoint.y));
  
  // Ajouter les autres points avec des courbes lisses
  for (let i = 1; i < contour.length; i++) {
    const current = contour[i];
    const next = contour[(i + 1) % contour.length];
    const prev = contour[i - 1];
    
    // Calculer les points de contrôle pour une courbe lisse
    const controlPoint1 = {
      x: normalizeX(current.x + (current.x - prev.x) * 0.1),
      y: normalizeY(current.y + (current.y - prev.y) * 0.1)
    };
    
    const controlPoint2 = {
      x: normalizeX(current.x + (next.x - current.x) * 0.1),
      y: normalizeY(current.y + (next.y - current.y) * 0.1)
    };
    
    // Utiliser une courbe quadratique pour un contour lisse
    shape.quadraticCurveTo(
      controlPoint1.x, controlPoint1.y,
      normalizeX(current.x), normalizeY(current.y)
    );
  }
  
  // Fermer la forme
  shape.closePath();
  
  return shape;
};

// Crée une géométrie 3D à partir d'une forme basée sur la transparence
export const createGeometryFromTransparency = (
  shape: THREE.Shape,
  depth: number = 0.1
): THREE.ExtrudeGeometry => {
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 2,
    bevelSize: depth * 0.05,
    bevelThickness: depth * 0.03,
    curveSegments: 16
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
};