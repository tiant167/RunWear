import { NextRequest, NextResponse } from 'next/server';

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  aqi: number;
  weather: string;
  weatherCode: number;
}

const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear', icon: 'ri-sun-line' },
  1: { description: 'Mostly Clear', icon: 'ri-sun-line' },
  2: { description: 'Partly Cloudy', icon: 'ri-sun-cloudy-line' },
  3: { description: 'Overcast', icon: 'ri-cloudy-line' },
  45: { description: 'Foggy', icon: 'ri-mist-line' },
  48: { description: 'Depositing Rime Fog', icon: 'ri-mist-line' },
  51: { description: 'Light Drizzle', icon: 'ri-drizzle-line' },
  53: { description: 'Moderate Drizzle', icon: 'ri-drizzle-line' },
  55: { description: 'Dense Drizzle', icon: 'ri-drizzle-line' },
  61: { description: 'Slight Rain', icon: 'ri-rainy-line' },
  63: { description: 'Moderate Rain', icon: 'ri-rainy-line' },
  65: { description: 'Heavy Rain', icon: 'ri-rainy-line' },
  71: { description: 'Slight Snow', icon: 'ri-snowy-line' },
  73: { description: 'Moderate Snow', icon: 'ri-snowy-line' },
  75: { description: 'Heavy Snow', icon: 'ri-snowy-line' },
  80: { description: 'Slight Showers', icon: 'ri-showers-line' },
  81: { description: 'Moderate Showers', icon: 'ri-showers-line' },
  82: { description: 'Violent Showers', icon: 'ri-showers-line' },
  95: { description: 'Thunderstorm', icon: 'ri-thunderstorms-line' },
  96: { description: 'Thunderstorm with Hail', icon: 'ri-thunderstorms-line' },
  99: { description: 'Thunderstorm with Heavy Hail', icon: 'ri-thunderstorms-line' },
};

async function getLocationFromCity(city: string): Promise<{ lat: number; lon: number; location: string } | null> {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const response = await fetch(geoUrl);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.latitude,
        lon: result.longitude,
        location: result.name + (result.admin1 ? `, ${result.admin1}` : '') + (result.country ? `, ${result.country_code}` : ''),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function getCityFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'RunWear-App',
      },
    });
    
    if (!response.ok) {
      console.log('Nominatim API failed, trying Open-Meteo');
      return await getCityFromCoordsOpenMeteo(lat, lon);
    }
    
    const data = await response.json();
    
    if (data && data.address) {
      const cityName = data.address.city || data.address.town || data.address.village || data.address.county || '';
      const state = data.address.state || '';
      const country = data.address.country_code || '';
      
      const location = [cityName, state, country].filter(Boolean).join(', ');
      console.log('Nominatim result:', location);
      return location || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
    }
    
    console.log('No Nominatim results, trying Open-Meteo');
    return await getCityFromCoordsOpenMeteo(lat, lon);
  } catch (error) {
    console.error('Nominatim reverse geocoding error:', error);
    return await getCityFromCoordsOpenMeteo(lat, lon);
  }
}

async function getCityFromCoordsOpenMeteo(lat: number, lon: number): Promise<string> {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`;
    const response = await fetch(geoUrl);
    
    if (!response.ok) {
      console.log('Open-Meteo reverse geocoding failed, returning coordinates');
      return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const cityName = result.name || '';
      const admin1 = result.admin1 || '';
      const country = result.country || '';
      const countryCode = result.country_code || '';
      
      const location = [cityName, admin1, countryCode].filter(Boolean).join(', ');
      console.log('Open-Meteo reverse geocoding result:', location);
      return location || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
    }
    
    console.log('No Open-Meteo reverse geocoding results, returning coordinates');
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  } catch (error) {
    console.error('Open-Meteo reverse geocoding error:', error);
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const city = searchParams.get('city');
    
    let latitude: number;
    let longitude: number;
    let location: string;

    if (city) {
      const geoData = await getLocationFromCity(city);
      if (!geoData) {
        return NextResponse.json(
          { error: 'City not found' },
          { status: 404 }
        );
      }
      latitude = geoData.lat;
      longitude = geoData.lon;
      location = geoData.location;
    } else if (lat && lon) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lon);
      location = await getCityFromCoords(latitude, longitude);
    } else {
      return NextResponse.json(
        { error: 'City or coordinates are required' },
        { status: 400 }
      );
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`;

    const [weatherResponse, aqiResponse] = await Promise.all([
      fetch(weatherUrl),
      fetch(aqiUrl),
    ]);

    if (!weatherResponse.ok || !aqiResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();
    const aqiData = await aqiResponse.json();

    const weatherCode = weatherData.current.weather_code;
    const weatherInfo = WEATHER_CODES[weatherCode] || { description: 'Unknown', icon: 'ri-question-line' };

    const result: WeatherData = {
      location,
      temperature: Math.round(weatherData.current.temperature_2m),
      humidity: weatherData.current.relative_humidity_2m,
      windSpeed: Math.round(weatherData.current.wind_speed_10m),
      feelsLike: Math.round(weatherData.current.apparent_temperature),
      aqi: aqiData.current.us_aqi,
      weather: weatherInfo.description,
      weatherCode,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
