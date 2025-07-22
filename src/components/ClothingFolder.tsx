import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Download, Trash2, Eye, Shirt, Car } from "lucide-react";

interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string;
  type: ClothingType;
}

type ClothingType = "jean" | "tshirt" | "chemise";

const CLOTHING_TEMPLATES = {
  jean: {
    name: "Jean",
    icon: Car,
    cropSettings: {
      // Pour les jeans : format très compact et rectangulaire
      finalWidth: 300,
      finalHeight: 200,
      sourceWidth: 0.9,      // Prendre 90% de la largeur source
      sourceHeight: 0.85,    // Prendre 85% de la hauteur source
      offsetX: 0.05,         // Centré horizontalement
      offsetY: 0.1,          // Partir un peu plus bas pour éviter le haut
      foldEffect: true,      // Effet de pliage visible
      foldLines: 2           // Nombre de lignes de pliage
    }
  },
  tshirt: {
    name: "T-Shirt",
    icon: Shirt,
    cropSettings: {
      // Pour les t-shirts : format carré compact
      finalWidth: 250,
      finalHeight: 180,
      sourceWidth: 0.8,      // Prendre 80% de la largeur source
      sourceHeight: 0.7,     // Prendre 70% de la hauteur source (manches pliées)
      offsetX: 0.1,          // Centré
      offsetY: 0.15,         // Partir plus bas pour éviter le col
      foldEffect: true,
      foldLines: 3           // Plus de plis pour les t-shirts
    }
  },
  chemise: {
    name: "Chemise",
    icon: Shirt,
    cropSettings: {
      // Pour les chemises : format rectangulaire intermédiaire
      finalWidth: 280,
      finalHeight: 200,
      sourceWidth: 0.85,
      sourceHeight: 0.75,
      offsetX: 0.075,
      offsetY: 0.12,
      foldEffect: true,
      foldLines: 2
    }
  }
};

export const ClothingFolder = () => {
  const [selectedType, setSelectedType] = useState<ClothingType>("jean");
  const [uploadedImages, setUploadedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File, type: ClothingType): Promise<ProcessedImage> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const template = CLOTHING_TEMPLATES[type];
        const { finalWidth, finalHeight, sourceWidth, sourceHeight, offsetX, offsetY, foldEffect, foldLines } = template.cropSettings;

        // Définir les dimensions du canvas final selon le gabarit
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        if (ctx) {
          // Fond blanc
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Calculer les dimensions de recadrage basées sur l'image source
          const cropWidth = img.width * sourceWidth;
          const cropHeight = img.height * sourceHeight;
          const cropX = img.width * offsetX;
          const cropY = img.height * offsetY;

          // Marges pour le rendu final
          const margin = 15;
          const drawWidth = canvas.width - (margin * 2);
          const drawHeight = canvas.height - (margin * 2);

          if (foldEffect) {
            // Simulation d'un vêtement plié avec plusieurs sections
            const sectionHeight = drawHeight / (foldLines + 1);
            
            for (let i = 0; i <= foldLines; i++) {
              const yPos = margin + (i * sectionHeight);
              const alpha = 1 - (i * 0.15); // Chaque section devient plus sombre
              
              ctx.save();
              ctx.globalAlpha = alpha;
              
              // Dessiner chaque section du vêtement
              ctx.drawImage(
                img,
                cropX, cropY + (cropHeight * i / (foldLines + 1)), cropWidth, cropHeight / (foldLines + 1),
                margin, yPos, drawWidth, sectionHeight - 5
              );
              
              ctx.restore();

              // Ajouter une ligne de pli sauf pour la dernière section
              if (i < foldLines) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                ctx.fillRect(margin, yPos + sectionHeight - 5, drawWidth, 3);
              }
            }

            // Ajouter une ombre légère en bas pour l'effet 3D
            ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
            ctx.fillRect(margin + 5, margin + drawHeight + 2, drawWidth - 10, 8);

          } else {
            // Rendu simple sans effet de pliage
            ctx.drawImage(
              img,
              cropX, cropY, cropWidth, cropHeight,
              margin, margin, drawWidth, drawHeight
            );
          }

          canvas.toBlob((blob) => {
            if (blob) {
              const processedUrl = URL.createObjectURL(blob);
              const originalUrl = URL.createObjectURL(file);
              
              resolve({
                id: Math.random().toString(36).substr(2, 9),
                originalFile: file,
                originalUrl,
                processedUrl,
                type
              });
            }
          }, "image/png");
        }
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const fileArray = Array.from(files);

    try {
      const processedImages = await Promise.all(
        fileArray.map(file => processImage(file, selectedType))
      );

      setUploadedImages(prev => [...prev, ...processedImages]);
      toast.success(`${fileArray.length} image(s) traitée(s) avec succès`);
    } catch (error) {
      toast.error("Erreur lors du traitement des images");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (image: ProcessedImage) => {
    const link = document.createElement("a");
    link.href = image.processedUrl;
    
    const fileName = image.originalFile.name.replace(/\.[^/.]+$/, "");
    link.download = `${fileName}_plie.png`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Image téléchargée");
  };

  const downloadAll = () => {
    uploadedImages.forEach(image => {
      setTimeout(() => downloadImage(image), 100);
    });
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      const toRemove = prev.find(img => img.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.originalUrl);
        URL.revokeObjectURL(toRemove.processedUrl);
      }
      return updated;
    });
  };

  const clearAll = () => {
    uploadedImages.forEach(img => {
      URL.revokeObjectURL(img.originalUrl);
      URL.revokeObjectURL(img.processedUrl);
    });
    setUploadedImages([]);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Simulateur de Pliage de Vêtements
          </h1>
          <p className="text-muted-foreground">
            Uploadez vos photos de vêtements et obtenez une simulation de pliage automatique
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Configuration et Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type de vêtement</label>
              <Select value={selectedType} onValueChange={(value: ClothingType) => setSelectedType(value)}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLOTHING_TEMPLATES).map(([key, template]) => {
                    const IconComponent = template.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Traitement en cours..." : "Choisir des images"}
              </Button>
            </div>

            {uploadedImages.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={downloadAll} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger tout
                </Button>
                <Button onClick={clearAll} variant="outline">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Effacer tout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploadedImages.map((image) => {
              const IconComponent = CLOTHING_TEMPLATES[image.type].icon;
              return (
                <Card key={image.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      {CLOTHING_TEMPLATES[image.type].name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Original</p>
                        <img 
                          src={image.originalUrl} 
                          alt="Original" 
                          className="w-full h-32 object-cover rounded border"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Plié</p>
                        <img 
                          src={image.processedUrl} 
                          alt="Processed" 
                          className="w-full h-32 object-cover rounded border"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => downloadImage(image)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeImage(image.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {uploadedImages.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground">
                <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune image uploadée</p>
                <p className="text-sm">Sélectionnez un type de vêtement et uploadez vos images pour commencer</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};