
interface CropSettings {
  xPercent: number;  // Position X en pourcentage (0-1)
  yPercent: number;  // Position Y en pourcentage (0-1)
  widthPercent: number;  // Largeur en pourcentage (0-1)
  heightPercent: number; // Hauteur en pourcentage (0-1)
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
      const { xPercent, yPercent, widthPercent, heightPercent, maxFinalWidth, maxFinalHeight } = cropSettings;
      
      // Convertir les pourcentages en coordonnées pixel pour cette image
      const x = Math.round(xPercent * img.naturalWidth);
      const y = Math.round(yPercent * img.naturalHeight);  
      const width = Math.round(widthPercent * img.naturalWidth);
      const height = Math.round(heightPercent * img.naturalHeight);
      
      // Calculer les dimensions finales en maintenant les proportions
      const cropAspectRatio = width / height;
      const maxAspectRatio = maxFinalWidth / maxFinalHeight;
      
      let finalWidth, finalHeight;
      
      if (cropAspectRatio > maxAspectRatio) {
        // La zone croppée est plus large, on limite par la largeur
        finalWidth = maxFinalWidth;
        finalHeight = Math.round(maxFinalWidth / cropAspectRatio);
      } else {
        // La zone croppée est plus haute, on limite par la hauteur
        finalHeight = maxFinalHeight;
        finalWidth = Math.round(maxFinalHeight * cropAspectRatio);
      }
      
      console.log("Processing image with adaptive sizing:", {
        originalPercents: { xPercent, yPercent, widthPercent, heightPercent },
        convertedPixels: { x, y, width, height },
        imageDimensions: [img.naturalWidth, img.naturalHeight],
        cropAspectRatio,
        finalDimensions: [finalWidth, finalHeight]
      });

      // Vérifier que les coordonnées sont valides
      if (x < 0 || y < 0 || x + width > img.naturalWidth || y + height > img.naturalHeight) {
        console.warn("Coordonnées de crop invalides, utilisation de l'image complète");
        
        finalWidth = maxFinalWidth;
        finalHeight = maxFinalHeight;
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Redimensionner l'image complète en conservant les proportions
          const imgAspectRatio = img.naturalWidth / img.naturalHeight;
          const canvasAspectRatio = finalWidth / finalHeight;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (imgAspectRatio > canvasAspectRatio) {
            drawWidth = finalWidth;
            drawHeight = finalWidth / imgAspectRatio;
            drawX = 0;
            drawY = (finalHeight - drawHeight) / 2;
          } else {
            drawHeight = finalHeight;
            drawWidth = finalHeight * imgAspectRatio;
            drawX = (finalWidth - drawWidth) / 2;
            drawY = 0;
          }
          
          ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, drawX, drawY, drawWidth, drawHeight);
        }
      } else {
        // Utiliser le gabarit défini avec dimensions adaptatives
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
          
          console.log("Image processed successfully with adaptive crop:", { 
            source: { x, y, width, height },
            destination: { width: finalWidth, height: finalHeight }
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
