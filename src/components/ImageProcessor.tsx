
interface CropSettings {
  xPercent: number;  // Position X en pourcentage (0-1)
  yPercent: number;  // Position Y en pourcentage (0-1)
  widthPercent: number;  // Largeur en pourcentage (0-1)
  heightPercent: number; // Hauteur en pourcentage (0-1)
  targetAspectRatio: number;  // Ratio cible (largeur/hauteur)
  maxFinalWidth: number;   // Largeur maximale souhaitée
  maxFinalHeight: number;  // Hauteur maximale souhaitée
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
      const { xPercent, yPercent, widthPercent, heightPercent, targetAspectRatio, maxFinalWidth, maxFinalHeight } = cropSettings;
      
      // Convertir les pourcentages en coordonnées pixel pour cette image
      // S'assurer que les valeurs sont valides
      const safeXPercent = Math.max(0, Math.min(1, xPercent));
      const safeYPercent = Math.max(0, Math.min(1, yPercent));
      const safeWidthPercent = Math.max(0.01, Math.min(1, widthPercent));
      const safeHeightPercent = Math.max(0.01, Math.min(1, heightPercent));
      
      const x = Math.floor(safeXPercent * img.naturalWidth);
      const y = Math.floor(safeYPercent * img.naturalHeight);
      let width = Math.floor(safeWidthPercent * img.naturalWidth);
      let height = Math.floor(safeHeightPercent * img.naturalHeight);
      
      // S'assurer que le crop reste dans les limites de l'image
      width = Math.min(width, img.naturalWidth - x);
      height = Math.min(height, img.naturalHeight - y);
      
      // Utiliser l'aspect ratio cible défini pour ce type de vêtement
      let finalWidth, finalHeight;
      
      if (targetAspectRatio > maxFinalWidth / maxFinalHeight) {
        finalWidth = maxFinalWidth;
        finalHeight = Math.round(maxFinalWidth / targetAspectRatio);
      } else {
        finalHeight = maxFinalHeight;
        finalWidth = Math.round(maxFinalHeight * targetAspectRatio);
      }
      
      console.log("Processing image with proportional template:", {
        originalPercents: { xPercent: safeXPercent, yPercent: safeYPercent, widthPercent: safeWidthPercent, heightPercent: safeHeightPercent },
        pixelCoordinates: { x, y, width, height },
        imageDimensions: [img.naturalWidth, img.naturalHeight],
        targetAspectRatio,
        finalDimensions: [finalWidth, finalHeight]
      });

      // Vérifier que les coordonnées sont valides (avec une tolérance)
      if (width <= 0 || height <= 0 || x >= img.naturalWidth || y >= img.naturalHeight) {
        console.warn("Coordonnées de crop invalides, utilisation de l'image complète");
        
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Redimensionner l'image complète pour remplir le canvas avec l'aspect ratio cible
          const imgAspectRatio = img.naturalWidth / img.naturalHeight;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (imgAspectRatio > targetAspectRatio) {
            // Image plus large que l'aspect ratio cible, on recadre horizontalement
            drawHeight = finalHeight;
            drawWidth = finalHeight * imgAspectRatio;
            drawX = (finalWidth - drawWidth) / 2;
            drawY = 0;
          } else {
            // Image plus haute que l'aspect ratio cible, on recadre verticalement  
            drawWidth = finalWidth;
            drawHeight = finalWidth / imgAspectRatio;
            drawX = 0;
            drawY = (finalHeight - drawHeight) / 2;
          }
          
          ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, drawX, drawY, drawWidth, drawHeight);
        }
      } else {
        // Utiliser le gabarit défini avec aspect ratio fixe
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Recadrer selon le gabarit et redimensionner pour respecter l'aspect ratio cible
          ctx.drawImage(
            img,
            x, y, width, height,
            0, 0, finalWidth, finalHeight
          );
          
          console.log("Image processed successfully with fixed aspect ratio:", { 
            source: { x, y, width, height },
            destination: { width: finalWidth, height: finalHeight },
            aspectRatio: finalWidth / finalHeight
          });
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
