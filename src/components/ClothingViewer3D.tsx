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

// Géométries 3D pour chaque type de vêtement
const createClothingGeometry = (type: string) => {
  switch (type) {
    case 'jean':
      // Forme de pantalon/jean
      const jeanShape = new THREE.Shape();
      jeanShape.moveTo(-1, 2);
      jeanShape.lineTo(-1.2, 1);
      jeanShape.lineTo(-0.8, -1);
      jeanShape.lineTo(-0.6, -2);
      jeanShape.lineTo(0.6, -2);
      jeanShape.lineTo(0.8, -1);
      jeanShape.lineTo(1.2, 1);
      jeanShape.lineTo(1, 2);
      jeanShape.lineTo(-1, 2);
      
      return new THREE.ExtrudeGeometry(jeanShape, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 5
      });

    case 'tshirt':
      // Forme de t-shirt
      const tshirtShape = new THREE.Shape();
      tshirtShape.moveTo(-1.5, 1.8);
      tshirtShape.lineTo(-1.8, 1.5);
      tshirtShape.lineTo(-1.8, 1.2);
      tshirtShape.lineTo(-1.2, 1.2);
      tshirtShape.lineTo(-1.2, -1.5);
      tshirtShape.lineTo(1.2, -1.5);
      tshirtShape.lineTo(1.2, 1.2);
      tshirtShape.lineTo(1.8, 1.2);
      tshirtShape.lineTo(1.8, 1.5);
      tshirtShape.lineTo(1.5, 1.8);
      tshirtShape.lineTo(-1.5, 1.8);
      
      return new THREE.ExtrudeGeometry(tshirtShape, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 5
      });

    case 'chemise':
      // Forme de chemise (similar to t-shirt but with collar)
      const chemiseShape = new THREE.Shape();
      chemiseShape.moveTo(-1.3, 2);
      chemiseShape.lineTo(-1.6, 1.7);
      chemiseShape.lineTo(-1.6, 1.4);
      chemiseShape.lineTo(-1.1, 1.4);
      chemiseShape.lineTo(-1.1, -1.8);
      chemiseShape.lineTo(1.1, -1.8);
      chemiseShape.lineTo(1.1, 1.4);
      chemiseShape.lineTo(1.6, 1.4);
      chemiseShape.lineTo(1.6, 1.7);
      chemiseShape.lineTo(1.3, 2);
      chemiseShape.lineTo(-1.3, 2);
      
      return new THREE.ExtrudeGeometry(chemiseShape, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 5
      });

    default:
      return new THREE.BoxGeometry(2, 3, 0.1);
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