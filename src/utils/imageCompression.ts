import imageCompression from 'browser-image-compression';

export async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set canvas size to the cropped area
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg');
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

export async function compressImage(file: File | Blob): Promise<File> {
  const options = {
    maxSizeMB: 0.8, // Reduced from 1MB for faster loading
    maxWidthOrHeight: 1200, // Increased for better quality on retina displays
    useWebWorker: true, // Use web worker for non-blocking compression
    maxIteration: 10, // More iterations for better compression
    initialQuality: 0.85, // Start with high quality
    alwaysKeepResolution: false, // Allow resolution reduction if needed
    fileType: 'image/webp' as any, // Use WebP for better compression
  };

  try {
    const compressedFile = await imageCompression(file as File, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Fallback to JPEG if WebP fails
    try {
      const fallbackOptions = {
        ...options,
        fileType: 'image/jpeg' as any,
      };
      return await imageCompression(file as File, fallbackOptions);
    } catch (fallbackError) {
      console.error('Fallback compression also failed:', fallbackError);
      throw fallbackError;
    }
  }
}
