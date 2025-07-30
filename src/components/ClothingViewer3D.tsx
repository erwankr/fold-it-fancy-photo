import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from './ui/button';
import { Download, RotateCcw, FileDown } from 'lucide-react';
import { extractShapeContours, createGeometryFromContours } from '../services/shapeExtractor';
import { exportToGLB } from '../services/glbExporter';

interface ClothingViewer3DProps {
  imageUrl: string;
  clothingType: 'jean' | 'tshirt' | 'chemise';
  onDownload?: () => void;
}

// Géométries 3D pour chaque type de vêtement avec bords arrondis
const createClothingGeometry = (type: string) => {
  const extrudeSettings = {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.12,
    bevelSegments: 12,
    curveSegments: 16
  };

  switch (type) {
    case 'jean':
      // Forme de pantalon/jean avec courbes douces
      const jeanShape = new THREE.Shape();
      jeanShape.moveTo(-0.9, 1.8);
      jeanShape.bezierCurveTo(-1.1, 1.6, -1.2, 1.2, -1.1, 0.8);
      jeanShape.bezierCurveTo(-0.9, 0.2, -0.8, -0.5, -0.7, -1.2);
      jeanShape.bezierCurveTo(-0.65, -1.6, -0.6, -1.9, -0.5, -2);
      jeanShape.bezierCurveTo(-0.2, -2.1, 0.2, -2.1, 0.5, -2);
      jeanShape.bezierCurveTo(0.6, -1.9, 0.65, -1.6, 0.7, -1.2);
      jeanShape.bezierCurveTo(0.8, -0.5, 0.9, 0.2, 1.1, 0.8);
      jeanShape.bezierCurveTo(1.2, 1.2, 1.1, 1.6, 0.9, 1.8);
      jeanShape.bezierCurveTo(0.5, 1.9, -0.5, 1.9, -0.9, 1.8);
      
      return new THREE.ExtrudeGeometry(jeanShape, extrudeSettings);

    case 'tshirt':
      // Forme de t-shirt avec manches arrondies
      const tshirtShape = new THREE.Shape();
      // Corps principal
      tshirtShape.moveTo(-1.1, 1.6);
      tshirtShape.bezierCurveTo(-1.1, 1.7, -1.2, 1.8, -1.4, 1.7);
      // Manche gauche
      tshirtShape.bezierCurveTo(-1.7, 1.6, -1.8, 1.4, -1.7, 1.2);
      tshirtShape.bezierCurveTo(-1.6, 1.1, -1.3, 1.1, -1.1, 1.2);
      // Descendre le long du corps
      tshirtShape.bezierCurveTo(-1.1, 0.5, -1.1, -0.5, -1.1, -1.3);
      tshirtShape.bezierCurveTo(-1.1, -1.6, -0.8, -1.7, -0.5, -1.6);
      // Bas du t-shirt
      tshirtShape.bezierCurveTo(0, -1.6, 0.5, -1.6, 1.1, -1.3);
      tshirtShape.bezierCurveTo(1.1, -0.5, 1.1, 0.5, 1.1, 1.2);
      // Manche droite
      tshirtShape.bezierCurveTo(1.3, 1.1, 1.6, 1.1, 1.7, 1.2);
      tshirtShape.bezierCurveTo(1.8, 1.4, 1.7, 1.6, 1.4, 1.7);
      tshirtShape.bezierCurveTo(1.2, 1.8, 1.1, 1.7, 1.1, 1.6);
      // Retour au début
      tshirtShape.bezierCurveTo(0.5, 1.7, -0.5, 1.7, -1.1, 1.6);
      
      return new THREE.ExtrudeGeometry(tshirtShape, extrudeSettings);

    case 'chemise':
      // Forme de chemise avec col arrondi
      const chemiseShape = new THREE.Shape();
      // Col de chemise arrondi
      chemiseShape.moveTo(-1.0, 1.8);
      chemiseShape.bezierCurveTo(-1.2, 1.9, -1.4, 1.8, -1.5, 1.6);
      // Manche gauche
      chemiseShape.bezierCurveTo(-1.6, 1.5, -1.6, 1.3, -1.4, 1.3);
      chemiseShape.bezierCurveTo(-1.2, 1.3, -1.0, 1.3, -1.0, 1.0);
      // Corps de la chemise
      chemiseShape.bezierCurveTo(-1.0, 0.2, -1.0, -0.8, -1.0, -1.6);
      chemiseShape.bezierCurveTo(-1.0, -1.8, -0.7, -1.9, -0.4, -1.8);
      // Bas arrondi
      chemiseShape.bezierCurveTo(0, -1.8, 0.4, -1.8, 1.0, -1.6);
      chemiseShape.bezierCurveTo(1.0, -0.8, 1.0, 0.2, 1.0, 1.0);
      // Manche droite
      chemiseShape.bezierCurveTo(1.0, 1.3, 1.2, 1.3, 1.4, 1.3);
      chemiseShape.bezierCurveTo(1.6, 1.3, 1.6, 1.5, 1.5, 1.6);
      chemiseShape.bezierCurveTo(1.4, 1.8, 1.2, 1.9, 1.0, 1.8);
      // Retour au col
      chemiseShape.bezierCurveTo(0.5, 1.9, -0.5, 1.9, -1.0, 1.8);
      
      return new THREE.ExtrudeGeometry(chemiseShape, extrudeSettings);

    default:
      // Forme par défaut avec bords arrondis
      const defaultShape = new THREE.Shape();
      defaultShape.moveTo(-1.5, 1.5);
      defaultShape.bezierCurveTo(-1.5, 2, -1, 2, 1, 2);
      defaultShape.bezierCurveTo(1.5, 2, 1.5, 1.5, 1.5, -1.5);
      defaultShape.bezierCurveTo(1.5, -2, 1, -2, -1, -2);
      defaultShape.bezierCurveTo(-1.5, -2, -1.5, -1.5, -1.5, 1.5);
      return new THREE.ExtrudeGeometry(defaultShape, extrudeSettings);
  }
};

const ClothingMesh: React.FC<{ 
  imageUrl: string; 
  clothingType: string; 
  onMeshReady?: (mesh: THREE.Mesh) => void 
}> = ({ 
  imageUrl, 
  clothingType,
  onMeshReady 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  // Configuration de la texture
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  // Assurer que la texture couvre toute la surface une seule fois
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);

  // Extract shape from image and create geometry
  useEffect(() => {
    const extractShape = async () => {
      try {
        setIsProcessing(true);
        console.log('Extracting shape from image...');
        const contourPoints = await extractShapeContours(imageUrl);
        const newGeometry = createGeometryFromContours(contourPoints);
        setGeometry(newGeometry);
        console.log('Shape extraction completed');
      } catch (error) {
        console.error('Error extracting shape:', error);
        // Fallback to default shape for clothing type
        const fallbackGeometry = createClothingGeometry(clothingType) as THREE.BufferGeometry;
        setGeometry(fallbackGeometry);
      } finally {
        setIsProcessing(false);
      }
    };

    extractShape();
  }, [imageUrl, clothingType]);

  // Notify parent when mesh is ready
  useEffect(() => {
    if (meshRef.current && onMeshReady && !isProcessing) {
      onMeshReady(meshRef.current);
    }
  }, [onMeshReady, isProcessing]);

  useFrame((state) => {
    if (meshRef.current && !isProcessing) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  if (isProcessing || !geometry) {
    return (
      <mesh>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="gray" transparent opacity={0.5} />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial 
        map={texture} 
        transparent={true}
        side={THREE.DoubleSide}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
};

const ClothingViewer3D: React.FC<ClothingViewer3DProps> = ({ 
  imageUrl, 
  clothingType, 
  onDownload 
}) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentMesh, setCurrentMesh] = useState<THREE.Mesh | null>(null);

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