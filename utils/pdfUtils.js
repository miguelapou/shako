import { jsPDF } from 'jspdf';

// Shako icon as base64 PNG
const SHAKO_ICON_BASE64 = 'data:image/png;base64,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';

/**
 * Load an image from URL and return as base64 data URL
 * @param {string} url - The image URL
 * @returns {Promise<string|null>} Base64 data URL or null if failed
 */
const loadImageAsBase64 = async (url) => {
  if (!url) return null;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load image:', error);
    return null;
  }
};

/**
 * Generate a vehicle report PDF with all relevant information
 * @param {Object} vehicle - The vehicle object
 * @param {Array} projects - All projects (will be filtered for this vehicle)
 * @param {Array} parts - All parts (will be filtered for linked projects)
 * @param {Array} serviceEvents - Service events for this vehicle
 * @returns {Promise<Object>} { blob: Blob, filename: string }
 */
export const generateVehicleReportPDF = async (vehicle, projects, parts, serviceEvents) => {
  // Load vehicle image if available
  const vehicleImageData = await loadImageAsBase64(vehicle.image_url);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to add section header
  const addSectionHeader = (text) => {
    checkPageBreak(25);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185); // Blue color
    doc.text(text, margin, yPos);
    yPos += 3;
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  };

  // Helper to add label-value pair
  const addField = (label, value, inline = false) => {
    if (!value) return false;
    checkPageBreak(10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    const labelText = label + ':';
    doc.text(labelText, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const labelWidth = doc.getTextWidth(labelText) + 3; // Add 3pt gap after colon
    doc.text(String(value), margin + labelWidth, yPos);
    yPos += 6;
    return true;
  };

  // Helper to add a two-column field row
  const addFieldRow = (label1, value1, label2, value2) => {
    checkPageBreak(10);
    const halfWidth = contentWidth / 2;
    doc.setFontSize(10);

    if (value1) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      const labelText1 = label1 + ':';
      doc.text(labelText1, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const labelWidth1 = doc.getTextWidth(labelText1) + 3; // Add 3pt gap after colon
      doc.text(String(value1), margin + labelWidth1, yPos);
    }

    if (value2) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      const labelText2 = label2 + ':';
      doc.text(labelText2, margin + halfWidth, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const labelWidth2 = doc.getTextWidth(labelText2) + 3; // Add 3pt gap after colon
      doc.text(String(value2), margin + halfWidth + labelWidth2, yPos);
    }

    if (value1 || value2) {
      yPos += 6;
    }
  };

  // --- HEADER ---
  const today = new Date();

  // Add vehicle image thumbnail on top right if available
  const thumbnailSize = 35;
  if (vehicleImageData) {
    try {
      doc.addImage(vehicleImageData, 'JPEG', pageWidth - margin - thumbnailSize, margin, thumbnailSize, thumbnailSize);
    } catch (e) {
      console.error('Failed to add vehicle image to PDF:', e);
    }
  }

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  const title = vehicle.nickname || `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.name || ''}`.trim();
  doc.text(title, margin, yPos);
  yPos += 10;

  // Subtitle with date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  const reportDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Vehicle Report - Generated ${reportDate}`, margin, yPos);
  yPos += 15;

  // --- BASIC INFORMATION ---
  addSectionHeader('Vehicle Information');

  addFieldRow('Year', vehicle.year, 'Make', vehicle.make);
  addFieldRow('Model', vehicle.name, 'Nickname', vehicle.nickname);
  addFieldRow('License Plate', vehicle.license_plate, 'VIN', vehicle.vin);

  if (vehicle.odometer_range) {
    const odometerText = `~${parseInt(vehicle.odometer_range).toLocaleString()} ${vehicle.odometer_unit === 'mi' ? 'miles' : 'km'}`;
    addField('Odometer', odometerText);
  }

  yPos += 5;

  // --- MAINTENANCE SPECIFICATIONS ---
  const hasMaintenance = vehicle.fuel_filter || vehicle.air_filter || vehicle.oil_filter ||
    vehicle.oil_type || vehicle.oil_capacity || vehicle.oil_brand ||
    vehicle.drain_plug || vehicle.battery;

  if (hasMaintenance) {
    addSectionHeader('Maintenance Specifications');

    // Filters
    if (vehicle.fuel_filter || vehicle.air_filter || vehicle.oil_filter) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Filters', margin, yPos);
      yPos += 6;

      addFieldRow('Fuel Filter', vehicle.fuel_filter, 'Air Filter', vehicle.air_filter);
      addField('Oil Filter', vehicle.oil_filter);
      yPos += 3;
    }

    // Oil specifications
    if (vehicle.oil_type || vehicle.oil_capacity || vehicle.oil_brand || vehicle.drain_plug) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Oil', margin, yPos);
      yPos += 6;

      addFieldRow('Type', vehicle.oil_type, 'Capacity', vehicle.oil_capacity);
      addFieldRow('Brand', vehicle.oil_brand, 'Drain Plug', vehicle.drain_plug);
      yPos += 3;
    }

    // Battery
    if (vehicle.battery) {
      addField('Battery', vehicle.battery);
    }

    yPos += 5;
  }

  // --- SERVICE HISTORY ---
  if (serviceEvents && serviceEvents.length > 0) {
    addSectionHeader('Service History');

    // Sort by date ascending
    const sortedEvents = [...serviceEvents].sort((a, b) =>
      new Date(a.event_date + 'T00:00:00') - new Date(b.event_date + 'T00:00:00')
    );

    // Table header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos - 3, contentWidth, 7, 'F');
    doc.text('Date', margin + 2, yPos);
    doc.text('Service', margin + 35, yPos);
    doc.text('Odometer', pageWidth - margin - 25, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    sortedEvents.forEach((event, index) => {
      checkPageBreak(8);

      // Alternate row background
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos - 4, contentWidth, 7, 'F');
      }

      const eventDate = new Date(event.event_date + 'T00:00:00');
      const dateStr = eventDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      doc.setFontSize(9);
      doc.text(dateStr, margin + 2, yPos);

      // Truncate description if too long
      let description = event.description || '';
      const maxDescWidth = contentWidth - 80;
      while (doc.getTextWidth(description) > maxDescWidth && description.length > 0) {
        description = description.slice(0, -1);
      }
      if (description !== event.description) {
        description += '...';
      }
      doc.text(description, margin + 35, yPos);

      if (event.odometer) {
        const odometerStr = event.odometer.toLocaleString() + (vehicle.odometer_unit ? ` ${vehicle.odometer_unit}` : '');
        doc.text(odometerStr, pageWidth - margin - 25, yPos);
      }

      yPos += 7;
    });

    yPos += 5;
  }

  // --- PROJECTS AND PARTS ---
  const vehicleProjects = projects.filter(p => p.vehicle_id === vehicle.id);

  if (vehicleProjects.length > 0) {
    addSectionHeader('Projects & Parts');

    let grandTotal = 0;

    vehicleProjects.forEach((project) => {
      checkPageBreak(20);

      // Project name
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text(project.name, margin, yPos);
      yPos += 6;

      // Project budget on new line
      if (project.budget) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Budget: $${project.budget.toLocaleString()}`, margin, yPos);
        yPos += 5;
      }

      // Project parts
      const projectParts = parts.filter(p => p.projectId === project.id);

      if (projectParts.length > 0) {
        // Parts table header
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('Part', margin + 5, yPos);
        doc.text('Vendor', margin + 95, yPos);
        doc.text('Total', pageWidth - margin - 15, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);

        let projectTotal = 0;

        projectParts.forEach((part) => {
          checkPageBreak(6);
          doc.setFontSize(8);

          // Part name (truncate if needed)
          let partName = part.part || '';
          const maxPartWidth = 85;
          while (doc.getTextWidth(partName) > maxPartWidth && partName.length > 0) {
            partName = partName.slice(0, -1);
          }
          if (partName !== part.part) {
            partName += '...';
          }
          doc.text(partName, margin + 5, yPos);

          // Vendor (truncate if needed)
          let vendor = part.vendor || '-';
          const maxVendorWidth = 45;
          while (doc.getTextWidth(vendor) > maxVendorWidth && vendor.length > 0) {
            vendor = vendor.slice(0, -1);
          }
          if (vendor !== (part.vendor || '-')) {
            vendor += '...';
          }
          doc.text(vendor, margin + 95, yPos);

          // Total
          const partTotal = (part.price || 0) + (part.shipping || 0) + (part.duties || 0);
          projectTotal += partTotal;
          doc.text(`$${partTotal.toFixed(2)}`, pageWidth - margin - 15, yPos);

          yPos += 5;
        });

        // Project subtotal
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(`Project Total: $${projectTotal.toFixed(2)}`, pageWidth - margin - 35, yPos);
        grandTotal += projectTotal;
        yPos += 8;
      } else {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('No parts linked to this project', margin + 5, yPos);
        yPos += 8;
      }
    });

    // Grand total
    if (grandTotal > 0) {
      checkPageBreak(15);
      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);
      yPos += 3;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text(`Total Investment: $${grandTotal.toFixed(2)}`, pageWidth - margin - 50, yPos);
      yPos += 10;
    }
  }

  // --- FOOTER ---
  const addFooter = (pageNum, totalPages) => {
    const footerY = pageHeight - 10;
    const footerText = `Generated by Shako - Page ${pageNum} of ${totalPages}`;
    const iconSize = 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);

    // Calculate text width to position icon before it
    const textWidth = doc.getTextWidth(footerText);
    const totalWidth = iconSize + 2 + textWidth; // icon + gap + text
    const startX = (pageWidth - totalWidth) / 2;

    // Add shako icon
    try {
      doc.addImage(SHAKO_ICON_BASE64, 'PNG', startX, footerY - iconSize + 1, iconSize, iconSize);
    } catch (e) {
      console.error('Failed to add shako icon to footer:', e);
    }

    // Add text after icon
    doc.text(footerText, startX + iconSize + 2, footerY);
  };

  // Add footer to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Generate filename
  const make = (vehicle.make || 'unknown').toLowerCase().replace(/\s+/g, '_');
  const model = (vehicle.name || 'unknown').toLowerCase().replace(/\s+/g, '_');
  const year = vehicle.year || 'unknown';
  const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}_${String(today.getFullYear()).slice(-2)}`;
  const filename = `shako_${year}_${make}_${model}_${dateStr}.pdf`;

  // Get blob
  const blob = doc.output('blob');

  return { blob, filename };
};

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
