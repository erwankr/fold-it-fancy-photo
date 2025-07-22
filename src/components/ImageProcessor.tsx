
interface CropSettings {
  xPercent: number;  // Position X en pourcentage (0-1)
  yPercent: number;  // Position Y en pourcentage (0-1)
  widthPercent: number;  // Largeur en pourcentage (0-1)
  heightPercent: number; // Hauteur en pourcentage (0-1)
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
      const { xPercent, yPercent, widthPercent, heightPercent, finalWidth, finalHeight } = cropSettings;
      
      // Convertir les pourcentages en coordonnées pixel pour cette image
      const x = Math.round(xPercent * img.naturalWidth);
      const y = Math.round(yPercent * img.naturalHeight);  
      const width = Math.round(widthPercent * img.naturalWidth);
      const height = Math.round(heightPercent * img.naturalHeight);
      
      console.log("Processing image with template:", {
        originalPercents: { xPercent, yPercent, widthPercent, heightPercent },
        convertedPixels: { x, y, width, height },
        imageDimensions: [img.naturalWidth, img.naturalHeight]
      });

      // Vérifier que les coordonnées sont valides
      if (x < 0 || y < 0 || x + width > img.naturalWidth || y + height > img.naturalHeight) {
        console.warn("Coordonnées de crop invalides, utilisation de l'image complète");
        // Utiliser l'image complète avec aspect ratio
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const targetAspectRatio = finalWidth / finalHeight;
        
        let sourceX = 0, sourceY = 0, sourceWidth = img.naturalWidth, sourceHeight = img.naturalHeight;
        
        if (aspectRatio > targetAspectRatio) {
          sourceWidth = img.naturalHeight * targetAspectRatio;
          sourceX = (img.naturalWidth - sourceWidth) / 2;
        } else {
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
          
          console.log("Image processed successfully with crop:", { x, y, width, height });
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
