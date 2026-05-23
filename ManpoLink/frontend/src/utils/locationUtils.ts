/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate travel time based on distance and mode of transport
 * @param distanceKm Distance in kilometers
 * @param mode 'walk' | 'ride' (tricycle/jeepney) | 'car'
 * @returns Travel time in minutes
 */
export const calculateTravelTime = (
  distanceKm: number,
  mode: 'walk' | 'ride' | 'car'
): number => {
  // Average speeds (km/h)
  const speeds = {
    walk: 5, // Walking speed
    ride: 15, // Tricycle/Jeepney average
    car: 60, // Car average
  };

  const hours = distanceKm / speeds[mode];
  return Math.round(hours * 60); // Convert to minutes
};

/**
 * Format travel time to readable format
 * @param minutes Travel time in minutes
 * @returns Formatted time string (e.g., "1h 30min")
 */
export const formatTravelTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

/**
 * Get user's current location
 * @returns Promise with latitude and longitude
 */
export const getUserLocation = (): Promise<[number, number]> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve([latitude, longitude]);
      },
      (error) => {
        reject(error);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
      }
    );
  });
};
