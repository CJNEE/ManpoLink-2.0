/**
 * Normalizes API responses to handle both paginated and non-paginated formats
 * @param data - API response data
 * @returns Normalized array of items
 */
export const normalizeApiResponse = <T = any>(data: any): T[] => {
  if (!data) return [];
  
  // If data is already an array, return it
  if (Array.isArray(data)) {
    return data;
  }
  
  // If data has a 'results' property (paginated response), return results
  if (data.results && Array.isArray(data.results)) {
    return data.results;
  }
  
  // Fallback to empty array
  return [];
};

/**
 * Gets the total count from API response
 * @param data - API response data
 * @returns Count value or length of array
 */
export const getApiResponseCount = (data: any): number => {
  if (!data) return 0;
  
  // If data is an array, return its length
  if (Array.isArray(data)) {
    return data.length;
  }
  
  // If data has a 'count' property, return it
  if (typeof data.count === 'number') {
    return data.count;
  }
  
  // If data has a 'results' array, return its length
  if (data.results && Array.isArray(data.results)) {
    return data.results.length;
  }
  
  return 0;
};
