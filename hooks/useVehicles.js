import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
 * @returns {Object} Vehicles state and operations
 */
const useVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({
    nickname: '',
    name: '',
    make: '',
    year: '',
    license_plate: '',
    vin: '',
    insurance_policy: '',
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
   * Load vehicles from Supabase
   */
  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('display_order', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
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
        setVehicles(sorted);
      }
    } catch (error) {
      // Error loading vehicles
    }
  };

  /**
   * Add a new vehicle
   */
  const addVehicle = async (vehicleData) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select();

      if (error) throw error;
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
      const { error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', vehicleId);

      if (error) throw error;
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
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
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
      const updates = orderedVehicles.map((vehicle, index) => ({
        id: vehicle.id,
        display_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('vehicles')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (error) {
      // Error updating vehicle order
    }
  };

  /**
   * Upload vehicle image to Supabase storage
   */
  const uploadVehicleImage = async (file) => {
    try {
      setUploadingImage(true);
      // Create a unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `vehicle-images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('vehicles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vehicles')
        .getPublicUrl(filePath);

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

  return {
    // State
    vehicles,
    setVehicles,
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
