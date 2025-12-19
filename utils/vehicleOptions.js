// Vehicle dropdown options for forms

// Common vehicle makes
export const VEHICLE_MAKES = [
  'Acura',
  'Alfa Romeo',
  'Aston Martin',
  'Audi',
  'Bentley',
  'BMW',
  'Buick',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Dodge',
  'Ferrari',
  'Fiat',
  'Ford',
  'Genesis',
  'GMC',
  'Honda',
  'Hyundai',
  'Infiniti',
  'Jaguar',
  'Jeep',
  'Kia',
  'Lamborghini',
  'Land Rover',
  'Lexus',
  'Lincoln',
  'Lotus',
  'Maserati',
  'Mazda',
  'McLaren',
  'Mercedes-Benz',
  'Mini',
  'Mitsubishi',
  'Nissan',
  'Porsche',
  'Ram',
  'Rolls-Royce',
  'Subaru',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo'
];

// Generate years from 1970 to current year + 1 (for upcoming models)
export const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear + 1; year >= 1970; year--) {
    years.push(year.toString());
  }
  return years;
};

export const VEHICLE_YEARS = generateYearOptions();

// Common oil brands
export const OIL_BRANDS = [
  'Amsoil',
  'Castrol',
  'Liqui Moly',
  'Mobil 1',
  'Motul',
  'Pennzoil',
  'Quaker State',
  'Red Line',
  'Royal Purple',
  'Shell Rotella',
  'Total',
  'Valvoline'
];

// Common oil types/viscosities
export const OIL_TYPES = [
  '0W-16',
  '0W-20',
  '0W-30',
  '0W-40',
  '5W-20',
  '5W-30',
  '5W-40',
  '10W-30',
  '10W-40',
  '15W-40',
  '20W-50'
];

// Odometer range options (in increments of 10,000)
export const ODOMETER_RANGES = [
  '10000',
  '20000',
  '30000',
  '40000',
  '50000',
  '60000',
  '70000',
  '80000',
  '90000',
  '100000',
  '110000',
  '120000',
  '130000',
  '140000',
  '150000',
  '160000',
  '170000',
  '180000',
  '190000',
  '200000',
  '210000',
  '220000',
  '230000',
  '240000',
  '250000',
  '260000',
  '270000',
  '280000',
  '290000',
  '300000'
];

// Format odometer for display (e.g., "150,000")
export const formatOdometer = (value) => {
  if (!value) return '';
  return parseInt(value).toLocaleString();
};

// Oil capacity options (1L to 10L in 0.5L increments)
export const OIL_CAPACITIES = [
  '1.0 liters',
  '1.5 liters',
  '2.0 liters',
  '2.5 liters',
  '3.0 liters',
  '3.5 liters',
  '4.0 liters',
  '4.5 liters',
  '5.0 liters',
  '5.5 liters',
  '6.0 liters',
  '6.5 liters',
  '7.0 liters',
  '7.5 liters',
  '8.0 liters',
  '8.5 liters',
  '9.0 liters',
  '9.5 liters',
  '10.0 liters'
];

// Format oil capacity - ensures "liters" is appended to custom entries
export const formatOilCapacity = (value) => {
  if (!value) return '';
  const trimmed = value.toString().trim();
  if (trimmed.toLowerCase().includes('liter')) return trimmed;
  return `${trimmed} liters`;
};

// Fuel types
export const FUEL_TYPES = [
  'Gasoline',
  'Diesel'
];
