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
 * @returns {Object} Vehicles state and operations
 */
const useVehicles = (userId) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
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
   * Load vehicles from Supabase and resolve image URLs
   */
  const loadVehicles = async () => {
    if (!userId) return;
    try {
      setLoading(true);
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

        if (imagePaths.length > 0) {
          try {
            const urlMap = await vehiclesService.getVehicleImageUrls(imagePaths);
            // Update vehicles with resolved URLs
            const withResolvedUrls = sorted.map(vehicle => {
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
            setVehicles(withResolvedUrls);
          } catch (urlError) {
            // If URL resolution fails, use original data
            setVehicles(sorted);
          }
        } else {
          // No storage paths to resolve, use URLs as-is
          const withResolvedUrls = sorted.map(vehicle => ({
            ...vehicle,
            image_url_resolved: vehicle.image_url
          }));
          setVehicles(withResolvedUrls);
        }
      } else {
        setVehicles([]);
      }
    } catch (error) {
      // Error loading vehicles
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
      alert('Error adding vehicle');
    }
  };

  /**
   * Update a vehicle
   */
  const updateVehicle = async (vehicleId, updates) => {
    try {
      await vehiclesService.updateVehicle(vehicleId, updates);
      await loadVehicles();
    } catch (error) {
      alert('Error updating vehicle');
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
      alert('Error deleting vehicle');
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
      // Error updating vehicle order
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
      alert('Error uploading image. Please try again.');
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
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
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
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
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
