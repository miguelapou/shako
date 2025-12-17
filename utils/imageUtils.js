/**
 * Image utility functions for resizing and compressing images
 */

// Maximum dimension for resized images (2.4x of 500px display size for retina)
const MAX_IMAGE_DIMENSION = 1200;
// JPEG compression quality (0.85 is visually lossless)
const COMPRESSION_QUALITY = 0.85;

/**
 * Resize and compress an image file
 * @param {File} file - Original image file
 * @param {number} maxDimension - Maximum width or height (default: 1200)
 * @param {number} quality - JPEG compression quality 0-1 (default: 0.85)
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = async (file, maxDimension = MAX_IMAGE_DIMENSION, quality = COMPRESSION_QUALITY) => {
  return new Promise((resolve, reject) => {
    // Skip non-image files
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Only resize if image is larger than max dimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Use better image smoothing for downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // Fallback to original if conversion fails
            return;
          }

          // Create a new File from the blob
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          // Only use compressed version if it's actually smaller
          if (compressedFile.size < file.size) {
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      // If image loading fails, return original file
      resolve(file);
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get the dimensions of an image file
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
};
