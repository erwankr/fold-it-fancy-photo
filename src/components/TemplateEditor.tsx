
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, X } from "lucide-react";

interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  finalWidth: number;
  finalHeight: number;
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
      
      // Overlay semi-transparent
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    }
  };

  const handleSave = () => {
    if (!currentRect || !canvasRef.current) {
      toast.error("Veuillez sélectionner une zone de recadrage");
      return;
    }

    const canvas = canvasRef.current;
    const scaleX = imageSize.width / canvas.width;
    const scaleY = imageSize.height / canvas.height;

    const settings: CropSettings = {
      x: currentRect.x * scaleX,
      y: currentRect.y * scaleY,
      width: currentRect.width * scaleX,
      height: currentRect.height * scaleY,
      finalWidth: Math.min(300, currentRect.width * 2),
      finalHeight: Math.min(250, currentRect.height * 2)
    };

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
