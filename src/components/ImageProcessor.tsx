
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

      // Définir les dimensions du canvas final
      canvas.width = finalWidth;
      canvas.height = finalHeight;

      if (ctx) {
        // Fond blanc
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Marges pour le rendu final
        const margin = 10;
        const drawWidth = canvas.width - (margin * 2);
        const drawHeight = canvas.height - (margin * 2);

        // Recadrage avec les coordonnées exactes du gabarit
        ctx.drawImage(
          img,
          x, y, width, height,
          margin, margin, drawWidth, drawHeight
        );

        // Ajouter une légère ombre pour l'effet "plié"
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(margin + 3, margin + drawHeight + 1, drawWidth - 6, 4);

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
      }
    };

    img.src = URL.createObjectURL(file);
  });
};
