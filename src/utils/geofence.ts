// Calculate distance in meters using Haversine formula
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Fixed org coordinates for testing purposes since it's not in the org model
// Ideally, the Organization model should have lat/lng fields. We will assume a central point for now or just return true if we don't have them.
// Let's modify the schema later if needed, or just default to (0,0) for this mock.
export const isWithinGeofence = (lat: number, lng: number, orgLat: number, orgLng: number, radius: number): boolean => {
  const distance = getDistance(lat, lng, orgLat, orgLng);
  return distance <= radius;
};
