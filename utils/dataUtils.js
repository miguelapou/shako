// ========================================
// DATA UTILITIES
// ========================================

// Get all part IDs that are linked to service events for a vehicle
const getServiceLinkedPartIds = (vehicleId, serviceEvents) => {
  if (!serviceEvents) return new Set();

  const linkedIds = new Set();
  serviceEvents
    .filter(event => event.vehicle_id === vehicleId)
    .forEach(event => {
      if (event.linked_part_ids && Array.isArray(event.linked_part_ids)) {
        event.linked_part_ids.forEach(id => linkedIds.add(id));
      }
    });
  return linkedIds;
};

// Calculate total spent for a vehicle (excluding parts linked to service events)
export const calculateVehicleTotalSpent = (vehicleId, projects, parts, serviceEvents = null) => {
  // Get part IDs that are linked to service events
  const serviceLinkedPartIds = getServiceLinkedPartIds(vehicleId, serviceEvents);

  // Parts linked through projects (excluding service-linked parts)
  const vehicleProjects = projects.filter(p => p.vehicle_id === vehicleId);
  const projectPartsTotal = vehicleProjects.reduce((sum, project) => {
    const projectParts = parts.filter(part =>
      part.projectId === project.id && !serviceLinkedPartIds.has(part.id)
    );
    return sum + projectParts.reduce((partSum, part) => partSum + (part.total || 0), 0);
  }, 0);

  // Parts directly linked to vehicle (not through projects, excluding service-linked parts)
  const directPartsTotal = parts
    .filter(part => part.vehicleId === vehicleId && !part.projectId && !serviceLinkedPartIds.has(part.id))
    .reduce((sum, part) => sum + (part.total || 0), 0);

  return projectPartsTotal + directPartsTotal;
};

// Calculate total of parts linked to service events for a vehicle
export const calculateServicePartsTotal = (vehicleId, parts, serviceEvents) => {
  if (!serviceEvents) return 0;

  const serviceLinkedPartIds = getServiceLinkedPartIds(vehicleId, serviceEvents);

  return parts
    .filter(part => serviceLinkedPartIds.has(part.id))
    .reduce((sum, part) => sum + (part.total || 0), 0);
};

// Calculate project totals
export const calculateProjectTotal = (projectId, parts) => {
  return parts
    .filter(part => part.projectId === projectId)
    .reduce((sum, part) => sum + (part.total || 0), 0);
};
