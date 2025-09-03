// Hyderabad Service Area Configuration
export interface ServiceAreaBoundary {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  }[];
}

// Hyderabad city boundaries (approximate)
export const HYDERABAD_SERVICE_AREA: ServiceAreaBoundary = {
  name: 'Hyderabad',
  coordinates: [
    // Outer boundary of Hyderabad metropolitan area
    { lat: 17.3850, lng: 78.4867 }, // Center
    { lat: 17.5000, lng: 78.3000 }, // North
    { lat: 17.5000, lng: 78.7000 }, // North East
    { lat: 17.3000, lng: 78.7000 }, // South East
    { lat: 17.3000, lng: 78.3000 }, // South West
    { lat: 17.5000, lng: 78.3000 }, // North West (closing the polygon)
  ]
};

// Popular areas within Hyderabad
export const HYDERABAD_POPULAR_AREAS = [
  { name: 'Banjara Hills', lat: 17.4065, lng: 78.4567 },
  { name: 'Jubilee Hills', lat: 17.4229, lng: 78.4078 },
  { name: 'Hitech City', lat: 17.4458, lng: 78.3789 },
  { name: 'Gachibowli', lat: 17.4401, lng: 78.3489 },
  { name: 'Madhapur', lat: 17.4489, lng: 78.3789 },
  { name: 'Kondapur', lat: 17.4701, lng: 78.3789 },
  { name: 'Kukatpally', lat: 17.4845, lng: 78.4139 },
  { name: 'Secunderabad', lat: 17.4399, lng: 78.4983 },
  { name: 'Begumpet', lat: 17.4432, lng: 78.4732 },
  { name: 'Ameerpet', lat: 17.4372, lng: 78.4489 },
  { name: 'Dilsukhnagar', lat: 17.3713, lng: 78.5264 },
  { name: 'LB Nagar', lat: 17.3676, lng: 78.5576 },
  { name: 'Uppal', lat: 17.4058, lng: 78.5591 },
  { name: 'Medchal', lat: 17.6296, lng: 78.4813 },
  { name: 'Shamshabad', lat: 17.2511, lng: 78.4396 },
  { name: 'Rajendranagar', lat: 17.3199, lng: 78.2673 },
];

// Service area radius in kilometers
export const SERVICE_AREA_RADIUS_KM = 50;

// Check if coordinates are within Hyderabad service area
export function isWithinHyderabadServiceArea(lat: number, lng: number): boolean {
  // Simple distance-based check from city center
  const cityCenter = { lat: 17.3850, lng: 78.4867 };
  const distance = calculateDistance(lat, lng, cityCenter.lat, cityCenter.lng);
  
  return distance <= SERVICE_AREA_RADIUS_KM;
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get nearest popular area
export function getNearestPopularArea(lat: number, lng: number): string {
  let nearestArea = '';
  let minDistance = Infinity;
  
  HYDERABAD_POPULAR_AREAS.forEach(area => {
    const distance = calculateDistance(lat, lng, area.lat, area.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestArea = area.name;
    }
  });
  
  return nearestArea;
}

// Service availability status
export interface ServiceAvailabilityStatus {
  isAvailable: boolean;
  message: string;
  nearestArea?: string;
  distanceFromCenter?: number;
}

// Check service availability with detailed status
export function checkServiceAvailability(
  lat: number, 
  lng: number
): ServiceAvailabilityStatus {
  const isAvailable = isWithinHyderabadServiceArea(lat, lng);
  const nearestArea = getNearestPopularArea(lat, lng);
  const cityCenter = { lat: 17.3850, lng: 78.4867 };
  const distanceFromCenter = calculateDistance(lat, lng, cityCenter.lat, cityCenter.lng);
  
  if (isAvailable) {
    return {
      isAvailable: true,
      message: `Service available in ${nearestArea}, Hyderabad`,
      nearestArea,
      distanceFromCenter
    };
  } else {
    return {
      isAvailable: false,
      message: `Service not available. You are ${distanceFromCenter.toFixed(1)}km outside Hyderabad service area.`,
      nearestArea,
      distanceFromCenter
    };
  }
}
