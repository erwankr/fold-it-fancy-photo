import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from './ui/button';
import { Download, RotateCcw } from 'lucide-react';

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

const ClothingMesh: React.FC<{ imageUrl: string; clothingType: string }> = ({ 
  imageUrl, 
  clothingType 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  // Configuration de la texture
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.flipY = false;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const geometry = createClothingGeometry(clothingType);

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

  const handleDownload3D = () => {
    // Pour l'instant, on déclenche le téléchargement de l'image
    // Dans une version future, on pourrait exporter le modèle 3D
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <div className="w-full h-96 bg-background rounded-lg border relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        
        <ClothingMesh imageUrl={imageUrl} clothingType={clothingType} />
        
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
      </div>
      
      <div className="absolute bottom-2 left-2">
        <Text fontSize={0.1} color="white">
          Vue 3D - {clothingType.toUpperCase()}
        </Text>
      </div>
    </div>
  );
};

export default ClothingViewer3D;