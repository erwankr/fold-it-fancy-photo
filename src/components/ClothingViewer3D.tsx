import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from './ui/button';
import { Download, RotateCcw, FileDown } from 'lucide-react';
import { exportToGLB } from '../services/glbExporter';
import { createFoldedClothingGeometry, applyFoldedTexture } from '../services/foldedClothingGeometry';

interface CropSettings {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  targetAspectRatio: number;
  maxFinalWidth: number;
  maxFinalHeight: number;
}

interface ClothingViewer3DProps {
  imageUrl: string;
  clothingType: 'jean' | 'tshirt' | 'chemise';
  dimensions?: {
    width: number;   // en cm
    height: number;  // en cm
    depth: number;   // en cm
  };
  cropSettings?: CropSettings;
  onDownload?: () => void;
}

// Composant optimisé pour créer des vêtements pliés réalistes
const ClothingMesh: React.FC<{ 
  imageUrl: string; 
  clothingType: 'jean' | 'tshirt' | 'chemise'; 
  dimensions?: { width: number; height: number; depth: number };
  cropSettings?: CropSettings;
  onMeshReady?: (mesh: THREE.Group) => void 
}> = ({ 
  imageUrl, 
  clothingType,
  dimensions,
  cropSettings,
  onMeshReady 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [foldedMesh, setFoldedMesh] = useState<THREE.Group | null>(null);
  
  // Charger uniquement la texture
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  
  // Préparer la texture optimisée
  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.flipY = false;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }, [texture]);

  // Créer la géométrie pliée et appliquer la texture
  useEffect(() => {
    if (!texture) return;

    try {
      console.log('Creating folded clothing geometry for:', clothingType);
      console.log('Image URL for transparency extraction:', imageUrl);
      
      // Créer la géométrie pliée personnalisée de manière synchrone
      const foldedGeometry = createFoldedClothingGeometry(clothingType, imageUrl, dimensions, cropSettings);
      
      if (!foldedGeometry) {
        console.error('Failed to create geometry');
        return;
      }
      
      console.log('Geometry created, applying texture...');
      
      // Appliquer la texture réaliste avec les paramètres de découpe
      applyFoldedTexture(foldedGeometry, texture, clothingType, cropSettings);
      
      // Ajuster l'échelle générale pour être visible
      const scale = dimensions ? 
        Math.max(dimensions.width, dimensions.height) * 0.05 : 
        2.0; // Échelle plus importante par défaut
      foldedGeometry.scale.setScalar(scale);
      
      console.log('Applied scale:', scale, 'to geometry with bounds:', foldedGeometry);
      
      // Centrer le modèle
      const box = new THREE.Box3().setFromObject(foldedGeometry);
      const center = box.getCenter(new THREE.Vector3());
      foldedGeometry.position.sub(center);
      
      console.log('Setting folded mesh:', foldedGeometry);
      setFoldedMesh(foldedGeometry);
      
      if (onMeshReady) {
        onMeshReady(foldedGeometry);
      }
      
      console.log('Folded clothing geometry created successfully');
    } catch (error) {
      console.error('Error creating geometry:', error);
    }
    
  }, [texture, clothingType, imageUrl, dimensions, cropSettings, onMeshReady]);

  // Ajouter le mesh plié au groupe
  useEffect(() => {
    if (!groupRef.current || !foldedMesh) return;
    
    console.log('Adding mesh to group:', foldedMesh);
    
    // Vider le groupe et ajouter le nouveau mesh
    groupRef.current.clear();
    groupRef.current.add(foldedMesh);
    
    console.log('Mesh added to group. Group children count:', groupRef.current.children.length);
    
  }, [foldedMesh]);

  // Animation de rotation douce
  useFrame((state) => {
    if (groupRef.current && foldedMesh) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return <group ref={groupRef} />;
};

const ClothingViewer3D: React.FC<ClothingViewer3DProps> = ({
  imageUrl, 
  clothingType, 
  dimensions,
  cropSettings,
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
      <Canvas 
        camera={{ position: [0, 2, 8], fov: 50 }} // Position caméra ajustée
        gl={{ 
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
          antialias: true // Réactiver l'antialiasing
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, 5, -3]} intensity={0.8} />
        <pointLight position={[0, 8, 0]} intensity={0.5} />
        <hemisphereLight args={[0xffffff, 0x404040]} intensity={0.4} />
        
        <ClothingMesh 
          imageUrl={imageUrl} 
          clothingType={clothingType} 
          dimensions={dimensions}
          cropSettings={cropSettings}
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