/**
 * Fetches current weather for a given latitude and longitude using Open-Meteo API.
 */
export async function fetchWeather(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.current_weather) {
      const { temperature, weathercode } = data.current_weather;
      
      // Map WMO Weather interpretation codes (WW) to human readable strings and icons
      // https://open-meteo.com/en/docs
      const interpretCode = (code: number) => {
        if (code === 0) return { label: 'Sunny', icon: '☀️' };
        if (code <= 3) return { label: 'Partly Cloudy', icon: '⛅' };
        if (code <= 48) return { label: 'Foggy', icon: '🌫️' };
        if (code <= 57) return { label: 'Drizzle', icon: '🌦️' };
        if (code <= 67) return { label: 'Rainy', icon: '🌧️' };
        if (code <= 77) return { label: 'Snowy', icon: '❄️' };
        if (code <= 82) return { label: 'Rain Showers', icon: '🚿' };
        if (code <= 99) return { label: 'Thunderstorm', icon: '⛈️' };
        return { label: 'Unknown', icon: '🌡️' };
      };
      
      const info = interpretCode(weathercode);
      return {
        temp: temperature,
        ...info
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}
