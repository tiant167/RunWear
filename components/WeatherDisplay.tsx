import { WeatherData } from '@/app/page';

interface WeatherDisplayProps {
  weather: WeatherData;
}

export default function WeatherDisplay({ weather }: WeatherDisplayProps) {
  const getAQILabel = (aqi: number): string => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return '#22c55e';
    if (aqi <= 100) return '#fbbf24';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    if (aqi <= 300) return '#9333ea';
    return '#7f1d1d';
  };

  const getWeatherIcon = (): string => {
    const weatherText = weather.weather?.toLowerCase() || '';
    if (weatherText.includes('rain') || weatherText.includes('shower')) return 'ri-rainy-line';
    if (weatherText.includes('cloud') || weatherText.includes('overcast')) return 'ri-cloudy-line';
    if (weatherText.includes('sun') || weatherText.includes('clear')) return 'ri-sun-line';
    if (weatherText.includes('snow')) return 'ri-snowy-line';
    if (weatherText.includes('thunder')) return 'ri-thunderstorms-line';
    return 'ri-sun-cloudy-line';
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      <div className="bg-white rounded-2xl p-3 md:p-4 flex flex-col gap-2 border border-slate-200 transition-transform hover:-translate-y-0.5 hover:border-slate-300">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-['AlibabaSans-Medium']">
          <i className="ri-temp-hot-line text-amber-500 text-base md:text-lg"></i>
          Temp
        </div>
        <div className="font-['MiSans-Bold'] text-base md:text-lg text-slate-900">{weather.temperature}°C</div>
      </div>

      <div className="bg-white rounded-2xl p-3 md:p-4 flex flex-col gap-2 border border-slate-200 transition-transform hover:-translate-y-0.5 hover:border-slate-300">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-['AlibabaSans-Medium']">
          <i className="ri-user-smile-line text-blue-500 text-base md:text-lg"></i>
          Feels Like
        </div>
        <div className="font-['MiSans-Bold'] text-base md:text-lg text-slate-900">{weather.feelsLike}°C</div>
      </div>

      <div className="bg-white rounded-2xl p-3 md:p-4 flex flex-col gap-2 border border-slate-200 transition-transform hover:-translate-y-0.5 hover:border-slate-300">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-['AlibabaSans-Medium']">
          <i className={`${getWeatherIcon()} text-blue-500 text-base md:text-lg`}></i>
          Weather
        </div>
        <div className="font-['MiSans-Bold'] text-base md:text-lg text-slate-900">{weather.weather || 'N/A'}</div>
      </div>

      <div className="bg-white rounded-2xl p-3 md:p-4 flex flex-col gap-2 border border-slate-200 transition-transform hover:-translate-y-0.5 hover:border-slate-300">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-['AlibabaSans-Medium']">
          <i className="ri-drop-line text-blue-500 text-base md:text-lg"></i>
          Humidity
        </div>
        <div className="font-['MiSans-Bold'] text-base md:text-lg text-slate-900">{weather.humidity}%</div>
      </div>

      <div className="bg-white rounded-2xl p-3 md:p-4 flex flex-col gap-2 border border-slate-200 transition-transform hover:-translate-y-0.5 hover:border-slate-300">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-['AlibabaSans-Medium']">
          <i className="ri-windy-line text-sky-500 text-base md:text-lg"></i>
          Wind
        </div>
        <div className="font-['MiSans-Bold'] text-base md:text-lg text-slate-900">{weather.windSpeed} km/h</div>
      </div>

      <div className="bg-white rounded-2xl p-3 md:p-4 flex flex-col gap-2 border border-slate-200 transition-transform hover:-translate-y-0.5 hover:border-slate-300">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-['AlibabaSans-Medium']">
          <i className="ri-leaf-line text-emerald-500 text-base md:text-lg"></i>
          AQI
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-['MiSans-Bold'] text-base md:text-lg text-slate-900">{weather.aqi}</span>
          <span className="font-['MiSans-Regular'] text-xs text-slate-500">({getAQILabel(weather.aqi)})</span>
        </div>
        <div className="h-1.5 rounded-full mt-1" style={{ backgroundColor: getAQIColor(weather.aqi) }}></div>
      </div>
    </div>
  );
}
