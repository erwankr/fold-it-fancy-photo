import { pipeline, env } from '@huggingface/transformers';
import * as THREE from 'three';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 512; // Smaller for better performance

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal process...');
    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'webgpu',
    });
    
    // Convert HTMLImageElement to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image if needed and draw it to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Image converted to base64');
    
    // Process the image with the segmentation model
    console.log('Processing with segmentation model...');
    const result = await segmenter(imageData);
    
    console.log('Segmentation result:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }
    
    // Create a new canvas for the masked image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Apply the mask
    const outputImageData = outputCtx.getImageData(
      0, 0,
      outputCanvas.width,
      outputCanvas.height
    );
    const data = outputImageData.data;
    
    // Apply inverted mask to alpha channel
    for (let i = 0; i < result[0].mask.data.length; i++) {
      // Invert the mask value (1 - value) to keep the subject instead of the background
      const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Mask applied successfully');
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully created final blob');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Extract shape contours from a segmented image
export const extractShapeContours = async (
  imageUrl: string, 
  dimensions?: { width: number; height: number; depth: number }
): Promise<THREE.Vector2[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Find contour points by detecting alpha transitions
        const contourPoints: THREE.Vector2[] = [];
        const step = 4; // Sampling step for performance
        
        for (let y = 0; y < canvas.height; y += step) {
          for (let x = 0; x < canvas.width; x += step) {
            const index = (y * canvas.width + x) * 4;
            const alpha = data[index + 3];
            
            // Check if this is an edge pixel (has transparent neighbor)
            if (alpha > 128) { // If pixel is mostly opaque
              let isEdge = false;
              
              // Check neighbors
              for (let dy = -step; dy <= step; dy += step) {
                for (let dx = -step; dx <= step; dx += step) {
                  const nx = x + dx;
                  const ny = y + dy;
                  
                  if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                    const neighborIndex = (ny * canvas.width + nx) * 4;
                    const neighborAlpha = data[neighborIndex + 3];
                    
                    if (neighborAlpha < 128) { // Neighbor is transparent
                      isEdge = true;
                      break;
                    }
                  }
                }
                if (isEdge) break;
              }
              
              if (isEdge) {
                // Convert to normalized coordinates, adaptées aux dimensions
                const scale = 0.05;
                const scaleWidth = dimensions ? (dimensions.width * scale) / 2 : 2;
                const scaleHeight = dimensions ? (dimensions.height * scale) / 2 : 3;
                const normalizedX = (x / canvas.width) * scaleWidth * 2 - scaleWidth;
                const normalizedY = ((canvas.height - y) / canvas.height) * scaleHeight * 2 - scaleHeight;
                contourPoints.push(new THREE.Vector2(normalizedX, normalizedY));
              }
            }
          }
        }
        
        console.log(`Extracted ${contourPoints.length} contour points`);
        resolve(contourPoints);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

// Create 3D geometry from contour points with smooth, rounded edges
export const createGeometryFromContours = (
  contourPoints: THREE.Vector2[], 
  dimensions?: { width: number; height: number; depth: number }
): THREE.ExtrudeGeometry => {
  // Convertir les dimensions en centimètres vers les unités Three.js (1 cm = 0.05 unités)
  const scale = 0.05;
  const depth = dimensions ? dimensions.depth * scale : 0.15;
  const width = dimensions ? dimensions.width * scale : 2;
  const height = dimensions ? dimensions.height * scale : 3;
  
  const extrudeSettings = {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.3,
    bevelSize: Math.min(width, height) * 0.05,
    bevelSegments: 12,
    curveSegments: 16
  };

  if (contourPoints.length < 3) {
    // Fallback to smooth rounded rectangle if no contours found, adaptée aux dimensions
    const shape = new THREE.Shape();
    const w = width / 2;
    const h = height / 2;
    shape.moveTo(-w * 0.6, h * 0.6);
    shape.bezierCurveTo(-w * 0.6, h * 0.75, -w * 0.5, h * 0.75, w * 0.5, h * 0.75);
    shape.bezierCurveTo(w * 0.6, h * 0.75, w * 0.6, h * 0.6, w * 0.6, -h * 0.6);
    shape.bezierCurveTo(w * 0.6, -h * 0.75, w * 0.5, -h * 0.75, -w * 0.5, -h * 0.75);
    shape.bezierCurveTo(-w * 0.6, -h * 0.75, -w * 0.6, -h * 0.6, -w * 0.6, h * 0.6);
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }
  
  // Create a smooth shape from contour points using curves
  const shape = new THREE.Shape();
  
  // Sort points to create a proper shape outline
  const sortedPoints = contourPoints.sort((a, b) => {
    const angleA = Math.atan2(a.y, a.x);
    const angleB = Math.atan2(b.y, b.x);
    return angleA - angleB;
  });
  
  // Start the shape
  if (sortedPoints.length > 0) {
    shape.moveTo(sortedPoints[0].x, sortedPoints[0].y);
    
    // Create smooth curves between points instead of straight lines
    for (let i = 1; i < sortedPoints.length; i++) {
      const current = sortedPoints[i];
      const next = sortedPoints[(i + 1) % sortedPoints.length];
      const prev = sortedPoints[i - 1];
      
      // Calculate control points for smooth curves
      const cp1x = prev.x + (current.x - prev.x) * 0.7;
      const cp1y = prev.y + (current.y - prev.y) * 0.7;
      const cp2x = current.x + (next.x - current.x) * 0.3;
      const cp2y = current.y + (next.y - current.y) * 0.3;
      
      // Use quadratic curve for smoother edges
      shape.quadraticCurveTo(cp1x, cp1y, current.x, current.y);
    }
    
    // Close the shape smoothly
    const first = sortedPoints[0];
    const last = sortedPoints[sortedPoints.length - 1];
    const cp1x = last.x + (first.x - last.x) * 0.7;
    const cp1y = last.y + (first.y - last.y) * 0.7;
    shape.quadraticCurveTo(cp1x, cp1y, first.x, first.y);
  }
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
};
