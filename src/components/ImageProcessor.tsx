
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
      const x = Math.round(xPercent * img.naturalWidth);
      const y = Math.round(yPercent * img.naturalHeight);  
      const width = Math.round(widthPercent * img.naturalWidth);
      const height = Math.round(heightPercent * img.naturalHeight);
      
      // Utiliser l'aspect ratio cible défini pour ce type de vêtement
      let finalWidth, finalHeight;
      
      if (targetAspectRatio > maxFinalWidth / maxFinalHeight) {
        // L'aspect ratio cible est plus large, on limite par la largeur
        finalWidth = maxFinalWidth;
        finalHeight = Math.round(maxFinalWidth / targetAspectRatio);
      } else {
        // L'aspect ratio cible est plus haut, on limite par la hauteur
        finalHeight = maxFinalHeight;
        finalWidth = Math.round(maxFinalHeight * targetAspectRatio);
      }
      
      console.log("Processing image with fixed aspect ratio:", {
        originalPercents: { xPercent, yPercent, widthPercent, heightPercent },
        convertedPixels: { x, y, width, height },
        imageDimensions: [img.naturalWidth, img.naturalHeight],
        targetAspectRatio,
        finalDimensions: [finalWidth, finalHeight]
      });

      // Vérifier que les coordonnées sont valides
      if (x < 0 || y < 0 || x + width > img.naturalWidth || y + height > img.naturalHeight) {
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
