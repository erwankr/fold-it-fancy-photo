
interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  finalWidth: number;
  finalHeight: number;
}

export const processImageWithTemplate = (file: File, cropSettings: CropSettings): Promise<{
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string;
}> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const { x, y, width, height, finalWidth, finalHeight } = cropSettings;
      
      console.log("Processing image with template:", cropSettings);
      console.log("Image dimensions:", img.naturalWidth, "x", img.naturalHeight);

      // Vérifier que les coordonnées sont valides
      if (x < 0 || y < 0 || x + width > img.naturalWidth || y + height > img.naturalHeight) {
        console.warn("Coordonnées de crop invalides, utilisation de l'image complète");
        // Utiliser l'image complète si les coordonnées sont invalides
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const targetAspectRatio = finalWidth / finalHeight;
        
        let sourceX = 0, sourceY = 0, sourceWidth = img.naturalWidth, sourceHeight = img.naturalHeight;
        
        if (aspectRatio > targetAspectRatio) {
          // Image plus large, recadrer horizontalement
          sourceWidth = img.naturalHeight * targetAspectRatio;
          sourceX = (img.naturalWidth - sourceWidth) / 2;
        } else {
          // Image plus haute, recadrer verticalement  
          sourceHeight = img.naturalWidth / targetAspectRatio;
          sourceY = (img.naturalHeight - sourceHeight) / 2;
        }
        
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, finalWidth, finalHeight);
        }
      } else {
        // Utiliser le gabarit défini
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Recadrer selon le gabarit et redimensionner pour remplir le canvas final
          ctx.drawImage(
            img,
            x, y, width, height,
            0, 0, finalWidth, finalHeight
          );
        }
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const processedUrl = URL.createObjectURL(blob);
          const originalUrl = URL.createObjectURL(file);
          
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            originalFile: file,
            originalUrl,
            processedUrl
          });
        }
      }, "image/png");
    };

    img.src = URL.createObjectURL(file);
  });
};
