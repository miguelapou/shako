import { useState } from 'react';
import * as serviceEventsService from '../services/serviceEventsService';

/**
 * Custom hook for managing vehicle service events
 *
 * Features:
 * - Load service events for a specific vehicle
 * - Add, update, and delete service events
 * - Timeline display support
 *
 * @param {string} userId - Current user's ID for data isolation
 * @param {Object} toast - Toast notification functions { error, success, warning, info }
 * @returns {Object} Service events state and operations
 */
const useServiceEvents = (userId, toast) => {
  const [serviceEvents, setServiceEvents] = useState([]);
  const [loadingServiceEvents, setLoadingServiceEvents] = useState(false);
  const [savingServiceEvent, setSavingServiceEvent] = useState(false);
  const [showAddServiceEventModal, setShowAddServiceEventModal] = useState(false);
  const [editingServiceEvent, setEditingServiceEvent] = useState(null);

  // Form state
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventOdometer, setNewEventOdometer] = useState('');

  /**
   * Load service events for a specific vehicle
   * @param {number} vehicleId - Vehicle ID
   */
  const loadServiceEvents = async (vehicleId) => {
    if (!vehicleId) {
      setServiceEvents([]);
      return;
    }
    try {
      setLoadingServiceEvents(true);
      const data = await serviceEventsService.getVehicleServiceEvents(vehicleId);
      setServiceEvents(data || []);
    } catch (error) {
      setServiceEvents([]);
    } finally {
      setLoadingServiceEvents(false);
    }
  };

  /**
   * Add a new service event
   * @param {number} vehicleId - Vehicle ID
   * @param {string} eventDate - Event date
   * @param {string} description - Event description
   * @param {number} odometer - Odometer reading
   */
  const addServiceEvent = async (vehicleId, eventDate, description, odometer) => {
    if (!vehicleId || !eventDate || !description || !userId) return null;

    try {
      setSavingServiceEvent(true);

      const eventData = {
        vehicle_id: vehicleId,
        event_date: eventDate,
        description: description.trim(),
        odometer: odometer ? parseInt(odometer, 10) : null
      };

      const newEvent = await serviceEventsService.createServiceEvent(eventData, userId);

      // Insert in sorted position (by date descending)
      setServiceEvents(prev => {
        const updated = [...prev, newEvent];
        return updated.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
      });

      return newEvent;
    } catch (error) {
      toast?.error('Error creating service event. Please try again.');
      return null;
    } finally {
      setSavingServiceEvent(false);
    }
  };

  /**
   * Update a service event
   * @param {number} eventId - Service event ID
   * @param {Object} updates - Fields to update
   */
  const updateServiceEvent = async (eventId, updates) => {
    try {
      setSavingServiceEvent(true);
      const updatedEvent = await serviceEventsService.updateServiceEvent(eventId, updates);

      setServiceEvents(prev => {
        const updated = prev.map(event =>
          event.id === eventId ? { ...event, ...updates } : event
        );
        return updated.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
      });

      return updatedEvent;
    } catch (error) {
      toast?.error('Error updating service event');
      return null;
    } finally {
      setSavingServiceEvent(false);
    }
  };

  /**
   * Delete a service event
   * @param {number} eventId - Service event ID
   */
  const deleteServiceEvent = async (eventId) => {
    try {
      await serviceEventsService.deleteServiceEvent(eventId);
      setServiceEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      toast?.error('Error deleting service event');
    }
  };

  /**
   * Reset form fields
   */
  const resetForm = () => {
    setNewEventDate('');
    setNewEventDescription('');
    setNewEventOdometer('');
    setEditingServiceEvent(null);
  };

  /**
   * Initialize form with today's date
   */
  const initializeForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setNewEventDate(today);
    setNewEventDescription('');
    setNewEventOdometer('');
    setEditingServiceEvent(null);
  };

  /**
   * Initialize form for editing
   * @param {Object} event - Service event to edit
   */
  const initializeEditForm = (event) => {
    setNewEventDate(event.event_date);
    setNewEventDescription(event.description);
    setNewEventOdometer(event.odometer ? String(event.odometer) : '');
    setEditingServiceEvent(event);
  };

  /**
   * Handle closing the modal - animation is handled by the modal itself
   */
  const handleCloseServiceEventModal = () => {
    setShowAddServiceEventModal(false);
    resetForm();
  };

  /**
   * Open modal for adding new event
   */
  const openAddModal = () => {
    initializeForm();
    setShowAddServiceEventModal(true);
  };

  /**
   * Open modal for editing existing event
   * @param {Object} event - Service event to edit
   */
  const openEditModal = (event) => {
    initializeEditForm(event);
    setShowAddServiceEventModal(true);
  };

  return {
    // State
    serviceEvents,
    setServiceEvents,
    loadingServiceEvents,
    savingServiceEvent,
    showAddServiceEventModal,
    setShowAddServiceEventModal,
    editingServiceEvent,

    // Form state
    newEventDate,
    setNewEventDate,
    newEventDescription,
    setNewEventDescription,
    newEventOdometer,
    setNewEventOdometer,

    // Operations
    loadServiceEvents,
    addServiceEvent,
    updateServiceEvent,
    deleteServiceEvent,
    resetForm,
    initializeForm,
    initializeEditForm,
    handleCloseServiceEventModal,
    openAddModal,
    openEditModal
  };
};

export default useServiceEvents;
