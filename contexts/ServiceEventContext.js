import React, { createContext, useContext, useState, useCallback } from 'react';
import * as serviceEventsService from '../services/serviceEventsService';
import { validateOdometer } from '../utils/validationUtils';

const ServiceEventContext = createContext(null);

export const ServiceEventProvider = ({ children, userId, toast, isDemo = false }) => {
  // Service events list state
  const [serviceEvents, setServiceEvents] = useState([]);
  const [loadingServiceEvents, setLoadingServiceEvents] = useState(false);
  const [savingServiceEvent, setSavingServiceEvent] = useState(false);

  // Modal state
  const [showAddServiceEventModal, setShowAddServiceEventModal] = useState(false);
  const [editingServiceEvent, setEditingServiceEvent] = useState(null);

  // Form state
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventOdometer, setNewEventOdometer] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  const [newEventLinkedParts, setNewEventLinkedParts] = useState([]);
  const [newEventCost, setNewEventCost] = useState('');

  // Load service events for a vehicle
  const loadServiceEvents = useCallback(async (vehicleId) => {
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
  }, []);

  // Add a new service event
  const addServiceEvent = useCallback(async (vehicleId, eventDate, description, odometer, notes, linkedPartIds = [], cost = null) => {
    if (!vehicleId || !eventDate || !description || !userId) return null;

    // Validate odometer if provided
    if (odometer) {
      const odometerValidation = validateOdometer(odometer);
      if (!odometerValidation.isValid) {
        toast?.warning(odometerValidation.error);
        return null;
      }
    }

    try {
      setSavingServiceEvent(true);

      const eventData = {
        vehicle_id: vehicleId,
        event_date: eventDate,
        description: description.trim(),
        odometer: odometer ? parseInt(odometer, 10) : null,
        notes: notes?.trim() || null,
        linked_part_ids: linkedPartIds.length > 0 ? linkedPartIds : null,
        cost: cost ? parseFloat(cost) : null
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
  }, [userId, toast]);

  // Update a service event
  const updateServiceEvent = useCallback(async (eventId, updates) => {
    // Validate odometer if being updated
    if (updates.odometer !== undefined && updates.odometer !== null && updates.odometer !== '') {
      const odometerValidation = validateOdometer(updates.odometer);
      if (!odometerValidation.isValid) {
        toast?.warning(odometerValidation.error);
        return null;
      }
    }

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
  }, [toast]);

  // Delete a service event
  const deleteServiceEvent = useCallback(async (eventId) => {
    try {
      await serviceEventsService.deleteServiceEvent(eventId);
      setServiceEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      toast?.error('Error deleting service event');
    }
  }, [toast]);

  // Reset form fields
  const resetForm = useCallback(() => {
    setNewEventDate('');
    setNewEventDescription('');
    setNewEventOdometer('');
    setNewEventNotes('');
    setNewEventLinkedParts([]);
    setNewEventCost('');
    setEditingServiceEvent(null);
  }, []);

  // Initialize form with today's date
  const initializeForm = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setNewEventDate(today);
    setNewEventDescription('');
    setNewEventOdometer('');
    setNewEventNotes('');
    setNewEventLinkedParts([]);
    setNewEventCost('');
    setEditingServiceEvent(null);
  }, []);

  // Initialize form for editing
  const initializeEditForm = useCallback((event) => {
    setNewEventDate(event.event_date);
    setNewEventDescription(event.description);
    setNewEventOdometer(event.odometer ? String(event.odometer) : '');
    setNewEventNotes(event.notes || '');
    setNewEventLinkedParts(event.linked_part_ids || []);
    setNewEventCost(event.cost ? String(event.cost) : '');
    setEditingServiceEvent(event);
  }, []);

  // Handle closing the modal
  const handleCloseServiceEventModal = useCallback(() => {
    setShowAddServiceEventModal(false);
    resetForm();
  }, [resetForm]);

  // Open modal for adding new event
  const openAddServiceEventModal = useCallback(() => {
    initializeForm();
    setShowAddServiceEventModal(true);
  }, [initializeForm]);

  // Open modal for editing existing event
  const openEditServiceEventModal = useCallback((event) => {
    initializeEditForm(event);
    setShowAddServiceEventModal(true);
  }, [initializeEditForm]);

  const value = {
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
    newEventNotes,
    setNewEventNotes,
    newEventLinkedParts,
    setNewEventLinkedParts,
    newEventCost,
    setNewEventCost,
    // Actions
    loadServiceEvents,
    addServiceEvent,
    updateServiceEvent,
    deleteServiceEvent,
    resetForm,
    initializeForm,
    initializeEditForm,
    handleCloseServiceEventModal,
    openAddServiceEventModal,
    openEditServiceEventModal
  };

  return <ServiceEventContext.Provider value={value}>{children}</ServiceEventContext.Provider>;
};

export const useServiceEvents = () => {
  const context = useContext(ServiceEventContext);
  if (!context) {
    throw new Error('useServiceEvents must be used within a ServiceEventProvider');
  }
  return context;
};

export default ServiceEventContext;
