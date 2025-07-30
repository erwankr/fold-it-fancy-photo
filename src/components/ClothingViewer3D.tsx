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
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  // Essayer de charger le modèle GLB avec gestion d'erreur
  let tshirtScene = null;
  try {
    const gltf = useGLTF('/models/tshirt.glb');
    tshirtScene = gltf.scene;
    console.log('GLB model loaded successfully:', gltf);
  } catch (error) {
    console.error('Error loading GLB model:', error);
    setHasError(true);
  }
  
  // Configuration de la texture
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);

  // Appliquer la texture et ajuster les dimensions
  useEffect(() => {
    if (!groupRef.current) return;
    
    setIsProcessing(true);
    console.log('Starting ClothingMesh setup...', { 
      hasTshirtScene: !!tshirtScene, 
      hasError,
      dimensions 
    });

    if (tshirtScene && !hasError) {
      try {
        // Cloner la scene
        const clonedScene = tshirtScene.clone();
        console.log('Scene cloned successfully');
        
        // Appliquer la texture à tous les meshes
        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            console.log('Found mesh in GLB:', child.name);
            
            // Créer un nouveau matériau avec la texture
            const material = new THREE.MeshStandardMaterial({
              map: texture,
              transparent: true,
              side: THREE.DoubleSide,
              roughness: 0.7,
              metalness: 0.1
            });
            
            child.material = material;
            console.log('Applied texture to mesh:', child.name);
          }
        });
        
        // Ajuster les dimensions - échelle plus grande pour être visible
        const baseScale = 3; // Beaucoup plus grand pour être visible
        if (dimensions) {
          const scale = baseScale * 0.01; // Ajuster selon les dimensions
          clonedScene.scale.setScalar(scale);
          console.log('Applied scale with dimensions:', scale);
        } else {
          clonedScene.scale.setScalar(baseScale);
          console.log('Applied base scale:', baseScale);
        }
        
        // Centrer le modèle
        clonedScene.position.set(0, 0, 0);
        
        // Vider et ajouter le modèle
        groupRef.current.clear();
        groupRef.current.add(clonedScene);
        
        console.log('GLB model added to scene successfully');
        
        if (onMeshReady) {
          onMeshReady(groupRef.current);
        }
        
      } catch (error) {
        console.error('Error setting up GLB model:', error);
        setHasError(true);
      }
    } else {
      // Fallback vers une géométrie simple
      console.log('Using fallback geometry...');
      
      const geometry = new THREE.BoxGeometry(2, 3, 0.2);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Appliquer les dimensions
      if (dimensions) {
        const scale = 0.1;
        mesh.scale.set(
          dimensions.width * scale,
          dimensions.height * scale,
          dimensions.depth * scale
        );
      }
      
      groupRef.current.clear();
      groupRef.current.add(mesh);
      
      if (onMeshReady) {
        onMeshReady(groupRef.current);
      }
    }
    
    setIsProcessing(false);
  }, [tshirtScene, texture, dimensions, onMeshReady, hasError]);

  useFrame((state) => {
    if (groupRef.current && !isProcessing) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  if (isProcessing) {
    return (
      <mesh>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="gray" transparent opacity={0.5} />
      </mesh>
    );
  }

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