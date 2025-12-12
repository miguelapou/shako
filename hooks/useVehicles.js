import { useState, useCallback } from 'react';
import * as vehiclesService from '../services/vehiclesService';

/**
 * Custom hook for managing vehicles data and CRUD operations
 *
 * Features:
 * - Load vehicles from Supabase
 * - Add, update, and delete vehicles
 * - Image upload to Supabase storage
 * - Image drag and drop handling
 * - Update vehicle display order (for drag and drop)
 *
 * @param {string} userId - Current user's ID for data isolation
 * @param {Object} toast - Toast notification functions { error, success, warning, info }
 * @returns {Object} Vehicles state and operations
 */
const useVehicles = (userId, toast) => {
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
    fuel_filter: '',
    air_filter: '',
    oil_filter: '',
    oil_type: '',
    oil_capacity: '',
    oil_brand: '',
    drain_plug: '',
    battery: '',
    image_url: '',
    color: '#3B82F6' // Default blue color
  });
  const [vehicleImageFile, setVehicleImageFile] = useState(null);
  const [vehicleImagePreview, setVehicleImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  /**
   * Preload images by creating Image objects and waiting for them to load
   * @param {Array} vehicleList - List of vehicles with image URLs
   * @returns {Promise} Resolves when all images are loaded (or failed)
   */
  const preloadImages = (vehicleList) => {
    const imageUrls = vehicleList
      .filter(v => !v.archived) // Only preload non-archived vehicle images
      .map(v => v.image_url_resolved || v.image_url)
      .filter(url => url); // Filter out null/undefined

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
   * Load vehicles from Supabase and resolve image URLs
   */
  const loadVehicles = async () => {
    if (!userId) return;
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

        // Resolve signed URLs for vehicle images
        const imagePaths = sorted
          .map(v => v.image_url)
          .filter(url => url && !url.startsWith('http'));

        let finalVehicles;
        if (imagePaths.length > 0) {
          try {
            const urlMap = await vehiclesService.getVehicleImageUrls(imagePaths);
            // Update vehicles with resolved URLs
            finalVehicles = sorted.map(vehicle => {
              if (vehicle.image_url && !vehicle.image_url.startsWith('http')) {
                return {
                  ...vehicle,
                  image_url_resolved: urlMap[vehicle.image_url] || vehicle.image_url
                };
              }
              return {
                ...vehicle,
                image_url_resolved: vehicle.image_url
              };
            });
          } catch (urlError) {
            // If URL resolution fails, use original data
            finalVehicles = sorted;
          }
        } else {
          // No storage paths to resolve, use URLs as-is
          finalVehicles = sorted.map(vehicle => ({
            ...vehicle,
            image_url_resolved: vehicle.image_url
          }));
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
   * Upload vehicle image to Supabase storage
   */
  const uploadVehicleImage = async (file) => {
    if (!userId) return null;
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
   * Handle image file selection
   */
  const handleImageFileChange = (e) => {
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

      setVehicleImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Clear image selection
   */
  const clearImageSelection = () => {
    setVehicleImageFile(null);
    setVehicleImagePreview(null);
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

  const handleImageDrop = (e) => {
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

      setVehicleImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
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

    // Operations
    loadVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehiclesOrder,
    uploadVehicleImage,
    getImageUrl,

    // Image handlers
    handleImageFileChange,
    clearImageSelection,
    handleImageDragEnter,
    handleImageDragLeave,
    handleImageDragOver,
    handleImageDrop
  };
};

export default useVehicles;
