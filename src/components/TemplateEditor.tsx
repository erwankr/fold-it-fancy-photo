
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, X } from "lucide-react";

interface CropSettings {
  xPercent: number;  // Position X en pourcentage (0-1)
  yPercent: number;  // Position Y en pourcentage (0-1)
  widthPercent: number;  // Largeur en pourcentage (0-1)
  heightPercent: number; // Hauteur en pourcentage (0-1)
  targetAspectRatio: number;  // Ratio cible (largeur/hauteur)
  maxFinalWidth: number;   // Largeur maximale souhaitée
  maxFinalHeight: number;  // Hauteur maximale souhaitée
}

interface TemplateEditorProps {
  imageFile: File;
  clothingType: string;
  onSaveTemplate: (settings: CropSettings) => void;
  onCancel: () => void;
}

export const TemplateEditor = ({ imageFile, clothingType, onSaveTemplate, onCancel }: TemplateEditorProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const loadImage = useCallback(() => {
    if (!canvasRef.current || !imageFile) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Dimensionner le canvas pour s'adapter à l'image
      const maxWidth = 600;
      const maxHeight = 400;
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

      ctx.drawImage(img, 0, 0, width, height);
      imageRef.current = img;
    };
    img.src = URL.createObjectURL(imageFile);
  }, [imageFile]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentRect(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;

    const pos = getMousePos(e);
    const rect = {
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y)
    };

    setCurrentRect(rect);
    redrawCanvas(rect);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const redrawCanvas = (rect?: { x: number; y: number; width: number; height: number }) => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redessiner l'image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Dessiner le rectangle de sélection
    if (rect && rect.width > 0 && rect.height > 0) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      
      // Assombrir tout sauf la zone sélectionnée
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      
      // Dessiner l'overlay en 4 rectangles autour de la sélection
      // Au-dessus
      ctx.fillRect(0, 0, canvas.width, rect.y);
      // À gauche
      ctx.fillRect(0, rect.y, rect.x, rect.height);
      // À droite
      ctx.fillRect(rect.x + rect.width, rect.y, canvas.width - rect.x - rect.width, rect.height);
      // En dessous
      ctx.fillRect(0, rect.y + rect.height, canvas.width, canvas.height - rect.y - rect.height);
    }
  };

  const handleSave = () => {
    if (!currentRect || !canvasRef.current || !imageRef.current) {
      toast.error("Veuillez sélectionner une zone de recadrage");
      return;
    }

    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    // Calculer les ratios de redimensionnement
    const scaleX = img.naturalWidth / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;

    // Convertir les coordonnées du canvas vers l'image originale
    const x = currentRect.x * scaleX;
    const y = currentRect.y * scaleY;
    const width = currentRect.width * scaleX;
    const height = currentRect.height * scaleY;
    
    // S'assurer que les coordonnées sont dans les limites de l'image
    const clampedX = Math.max(0, Math.min(x, img.naturalWidth - 1));
    const clampedY = Math.max(0, Math.min(y, img.naturalHeight - 1));
    const clampedWidth = Math.min(width, img.naturalWidth - clampedX);
    const clampedHeight = Math.min(height, img.naturalHeight - clampedY);
    
    // Convertir en pourcentages de l'image originale (valeurs entre 0 et 1)
    const xPercent = clampedX / img.naturalWidth;
    const yPercent = clampedY / img.naturalHeight;
    const widthPercent = clampedWidth / img.naturalWidth;
    const heightPercent = clampedHeight / img.naturalHeight;
    
    // Calculer l'aspect ratio de la sélection pour ce gabarit
    const selectedAspectRatio = clampedWidth / clampedHeight;
    
    // Calculer les dimensions finales basées sur l'aire relative
    const areaPercent = widthPercent * heightPercent;
    const scaleFactor = Math.max(0.5, Math.min(2.0, 1 / Math.sqrt(areaPercent)));
    
    const settings: CropSettings = {
      xPercent,
      yPercent,
      widthPercent,
      heightPercent,
      targetAspectRatio: selectedAspectRatio,
      maxFinalWidth: Math.round(300 * scaleFactor),
      maxFinalHeight: Math.round(400 * scaleFactor)
    };

    console.log("Sauvegarde du gabarit avec aspect ratio fixe:", {
      ...settings,
      areaPercent,
      scaleFactor,
      selectedAspectRatio
    });

    onSaveTemplate(settings);
    toast.success(`Gabarit ${clothingType} sauvegardé`);
  };

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Définir le gabarit pour {clothingType}</span>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cliquez et glissez sur l'image pour définir la zone qui sera recadrée pour ce type de vêtement.
          </p>
          <div className="border rounded-lg overflow-hidden bg-gray-50 flex justify-center items-center">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="cursor-crosshair max-w-full"
              style={{ display: 'block' }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
