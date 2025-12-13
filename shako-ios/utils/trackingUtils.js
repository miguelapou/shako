/**
 * Tracking utilities - identical to web version
 */

export const getTrackingPurgeFields = () => ({
  ship24_id: null,
  tracking_status: null,
  tracking_substatus: null,
  tracking_location: null,
  tracking_eta: null,
  tracking_updated_at: null,
  tracking_checkpoints: null
});

export const shouldSkipShip24 = (tracking) => {
  if (!tracking) return true;
  if (tracking.startsWith('http')) return true;
  if (tracking.toUpperCase().startsWith('TBA')) return true;
  if (/^[a-zA-Z\s]+$/.test(tracking.trim())) return true;
  return false;
};

export const getTrackingUrl = (tracking) => {
  if (!tracking) return null;

  if (tracking.startsWith('http')) {
    return tracking;
  }

  if (tracking.toUpperCase().startsWith('TBA')) {
    return `https://www.amazon.com/progress-tracker/package/?itemId=&orderId=&trackingId=${tracking}`;
  }

  if (tracking.startsWith('EX')) {
    return `https://www.orangeconnex.com/tracking?language=en&trackingnumber=${tracking}`;
  }

  if (tracking.startsWith('ECSDT')) {
    return `https://www.ecmsglobal.com/en-us/tracking.html?orderNumber=${tracking}`;
  }

  if (tracking.startsWith('1Z')) {
    return `https://www.ups.com/track?tracknum=${tracking}&loc=en_US&requester=ST/trackdetails`;
  }

  if (/^\d{12,14}$/.test(tracking)) {
    return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
  }

  if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
  }

  if (/^\d{10,11}$/.test(tracking)) {
    return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${tracking}`;
  }

  return null;
};

export const getCarrierName = (tracking) => {
  if (!tracking) return null;

  if (tracking.toLowerCase().includes('amazon.com') || tracking.toLowerCase().includes('amzn') || tracking.toUpperCase().startsWith('TBA')) {
    return 'Amazon';
  }

  if (tracking.toLowerCase().includes('fedex.com')) {
    return 'FedEx';
  }

  if (tracking.startsWith('EX')) {
    return 'Orange Connex';
  }

  if (tracking.startsWith('ECSDT')) {
    return 'ECMS';
  }

  if (tracking.startsWith('1Z')) {
    return 'UPS';
  }

  if (/^\d{12,14}$/.test(tracking)) {
    return 'FedEx';
  }

  if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) {
    return 'USPS';
  }

  if (/^\d{10,11}$/.test(tracking)) {
    return 'DHL';
  }

  const upper = tracking.toUpperCase();
  if (upper.includes('UPS')) return 'UPS';
  if (upper.includes('FEDEX')) return 'FedEx';
  if (upper.includes('USPS')) return 'USPS';
  if (upper.includes('DHL')) return 'DHL';
  if (upper.includes('ECMS')) return 'ECMS';
  if (upper.includes('LOCAL')) return 'Local';

  return tracking;
};
