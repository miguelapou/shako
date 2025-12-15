// ========================================
// DATA UTILITIES
// ========================================

// Calculate total spent for a vehicle
export const calculateVehicleTotalSpent = (vehicleId, projects, parts) => {
  // Parts linked through projects
  const vehicleProjects = projects.filter(p => p.vehicle_id === vehicleId);
  const projectPartsTotal = vehicleProjects.reduce((sum, project) => {
    const projectParts = parts.filter(part => part.projectId === project.id);
    return sum + projectParts.reduce((partSum, part) => partSum + (part.total || 0), 0);
  }, 0);

  // Parts directly linked to vehicle (not through projects)
  const directPartsTotal = parts
    .filter(part => part.vehicleId === vehicleId && !part.projectId)
    .reduce((sum, part) => sum + (part.total || 0), 0);

  return projectPartsTotal + directPartsTotal;
};

// Calculate project totals
export const calculateProjectTotal = (projectId, parts) => {
  return parts
    .filter(part => part.projectId === projectId)
    .reduce((sum, part) => sum + (part.total || 0), 0);
};
