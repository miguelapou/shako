import { useState, useCallback } from 'react';
import * as vehiclesService from '../services/vehiclesService';
import { compressImage } from '../utils/imageUtils';
import { getDemoVehicles, saveDemoVehicles } from '../data/demoData';

// Maximum number of images per vehicle
const MAX_VEHICLE_IMAGES = 6;

/**
 * Custom hook for managing vehicles data and CRUD operations
 *
 * Features:
 * - Load vehicles from Supabase
 * - Add, update, and delete vehicles
 * - Multi-image upload to Supabase storage (max 6 images)
 * - Image drag and drop handling
 * - Primary image selection
 * - Update vehicle display order (for drag and drop)
 *
 * @param {string} userId - Current user's ID for data isolation
 * @param {Object} toast - Toast notification functions { error, success, warning, info }
 * @param {boolean} isDemo - Whether in demo mode (uses localStorage instead of Supabase)
 * @returns {Object} Vehicles state and operations
 */
const useVehicles = (userId, toast, isDemo = false) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    nickname: '',
    name: '',
    make: '',
    year: '',
    license_plate: '',
    vin: '',
    odometer_range: '',
    odometer_unit: 'km',
    purchase_price: '',
    purchase_date: '',
    fuel_filter: '',
    air_filter: '',
    oil_filter: '',
    oil_type: '',
    oil_capacity: '',
    oil_brand: '',
    drain_plug: '',
    battery: '',
    image_url: '',
    images: [], // Array of { url: string, isPrimary: boolean }
    color: '#3B82F6' // Default blue color
  });
  // Multi-image state: array of { file: File, preview: string, isPrimary: boolean }
  const [vehicleImageFiles, setVehicleImageFiles] = useState([]);
  // Legacy single image state (kept for backwards compatibility)
  const [vehicleImageFile, setVehicleImageFile] = useState(null);
  const [vehicleImagePreview, setVehicleImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  /**
   * Get the primary image URL from a vehicle's images array
   * Falls back to image_url for backwards compatibility
   * @param {Object} vehicle - Vehicle object
   * @returns {string|null} Primary image URL or null
   */
  const getPrimaryImageUrl = (vehicle) => {
    // Check images array first (new multi-image format)
    if (vehicle.images_resolved && vehicle.images_resolved.length > 0) {
      const primary = vehicle.images_resolved.find(img => img.isPrimary);
      return primary ? primary.url : vehicle.images_resolved[0].url;
    }
    if (vehicle.images && vehicle.images.length > 0) {
      const primary = vehicle.images.find(img => img.isPrimary);
      return primary ? primary.url : vehicle.images[0].url;
    }
    // Fallback to legacy single image
    return vehicle.image_url_resolved || vehicle.image_url || null;
  };

  /**
   * Preload images by creating Image objects and waiting for them to load
   * @param {Array} vehicleList - List of vehicles with image URLs
   * @returns {Promise} Resolves when all images are loaded (or failed)
   */
  const preloadImages = (vehicleList) => {
    const imageUrls = [];

    vehicleList
      .filter(v => !v.archived) // Only preload non-archived vehicle images
      .forEach(v => {
        // Get primary image for preloading
        const primaryUrl = getPrimaryImageUrl(v);
        if (primaryUrl) {
          imageUrls.push(primaryUrl);
        }
      });

    if (imageUrls.length === 0) {
      return Promise.resolve();
    }

    const imagePromises = imageUrls.map(url => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve even on error to not block loading
        img.src = url;
      });
    });

    return Promise.all(imagePromises);
  };

  /**
   * Load vehicles from Supabase (or localStorage in demo mode) and resolve image URLs
   */
  const loadVehicles = async () => {
    if (!userId) return;

    // Demo mode: load from localStorage
    if (isDemo) {
      setLoading(true);
      setImagesLoaded(false);
      const demoVehicles = getDemoVehicles();
      // Sort so archived vehicles are always at the end
      const sorted = demoVehicles.sort((a, b) => {
        if (a.archived === b.archived) {
          return (a.display_order || 0) - (b.display_order || 0);
        }
        return a.archived ? 1 : -1;
      });
      // Demo vehicles already have resolved URLs (data URLs or pre-signed)
      const finalVehicles = sorted.map(vehicle => ({
        ...vehicle,
        image_url_resolved: vehicle.image_url,
        images_resolved: vehicle.images || (vehicle.image_url ? [{ url: vehicle.image_url, isPrimary: true }] : [])
      }));
      setVehicles(finalVehicles);
      await preloadImages(finalVehicles);
      setImagesLoaded(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setImagesLoaded(false);
      const data = await vehiclesService.getAllVehicles(userId);
      if (data) {
        // Sort so archived vehicles are always at the end
        const sorted = data.sort((a, b) => {
          if (a.archived === b.archived) {
            // If both have same archived status, sort by display_order
            return (a.display_order || 0) - (b.display_order || 0);
          }
          // Put archived vehicles at the end
          return a.archived ? 1 : -1;
        });

        // Collect all image paths that need URL resolution
        // (both legacy image_url and new images array)
        const imagePaths = [];
        sorted.forEach(v => {
          // Legacy single image
          if (v.image_url && !v.image_url.startsWith('http')) {
            imagePaths.push(v.image_url);
          }
          // Multi-image array
          if (v.images && Array.isArray(v.images)) {
            v.images.forEach(img => {
              if (img.url && !img.url.startsWith('http')) {
                imagePaths.push(img.url);
              }
            });
          }
        });

        let finalVehicles;
        if (imagePaths.length > 0) {
          try {
            const urlMap = await vehiclesService.getVehicleImageUrls(imagePaths);
            // Update vehicles with resolved URLs
            finalVehicles = sorted.map(vehicle => {
              const result = { ...vehicle };

              // Resolve legacy image_url
              if (vehicle.image_url) {
                if (vehicle.image_url.startsWith('http')) {
                  result.image_url_resolved = vehicle.image_url;
                } else {
                  result.image_url_resolved = urlMap[vehicle.image_url] || vehicle.image_url;
                }
              }

              // Resolve multi-image array
              if (vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
                result.images_resolved = vehicle.images.map(img => ({
                  ...img,
                  url: img.url.startsWith('http') ? img.url : (urlMap[img.url] || img.url)
                }));
              } else if (vehicle.image_url) {
                // Migrate legacy single image to images_resolved for UI consistency
                result.images_resolved = [{
                  url: result.image_url_resolved || vehicle.image_url,
                  isPrimary: true
                }];
              }

              return result;
            });
          } catch (urlError) {
            // If URL resolution fails, use original data
            finalVehicles = sorted;
          }
        } else {
          // No storage paths to resolve, use URLs as-is
          finalVehicles = sorted.map(vehicle => {
            const result = {
              ...vehicle,
              image_url_resolved: vehicle.image_url
            };
            // Migrate legacy single image to images_resolved for UI consistency
            if (vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
              result.images_resolved = vehicle.images;
            } else if (vehicle.image_url) {
              result.images_resolved = [{
                url: vehicle.image_url,
                isPrimary: true
              }];
            }
            return result;
          });
        }

        setVehicles(finalVehicles);

        // Preload images before marking as loaded
        await preloadImages(finalVehicles);
        setImagesLoaded(true);
      } else {
        setVehicles([]);
        setImagesLoaded(true);
      }
    } catch (error) {
      // Error loading vehicles - silent fail
      setImagesLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new vehicle
   */
  const addVehicle = async (vehicleData) => {
    if (!userId) return;

    // Demo mode: save to localStorage
    if (isDemo) {
      const demoVehicles = getDemoVehicles();
      const newVehicle = {
        id: `demo-vehicle-${Date.now()}`,
        ...vehicleData,
        user_id: userId,
        created_at: new Date().toISOString(),
        display_order: demoVehicles.length,
        archived: false
      };
      saveDemoVehicles([...demoVehicles, newVehicle]);
      await loadVehicles();
      return;
    }

    try {
      await vehiclesService.createVehicle(vehicleData, userId);
      await loadVehicles();
    } catch (error) {
      toast?.error('Error adding vehicle');
    }
  };

  /**
   * Update a vehicle
   */
  const updateVehicle = async (vehicleId, updates) => {
    // Demo mode: save to localStorage
    if (isDemo) {
      const demoVehicles = getDemoVehicles();
      const updatedVehicles = demoVehicles.map(vehicle =>
        vehicle.id === vehicleId
          ? { ...vehicle, ...updates }
          : vehicle
      );
      saveDemoVehicles(updatedVehicles);

      // Update local state
      setVehicles(prevVehicles => prevVehicles.map(vehicle => {
        if (vehicle.id === vehicleId) {
          const updatedVehicle = { ...vehicle, ...updates };
          if (updates.image_url) {
            updatedVehicle.image_url_resolved = updates.image_url;
          }
          if (updates.images !== undefined) {
            updatedVehicle.images_resolved = updates.images || [];
          }
          return updatedVehicle;
        }
        return vehicle;
      }));
      return;
    }

    try {
      await vehiclesService.updateVehicle(vehicleId, updates);

      // Update local state directly instead of reloading everything
      // This avoids the flash of loading state when saving
      setVehicles(prevVehicles => prevVehicles.map(vehicle => {
        if (vehicle.id === vehicleId) {
          const updatedVehicle = { ...vehicle, ...updates };
          // If image_url was updated and it's a storage path, resolve it
          if (updates.image_url && !updates.image_url.startsWith('http')) {
            // Resolve the signed URL asynchronously
            vehiclesService.getVehicleImageUrl(updates.image_url).then(signedUrl => {
              setVehicles(prev => prev.map(v =>
                v.id === vehicleId
                  ? { ...v, image_url_resolved: signedUrl }
                  : v
              ));
            });
          } else if (updates.image_url) {
            updatedVehicle.image_url_resolved = updates.image_url;
          } else if (updates.image_url === '') {
            updatedVehicle.image_url_resolved = '';
          }

          // If images array was updated, resolve URLs for images_resolved
          if (updates.images !== undefined) {
            if (updates.images && updates.images.length > 0) {
              // Collect storage paths that need URL resolution
              const storagePaths = updates.images
                .filter(img => img.url && !img.url.startsWith('http'))
                .map(img => img.url);

              if (storagePaths.length > 0) {
                // Resolve URLs asynchronously
                vehiclesService.getVehicleImageUrls(storagePaths).then(urlMap => {
                  setVehicles(prev => prev.map(v => {
                    if (v.id === vehicleId) {
                      const resolvedImages = updates.images.map(img => ({
                        ...img,
                        url: img.url.startsWith('http') ? img.url : (urlMap[img.url] || img.url)
                      }));
                      return { ...v, images_resolved: resolvedImages };
                    }
                    return v;
                  }));
                });
              } else {
                // All URLs are already http, use as-is
                updatedVehicle.images_resolved = updates.images;
              }
            } else {
              // Images array is empty
              updatedVehicle.images_resolved = [];
            }
          }

          return updatedVehicle;
        }
        return vehicle;
      }));
    } catch (error) {
      toast?.error('Error updating vehicle');
    }
  };

  /**
   * Delete a vehicle
   */
  const deleteVehicle = async (vehicleId) => {
    // Demo mode: delete from localStorage
    if (isDemo) {
      const demoVehicles = getDemoVehicles();
      const updatedVehicles = demoVehicles.filter(v => v.id !== vehicleId);
      saveDemoVehicles(updatedVehicles);
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      return;
    }

    try {
      await vehiclesService.deleteVehicle(vehicleId);
      await loadVehicles();
    } catch (error) {
      toast?.error('Error deleting vehicle');
    }
  };

  /**
   * Update vehicles display order
   */
  const updateVehiclesOrder = async (orderedVehicles) => {
    // Demo mode: save to localStorage
    if (isDemo) {
      const updatedVehicles = orderedVehicles.map((vehicle, index) => ({
        ...vehicle,
        display_order: index
      }));
      saveDemoVehicles(updatedVehicles);
      setVehicles(updatedVehicles);
      return;
    }

    try {
      // Update each vehicle with its new display order
      for (let i = 0; i < orderedVehicles.length; i++) {
        await vehiclesService.updateVehicleDisplayOrder(orderedVehicles[i].id, i);
      }
    } catch (error) {
      // Error updating vehicle order - silent fail
    }
  };

  /**
   * Upload vehicle image to Supabase storage (or return data URL in demo mode)
   */
  const uploadVehicleImage = async (file) => {
    if (!userId) return null;

    // Demo mode: return a data URL instead of uploading
    if (isDemo) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    }

    try {
      setUploadingImage(true);
      const publicUrl = await vehiclesService.uploadVehicleImage(file, userId);
      setUploadingImage(false);
      return publicUrl;
    } catch (error) {
      setUploadingImage(false);
      toast?.error('Error uploading image. Please try again.');
      return null;
    }
  };

  /**
   * Handle image file selection (legacy single-image)
   * Automatically compresses images to reduce file size
   */
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast?.warning('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast?.warning('Image size must be less than 5MB');
        return;
      }

      // Compress image before storing
      const compressedFile = await compressImage(file);
      setVehicleImageFile(compressedFile);

      // Create preview from compressed file
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImagePreview(reader.result);
      };
      reader.readAsDataURL(compressedFile);
    }
  };

  /**
   * Clear image selection (both single and multi-image)
   */
  const clearImageSelection = () => {
    setVehicleImageFile(null);
    setVehicleImagePreview(null);
    setVehicleImageFiles([]);
  };

  // ========================================
  // MULTI-IMAGE HANDLERS
  // ========================================

  /**
   * Add an image file to the multi-image selection
   * Automatically compresses images to reduce file size
   * @param {File} file - Image file to add
   * @param {Array} existingImages - Currently existing images on the vehicle (for count check)
   */
  const addImageFile = async (file, existingImages = []) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast?.warning('Please select an image file');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast?.warning('Image size must be less than 5MB');
      return;
    }

    // Check max images limit
    const totalImages = existingImages.length + vehicleImageFiles.length;
    if (totalImages >= MAX_VEHICLE_IMAGES) {
      toast?.warning(`Maximum ${MAX_VEHICLE_IMAGES} images allowed per vehicle`);
      return;
    }

    // Compress image before adding (resizes to max 1200px, 85% quality)
    const compressedFile = await compressImage(file);

    // Create preview from compressed file
    const reader = new FileReader();
    reader.onloadend = () => {
      setVehicleImageFiles(prev => {
        // Check if any image is already primary (in state or existing)
        const hasPrimaryInState = prev.some(img => img.isPrimary);
        const hasPrimaryInExisting = existingImages.some(img => img.isPrimary);
        // Only set as primary if no other image is primary
        const isPrimary = !hasPrimaryInState && !hasPrimaryInExisting;
        return [...prev, { file: compressedFile, preview: reader.result, isPrimary }];
      });
    };
    reader.readAsDataURL(compressedFile);
  };

  /**
   * Remove an image file from the multi-image selection
   * @param {number} index - Index of the image to remove
   */
  const removeImageFile = (index) => {
    setVehicleImageFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the primary image, make the first remaining one primary
      if (prev[index]?.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  /**
   * Set an image file as primary in the multi-image selection
   * @param {number} index - Index of the image to set as primary
   */
  const setPrimaryImageFile = (index) => {
    setVehicleImageFiles(prev =>
      prev.map((img, i) => ({ ...img, isPrimary: i === index }))
    );
  };

  /**
   * Upload multiple vehicle images to Supabase storage (or return data URLs in demo mode)
   * @param {Array} files - Array of { file: File, isPrimary: boolean }
   * @returns {Promise<Array>} Array of { url: string, isPrimary: boolean }
   */
  const uploadMultipleVehicleImages = async (files) => {
    if (!userId || files.length === 0) return [];

    // Demo mode: return data URLs instead of uploading
    if (isDemo) {
      const uploadedImages = [];
      for (const { file, isPrimary } of files) {
        const url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        uploadedImages.push({ url, isPrimary });
      }
      return uploadedImages;
    }

    try {
      setUploadingImage(true);
      const uploadedImages = [];

      for (const { file, isPrimary } of files) {
        const url = await vehiclesService.uploadVehicleImage(file, userId);
        if (url) {
          uploadedImages.push({ url, isPrimary });
        }
      }

      setUploadingImage(false);
      return uploadedImages;
    } catch (error) {
      setUploadingImage(false);
      toast?.error('Error uploading images. Please try again.');
      return [];
    }
  };

  /**
   * Delete a vehicle image from storage
   * @param {string} imagePath - Storage path of the image
   */
  const deleteVehicleImageFromStorage = async (imagePath) => {
    // Demo mode: no-op (data URLs don't need cleanup)
    if (isDemo) return;

    try {
      await vehiclesService.deleteVehicleImage(imagePath);
    } catch (error) {
      // Silent fail - image may already be deleted or inaccessible
    }
  };

  // ========================================
  // IMAGE DRAG AND DROP HANDLERS
  // ========================================

  const handleImageDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast?.warning('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast?.warning('Image size must be less than 5MB');
        return;
      }

      // Compress image before storing
      const compressedFile = await compressImage(file);
      setVehicleImageFile(compressedFile);

      // Create preview from compressed file
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImagePreview(reader.result);
      };
      reader.readAsDataURL(compressedFile);
    }
  };

  /**
   * Get a signed URL for a vehicle image (on-demand)
   * @param {string} imagePath - Storage path or URL
   * @returns {Promise<string>} Signed URL
   */
  const getImageUrl = useCallback(async (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    try {
      return await vehiclesService.getVehicleImageUrl(imagePath);
    } catch (error) {
      return imagePath;
    }
  }, []);

  return {
    // State
    vehicles,
    setVehicles,
    loading,
    imagesLoaded,
    newVehicle,
    setNewVehicle,
    vehicleImageFile,
    setVehicleImageFile,
    vehicleImagePreview,
    setVehicleImagePreview,
    uploadingImage,
    setUploadingImage,
    isDraggingImage,
    setIsDraggingImage,
    // Multi-image state
    vehicleImageFiles,
    setVehicleImageFiles,
    MAX_VEHICLE_IMAGES,

    // Operations
    loadVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehiclesOrder,
    uploadVehicleImage,
    getImageUrl,
    getPrimaryImageUrl,

    // Image handlers
    handleImageFileChange,
    clearImageSelection,
    handleImageDragEnter,
    handleImageDragLeave,
    handleImageDragOver,
    handleImageDrop,

    // Multi-image handlers
    addImageFile,
    removeImageFile,
    setPrimaryImageFile,
    uploadMultipleVehicleImages,
    deleteVehicleImageFromStorage
  };
};

export default useVehicles;
