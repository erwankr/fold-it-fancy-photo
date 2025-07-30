import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from './ui/button';
import { Download, RotateCcw, FileDown } from 'lucide-react';
import { extractShapeContours, createGeometryFromContours } from '../services/shapeExtractor';
import { exportToGLB } from '../services/glbExporter';

interface ClothingViewer3DProps {
  imageUrl: string;
  clothingType: 'jean' | 'tshirt' | 'chemise';
  dimensions?: {
    width: number;   // en cm
    height: number;  // en cm
    depth: number;   // en cm
  };
  onDownload?: () => void;
}

// Géométries 3D pour chaque type de vêtement avec bords arrondis
const createClothingGeometry = (type: string, dimensions?: { width: number; height: number; depth: number }) => {
  // Convertir les dimensions en centimètres vers les unités Three.js (1 cm = 0.1 unités pour plus de visibilité)
  const scale = 0.1;
  const width = dimensions ? dimensions.width * scale : 4;
  const height = dimensions ? dimensions.height * scale : 6;
  const depth = dimensions ? dimensions.depth * scale : 0.3;
  
  const extrudeSettings = {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.3,
    bevelSize: Math.min(width, height) * 0.05,
    bevelSegments: 12,
    curveSegments: 16
  };

  switch (type) {
    case 'jean':
      // Forme de pantalon/jean avec courbes douces, adaptée aux dimensions
      const jeanShape = new THREE.Shape();
      const w = width / 2;
      const h = height / 2;
      jeanShape.moveTo(-w * 0.45, h * 0.9);
      jeanShape.bezierCurveTo(-w * 0.55, h * 0.8, -w * 0.6, h * 0.6, -w * 0.55, h * 0.4);
      jeanShape.bezierCurveTo(-w * 0.45, h * 0.1, -w * 0.4, -h * 0.25, -w * 0.35, -h * 0.6);
      jeanShape.bezierCurveTo(-w * 0.325, -h * 0.8, -w * 0.3, -h * 0.95, -w * 0.25, -h);
      jeanShape.bezierCurveTo(-w * 0.1, -h * 1.05, w * 0.1, -h * 1.05, w * 0.25, -h);
      jeanShape.bezierCurveTo(w * 0.3, -h * 0.95, w * 0.325, -h * 0.8, w * 0.35, -h * 0.6);
      jeanShape.bezierCurveTo(w * 0.4, -h * 0.25, w * 0.45, h * 0.1, w * 0.55, h * 0.4);
      jeanShape.bezierCurveTo(w * 0.6, h * 0.6, w * 0.55, h * 0.8, w * 0.45, h * 0.9);
      jeanShape.bezierCurveTo(w * 0.25, h * 0.95, -w * 0.25, h * 0.95, -w * 0.45, h * 0.9);
      
      return new THREE.ExtrudeGeometry(jeanShape, extrudeSettings);

    case 'tshirt':
      // Forme de t-shirt avec manches arrondies, adaptée aux dimensions
      const tshirtShape = new THREE.Shape();
      const wt = width / 2;
      const ht = height / 2;
      // Corps principal
      tshirtShape.moveTo(-wt * 0.55, ht * 0.8);
      tshirtShape.bezierCurveTo(-wt * 0.55, ht * 0.85, -wt * 0.6, ht * 0.9, -wt * 0.7, ht * 0.85);
      // Manche gauche
      tshirtShape.bezierCurveTo(-wt * 0.85, ht * 0.8, -wt * 0.9, ht * 0.7, -wt * 0.85, ht * 0.6);
      tshirtShape.bezierCurveTo(-wt * 0.8, ht * 0.55, -wt * 0.65, ht * 0.55, -wt * 0.55, ht * 0.6);
      // Descendre le long du corps
      tshirtShape.bezierCurveTo(-wt * 0.55, ht * 0.25, -wt * 0.55, -ht * 0.25, -wt * 0.55, -ht * 0.65);
      tshirtShape.bezierCurveTo(-wt * 0.55, -ht * 0.8, -wt * 0.4, -ht * 0.85, -wt * 0.25, -ht * 0.8);
      // Bas du t-shirt
      tshirtShape.bezierCurveTo(0, -ht * 0.8, wt * 0.25, -ht * 0.8, wt * 0.55, -ht * 0.65);
      tshirtShape.bezierCurveTo(wt * 0.55, -ht * 0.25, wt * 0.55, ht * 0.25, wt * 0.55, ht * 0.6);
      // Manche droite
      tshirtShape.bezierCurveTo(wt * 0.65, ht * 0.55, wt * 0.8, ht * 0.55, wt * 0.85, ht * 0.6);
      tshirtShape.bezierCurveTo(wt * 0.9, ht * 0.7, wt * 0.85, ht * 0.8, wt * 0.7, ht * 0.85);
      tshirtShape.bezierCurveTo(wt * 0.6, ht * 0.9, wt * 0.55, ht * 0.85, wt * 0.55, ht * 0.8);
      // Retour au début
      tshirtShape.bezierCurveTo(wt * 0.25, ht * 0.85, -wt * 0.25, ht * 0.85, -wt * 0.55, ht * 0.8);
      
      return new THREE.ExtrudeGeometry(tshirtShape, extrudeSettings);

    case 'chemise':
      // Forme de chemise avec col arrondi, adaptée aux dimensions
      const chemiseShape = new THREE.Shape();
      const wc = width / 2;
      const hc = height / 2;
      // Col de chemise arrondi
      chemiseShape.moveTo(-wc * 0.5, hc * 0.9);
      chemiseShape.bezierCurveTo(-wc * 0.6, hc * 0.95, -wc * 0.7, hc * 0.9, -wc * 0.75, hc * 0.8);
      // Manche gauche
      chemiseShape.bezierCurveTo(-wc * 0.8, hc * 0.75, -wc * 0.8, hc * 0.65, -wc * 0.7, hc * 0.65);
      chemiseShape.bezierCurveTo(-wc * 0.6, hc * 0.65, -wc * 0.5, hc * 0.65, -wc * 0.5, hc * 0.5);
      // Corps de la chemise
      chemiseShape.bezierCurveTo(-wc * 0.5, hc * 0.1, -wc * 0.5, -hc * 0.4, -wc * 0.5, -hc * 0.8);
      chemiseShape.bezierCurveTo(-wc * 0.5, -hc * 0.9, -wc * 0.35, -hc * 0.95, -wc * 0.2, -hc * 0.9);
      // Bas arrondi
      chemiseShape.bezierCurveTo(0, -hc * 0.9, wc * 0.2, -hc * 0.9, wc * 0.5, -hc * 0.8);
      chemiseShape.bezierCurveTo(wc * 0.5, -hc * 0.4, wc * 0.5, hc * 0.1, wc * 0.5, hc * 0.5);
      // Manche droite
      chemiseShape.bezierCurveTo(wc * 0.5, hc * 0.65, wc * 0.6, hc * 0.65, wc * 0.7, hc * 0.65);
      chemiseShape.bezierCurveTo(wc * 0.8, hc * 0.65, wc * 0.8, hc * 0.75, wc * 0.75, hc * 0.8);
      chemiseShape.bezierCurveTo(wc * 0.7, hc * 0.9, wc * 0.6, hc * 0.95, wc * 0.5, hc * 0.9);
      // Retour au col
      chemiseShape.bezierCurveTo(wc * 0.25, hc * 0.95, -wc * 0.25, hc * 0.95, -wc * 0.5, hc * 0.9);
      
      return new THREE.ExtrudeGeometry(chemiseShape, extrudeSettings);

    default:
      // Forme par défaut avec bords arrondis, adaptée aux dimensions
      const defaultShape = new THREE.Shape();
      const wd = width / 2;
      const hd = height / 2;
      defaultShape.moveTo(-wd * 0.75, hd * 0.75);
      defaultShape.bezierCurveTo(-wd * 0.75, hd, -wd * 0.5, hd, wd * 0.5, hd);
      defaultShape.bezierCurveTo(wd * 0.75, hd, wd * 0.75, hd * 0.75, wd * 0.75, -hd * 0.75);
      defaultShape.bezierCurveTo(wd * 0.75, -hd, wd * 0.5, -hd, -wd * 0.5, -hd);
      defaultShape.bezierCurveTo(-wd * 0.75, -hd, -wd * 0.75, -hd * 0.75, -wd * 0.75, hd * 0.75);
      return new THREE.ExtrudeGeometry(defaultShape, extrudeSettings);
  }
};

// Composant optimisé pour charger et texturer les modèles GLB
const ClothingMesh: React.FC<{ 
  imageUrl: string; 
  clothingType: string; 
  dimensions?: { width: number; height: number; depth: number };
  onMeshReady?: (mesh: THREE.Group) => void 
}> = ({ 
  imageUrl, 
  clothingType,
  dimensions,
  onMeshReady 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [texturedMesh, setTexturedMesh] = useState<THREE.Group | null>(null);
  
  // Charger la texture et le modèle GLB
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  const { scene: originalScene } = useGLTF('/models/tshirt.glb');
  
  // Préparer la texture optimisée
  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.flipY = false;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }, [texture]);

  // Créer et texturer le mesh
  useEffect(() => {
    if (!originalScene || !texture) return;

    // Cloner le modèle pour éviter de modifier l'original
    const clonedScene = originalScene.clone();
    
    // Créer un matériau optimisé avec la texture
    const textureMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: false,
      side: THREE.FrontSide,
      roughness: 0.8,
      metalness: 0.0,
      envMapIntensity: 1.0
    });
    
    // Appliquer le matériau à tous les meshes du modèle
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Cloner la géométrie si nécessaire
        if (child.geometry) {
          child.geometry = child.geometry.clone();
        }
        
        // Appliquer le nouveau matériau
        child.material = textureMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
        
        console.log(`Texture applied to mesh: ${child.name || 'unnamed'}`);
      }
    });
    
    // Ajuster l'échelle pour être visible
    const scale = dimensions ? Math.max(dimensions.width, dimensions.height, dimensions.depth) * 0.02 : 2;
    clonedScene.scale.setScalar(scale);
    
    // Centrer le modèle
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    clonedScene.position.sub(center);
    
    setTexturedMesh(clonedScene);
    
    if (onMeshReady) {
      onMeshReady(clonedScene);
    }
    
    console.log('GLB model setup completed with texture');
    
  }, [originalScene, texture, dimensions, onMeshReady]);

  // Ajouter le mesh texturé au groupe
  useEffect(() => {
    if (!groupRef.current || !texturedMesh) return;
    
    // Vider le groupe et ajouter le nouveau mesh
    groupRef.current.clear();
    groupRef.current.add(texturedMesh);
    
  }, [texturedMesh]);

  // Animation de rotation douce
  useFrame((state) => {
    if (groupRef.current && texturedMesh) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return <group ref={groupRef} />;
};

const ClothingViewer3D: React.FC<ClothingViewer3DProps> = ({
  imageUrl, 
  clothingType, 
  dimensions,
  onDownload 
}) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentMesh, setCurrentMesh] = useState<THREE.Group | null>(null);

  const handleDownload3D = () => {
    // Pour l'instant, on déclenche le téléchargement de l'image
    // Dans une version future, on pourrait exporter le modèle 3D
    if (onDownload) {
      onDownload();
    }
  };

  const handleExportGLB = async () => {
    if (!currentMesh) {
      console.error('No mesh available for export');
      return;
    }

    try {
      const filename = `${clothingType}_3d_model.glb`;
      await exportToGLB(currentMesh, filename);
    } catch (error) {
      console.error('Error exporting GLB:', error);
    }
  };

  return (
    <div className="w-full h-96 bg-background rounded-lg border relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        
        <ClothingMesh 
          imageUrl={imageUrl} 
          clothingType={clothingType} 
          dimensions={dimensions}
          onMeshReady={setCurrentMesh}
        />
        
        <OrbitControls 
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
      
      <div className="absolute top-2 right-2 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAutoRotate(!autoRotate)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          onClick={handleDownload3D}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportGLB}
          disabled={!currentMesh}
          className="bg-background/80 backdrop-blur-sm"
        >
          <FileDown className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="absolute bottom-2 left-2 text-sm text-white bg-black/50 px-2 py-1 rounded">
        Vue 3D - {clothingType.toUpperCase()}
      </div>
    </div>
  );
};

export default ClothingViewer3D;