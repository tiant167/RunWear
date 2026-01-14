'use client';

import { useState, useEffect, useRef } from 'react';
import WeatherDisplay from '@/components/WeatherDisplay';
import IntensitySelector from '@/components/IntensitySelector';
import CharacterImage from '@/components/CharacterImage';
import SuggestionDisplay from '@/components/SuggestionDisplay';

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

export interface SuggestionData {
  category: string;
  description: string;
  clothingItems: string[];
}

export interface CityResult {
  name: string;
  admin1: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
}

export type Intensity = 'low' | 'high';

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [intensity, setIntensity] = useState<Intensity>('low');
  const [suggestions, setSuggestions] = useState<Record<Intensity, SuggestionData | null>>({
    low: null,
    high: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchingCities, setSearchingCities] = useState(false);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lon: number } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearchingCities(true);
    try {
      const response = await fetch(`/api/weather/search?city=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.cities || []);
      setShowResults(data.cities && data.cities.length > 0);
    } catch (err) {
      console.error('City search error:', err);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setSearchingCities(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchWeather(null, latitude, longitude);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setCity('');
        setError('Unable to retrieve your location. Try searching for a city.');
      }
    );
  };

  const fetchWeather = async (selectedCity: CityResult | null, lat?: number, lon?: number) => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/weather?';
      if (selectedCity) {
        url += `lat=${selectedCity.latitude}&lon=${selectedCity.longitude}`;
        setLastCoords({ lat: selectedCity.latitude, lon: selectedCity.longitude });
      } else if (lat && lon) {
        url += `lat=${lat}&lon=${lon}`;
        setLastCoords({ lat, lon });
      } else {
        throw new Error('Invalid parameters');
      }

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch weather data');
      }

      const weatherData: WeatherData = await response.json();
      setWeather(weatherData);
      setCity(weatherData.location);
      setSearchInput('');
      setSearchResults([]);
      setShowResults(false);

      await fetchAllSuggestions(weatherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setLoading(false);
    }
  };

  const fetchAllSuggestions = async (weatherData: WeatherData) => {
    try {
      const [lowResp, highResp] = await Promise.all([
        fetch('/api/suggestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            feelsLike: weatherData.feelsLike,
            aqi: weatherData.aqi,
            weatherCode: weatherData.weatherCode,
            intensity: 'low',
          }),
        }),
        fetch('/api/suggestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            feelsLike: weatherData.feelsLike,
            aqi: weatherData.aqi,
            weatherCode: weatherData.weatherCode,
            intensity: 'high',
          }),
        }),
      ]);

      const lowData = await lowResp.json();
      const highData = await highResp.json();

      if (lowData.category === highData.category) {
        console.warn('Both intensities returned same category - check API logic');
      }

      setSuggestions({
        low: lowData,
        high: highData,
      });
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handleIntensityChange = (newIntensity: Intensity) => {
    setIntensity(newIntensity);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    searchCities(value);
  };

  const handleCitySelect = (selectedCity: CityResult) => {
    fetchWeather(selectedCity);
  };

  const handleRetry = () => {
    if (lastCoords) {
      fetchWeather(null, lastCoords.lat, lastCoords.lon);
    } else {
      getLocation();
    }
  };

  const currentSuggestion = suggestions[intensity];

  const getCityDisplay = (city: CityResult) => {
    return `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}${city.country ? `, ${city.country_code}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-slate-50 to-white flex justify-center py-4 md:py-8">
      <div className="w-full max-w-[430px] bg-gradient-to-b from-sky-50 via-slate-50 to-white min-h-screen md:min-h-[calc(100vh-4rem)] relative overflow-hidden shadow-xl md:rounded-3xl">
        <div className="p-5 md:p-6 pb-8 text-center">
          <h1 className="font-['MiSans-Bold'] text-2xl mb-4 md:mb-6 text-slate-900 tracking-tight">Running Advice</h1>

          {city && (
            <div className="mb-4">
              <p className="text-sm text-slate-600 flex items-center justify-center gap-2">
                <i className="ri-map-pin-2-line text-blue-500"></i>
                {city}
              </p>
            </div>
          )}

          <div className="relative mb-4" ref={searchRef}>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => setShowResults(searchResults.length > 0)}
                placeholder="Search city..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white"
              />
              <button
                onClick={() => handleSearchInputChange(searchInput)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || searchInput.length < 2}
              >
                <i className="ri-search-line text-lg"></i>
              </button>
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-slate-200 z-50 max-h-64 overflow-y-auto">
                {searchResults.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                  >
                    <div className="font-medium text-slate-900">{city.name}</div>
                    <div className="text-sm text-slate-500">
                      {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchingCities && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 text-center text-slate-500 text-sm">
                Searching cities...
              </div>
            )}

            {showResults && searchResults.length === 0 && searchInput.length >= 2 && !searchingCities && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 text-center text-slate-500 text-sm">
                No cities found
              </div>
            )}
          </div>

          <IntensitySelector
            intensity={intensity}
            onIntensityChange={handleIntensityChange}
          />

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-4 border border-red-200 text-sm">
              {error}
              <button onClick={handleRetry} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm">
                Retry
              </button>
            </div>
          )}

          {loading && !weather && (
            <div className="bg-white/90 rounded-2xl p-8 text-center text-slate-600 shadow-lg border border-slate-100">
              Getting your location and weather data...
            </div>
          )}

          {weather && currentSuggestion && (
            <>
              <div className="relative mt-2 mb-6">
                <div className="bg-blob"></div>
                <CharacterImage suggestion={currentSuggestion} />

                {weather.temperature && weather.weather && (
                  <div className="absolute right-4 top-24 bg-white/95 px-4 py-2 rounded-full text-sm text-slate-900 font-['MiSans-Bold'] shadow-md flex items-center gap-2 floating-animation z-10">
                    <i className="ri-sun-cloudy-line text-amber-500"></i>
                    {weather.temperature}°C {weather.weather}
                  </div>
                )}
              </div>

              <div className="bg-white/90 rounded-3xl p-6 shadow-lg border border-slate-100 mb-6 relative z-10">
                <SuggestionDisplay suggestion={currentSuggestion} />
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <WeatherDisplay weather={weather} />
              </div>
            </>
          )}

          {loading && weather && !currentSuggestion && (
            <div className="bg-white/90 rounded-2xl p-8 text-center text-slate-600 shadow-lg border border-slate-100 mt-6">
              Generating personalized suggestions...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
