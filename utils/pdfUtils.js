import { jsPDF } from 'jspdf';

/**
 * Generate a vehicle report PDF with all relevant information
 * @param {Object} vehicle - The vehicle object
 * @param {Array} projects - All projects (will be filtered for this vehicle)
 * @param {Array} parts - All parts (will be filtered for linked projects)
 * @param {Array} serviceEvents - Service events for this vehicle
 * @param {Array} documents - Documents for this vehicle
 * @returns {Object} { blob: Blob, filename: string }
 */
export const generateVehicleReportPDF = (vehicle, projects, parts, serviceEvents, documents) => {
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
    doc.text(label + ':', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const labelWidth = doc.getTextWidth(label + ': ');
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
      doc.text(label1 + ':', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const labelWidth = doc.getTextWidth(label1 + ': ');
      doc.text(String(value1), margin + labelWidth, yPos);
    }

    if (value2) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(label2 + ':', margin + halfWidth, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const labelWidth = doc.getTextWidth(label2 + ': ');
      doc.text(String(value2), margin + halfWidth + labelWidth, yPos);
    }

    if (value1 || value2) {
      yPos += 6;
    }
  };

  // --- HEADER ---
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
  const today = new Date();
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

      if (project.budget) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Budget: $${project.budget.toLocaleString()}`, margin + doc.getTextWidth(project.name + '  '), yPos);
      }
      yPos += 6;

      // Project parts
      const projectParts = parts.filter(p => p.projectId === project.id);

      if (projectParts.length > 0) {
        // Parts table header
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('Part', margin + 5, yPos);
        doc.text('Vendor', margin + 75, yPos);
        doc.text('Status', margin + 110, yPos);
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
          const maxPartWidth = 65;
          while (doc.getTextWidth(partName) > maxPartWidth && partName.length > 0) {
            partName = partName.slice(0, -1);
          }
          if (partName !== part.part) {
            partName += '...';
          }
          doc.text(partName, margin + 5, yPos);

          // Vendor (truncate if needed)
          let vendor = part.vendor || '-';
          const maxVendorWidth = 30;
          while (doc.getTextWidth(vendor) > maxVendorWidth && vendor.length > 0) {
            vendor = vendor.slice(0, -1);
          }
          if (vendor !== (part.vendor || '-')) {
            vendor += '...';
          }
          doc.text(vendor, margin + 75, yPos);

          // Status
          const status = part.delivered ? 'Delivered' :
                        part.shipped ? 'Shipped' :
                        part.purchased ? 'Purchased' : 'Pending';
          doc.text(status, margin + 110, yPos);

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

  // --- DOCUMENTS ---
  if (documents && documents.length > 0) {
    addSectionHeader('Attached Documents');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    documents.forEach((doc_item, index) => {
      checkPageBreak(6);
      doc.text(`${index + 1}. ${doc_item.title} (${doc_item.file_name})`, margin, yPos);
      yPos += 5;
    });

    yPos += 5;
  }

  // --- FOOTER ---
  const addFooter = (pageNum, totalPages) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated by Shako - Page ${pageNum} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
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
