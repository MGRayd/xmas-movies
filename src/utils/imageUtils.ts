/**
 * Utility functions for image processing
 */

/**
 * Converts an image file to WebP format
 * @param file - The original image file
 * @param quality - WebP quality (0-1), default 0.8
 * @returns Promise resolving to a new File object in WebP format
 */
export const convertToWebP = async (file: File, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Create a FileReader to read the image file
    const reader = new FileReader();
    
    reader.onload = (event) => {
      // Create an image element to load the file data
      const img = new Image();
      
      img.onload = () => {
        // Create a canvas to draw and convert the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image on the canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Convert to WebP
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not convert image to WebP'));
            return;
          }
          
          // Create a new file with the same name but .webp extension
          const fileName = file.name.split('.').slice(0, -1).join('.') + '.webp';
          const webpFile = new File([blob], fileName, { type: 'image/webp' });
          
          resolve(webpFile);
        }, 'image/webp', quality);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set the image source to the file data
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read the file as a data URL
    reader.readAsDataURL(file);
  });
};

/**
 * Checks if a file is an image
 * @param file - The file to check
 * @returns boolean indicating if the file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Processes an image file, converting it to WebP if it's not already
 * @param file - The original image file
 * @param quality - WebP quality (0-1), default 0.8
 * @returns Promise resolving to a processed File object
 */
export const processImageFile = async (file: File, quality = 0.8): Promise<File> => {
  // If not an image or already WebP, return the original file
  if (!isImageFile(file) || file.type === 'image/webp') {
    return file;
  }
  
  try {
    // Convert to WebP
    return await convertToWebP(file, quality);
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    // Fall back to the original file if conversion fails
    return file;
  }
};
