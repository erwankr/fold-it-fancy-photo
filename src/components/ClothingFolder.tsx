import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Download, Trash2, Settings, Shirt, Zap, UserCheck, Box, X } from "lucide-react";
import { TemplateEditor } from "./TemplateEditor";
import { processImageWithTemplate } from "./ImageProcessor";
import ClothingViewer3D from "./ClothingViewer3D";
import JSZip from "jszip";

interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string;
  type: ClothingType;
}

interface CropSettings {
  xPercent: number;  // Position X en pourcentage (0-1)
  yPercent: number;  // Position Y en pourcentage (0-1)
  widthPercent: number;  // Largeur en pourcentage (0-1)
  heightPercent: number; // Hauteur en pourcentage (0-1)
  targetAspectRatio: number;  // Ratio cible (largeur/hauteur)
  maxFinalWidth: number;   // Largeur maximale souhaitée
  maxFinalHeight: number;  // Hauteur maximale souhaitée
}

type ClothingType = "jean" | "tshirt" | "chemise";

const CLOTHING_TEMPLATES = {
  jean: {
    name: "Jean",
    icon: Zap,
    defaultSettings: {
      xPercent: 0.1,
      yPercent: 0.2,
      widthPercent: 0.8,
      heightPercent: 0.6,
      targetAspectRatio: 1.2, // 1.2:1 (un peu plus large que haut)
      maxFinalWidth: 300,
      maxFinalHeight: 250
    }
  },
  tshirt: {
    name: "T-Shirt", 
    icon: Shirt,
    defaultSettings: {
      xPercent: 0.15,
      yPercent: 0.05, // Commencer plus haut pour inclure le col
      widthPercent: 0.7,
      heightPercent: 0.9, // Prendre plus de hauteur
      targetAspectRatio: 0.6, // 600/1000 = 0.6 (plus haut que large)
      maxFinalWidth: 240,
      maxFinalHeight: 400
    }
  },
  chemise: {
    name: "Chemise",
    icon: UserCheck,
    defaultSettings: {
      xPercent: 0.1,
      yPercent: 0.02, // Encore plus haut pour le col de chemise
      widthPercent: 0.8,
      heightPercent: 0.95,
      targetAspectRatio: 0.65, // Similaire au t-shirt mais un peu plus large
      maxFinalWidth: 260,
      maxFinalHeight: 400
    }
  }
};

export const ClothingFolder = () => {
  const [selectedType, setSelectedType] = useState<ClothingType>("jean");
  const [uploadedImages, setUploadedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateImageFile, setTemplateImageFile] = useState<File | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Record<ClothingType, CropSettings>>({
    jean: CLOTHING_TEMPLATES.jean.defaultSettings,
    tshirt: CLOTHING_TEMPLATES.tshirt.defaultSettings,
    chemise: CLOTHING_TEMPLATES.chemise.defaultSettings
  });
  const [selectedImageFor3D, setSelectedImageFor3D] = useState<ProcessedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const fileArray = Array.from(files);

    try {
      const processedImages = await Promise.all(
        fileArray.map(file => processImageWithTemplate(file, customTemplates[selectedType]))
      );

      const imagesWithType = processedImages.map(img => ({
        ...img,
        type: selectedType
      }));

      setUploadedImages(prev => [...prev, ...imagesWithType]);
      toast.success(`${fileArray.length} image(s) traitée(s) avec succès`);
    } catch (error) {
      toast.error("Erreur lors du traitement des images");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setTemplateImageFile(files[0]);
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = (settings: CropSettings) => {
    setCustomTemplates(prev => ({
      ...prev,
      [selectedType]: settings
    }));
    setShowTemplateEditor(false);
    setTemplateImageFile(null);
    toast.success(`Gabarit ${CLOTHING_TEMPLATES[selectedType].name} mis à jour`);
  };

  const downloadImage = (image: ProcessedImage) => {
    const link = document.createElement("a");
    link.href = image.processedUrl;
    link.download = `${image.originalFile.name.replace(/\.[^/.]+$/, "")}_plie.png`;
    link.click();
    toast.success("Image téléchargée");
  };

  const downloadAll = async () => {
    if (uploadedImages.length === 0) return;

    try {
      const zip = new JSZip();
      
      // Ajouter chaque image traitée dans le ZIP
      for (const image of uploadedImages) {
        const response = await fetch(image.processedUrl);
        const blob = await response.blob();
        const filename = `${image.originalFile.name.replace(/\.[^/.]+$/, "")}_${CLOTHING_TEMPLATES[image.type].name.toLowerCase()}_plie.png`;
        zip.file(filename, blob);
      }
      
      // Générer le fichier ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Télécharger l'archive ZIP
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = `vetements_plies_${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      
      toast.success(`${uploadedImages.length} images téléchargées dans un fichier ZIP`);
    } catch (error) {
      console.error("Erreur lors de la création du ZIP:", error);
      toast.error("Erreur lors de la création du fichier ZIP");
    }
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


  if (showTemplateEditor && templateImageFile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <TemplateEditor
          imageFile={templateImageFile}
          clothingType={CLOTHING_TEMPLATES[selectedType].name}
          onSaveTemplate={handleSaveTemplate}
          onCancel={() => {
            setShowTemplateEditor(false);
            setTemplateImageFile(null);
          }}
        />
      </div>
    );
  }

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type de vêtement</label>
                <Select value={selectedType} onValueChange={(value: ClothingType) => setSelectedType(value)}>
                  <SelectTrigger>
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
                <label className="block text-sm font-medium mb-2">Gabarit de découpe</label>
                <div className="flex gap-2">
                  <input
                    ref={templateFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTemplateImageUpload(e.target.files)}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => templateFileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Définir gabarit
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Uploadez une image pour définir la zone de découpe
                </p>
              </div>
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
                {isProcessing ? "Traitement en cours..." : "Choisir des images à traiter"}
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
                        onClick={() => setSelectedImageFor3D(image)}
                        className="flex-1"
                      >
                        <Box className="h-4 w-4 mr-1" />
                        Vue 3D
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
                <p className="text-sm">Définissez vos gabarits et uploadez vos images pour commencer</p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedImageFor3D && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Visualisation 3D - {CLOTHING_TEMPLATES[selectedImageFor3D.type].name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedImageFor3D(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <ClothingViewer3D
                imageUrl={selectedImageFor3D.processedUrl}
                clothingType={selectedImageFor3D.type}
                onDownload={() => downloadImage(selectedImageFor3D)}
              />
              
              <div className="mt-4 text-sm text-muted-foreground text-center">
                Utilisez la souris pour faire tourner, zoomer et déplacer le modèle 3D
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
