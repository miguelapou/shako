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

// Oil capacity options (1L to 7L in 0.5L increments)
export const OIL_CAPACITIES = [
  '1.0L',
  '1.5L',
  '2.0L',
  '2.5L',
  '3.0L',
  '3.5L',
  '4.0L',
  '4.5L',
  '5.0L',
  '5.5L',
  '6.0L',
  '6.5L',
  '7.0L'
];

// Fuel types
export const FUEL_TYPES = [
  'Gasoline',
  'Diesel'
];
