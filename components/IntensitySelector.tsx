import { Intensity } from '@/app/page';

interface IntensitySelectorProps {
  intensity: Intensity;
  onIntensityChange: (intensity: Intensity) => void;
}

export default function IntensitySelector({ intensity, onIntensityChange }: IntensitySelectorProps) {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-1 flex relative mx-auto mb-6 max-w-[320px] w-full border border-white/80 shadow-sm">
      <button
        className={`flex-1 py-2.5 text-center font-['AlibabaSans-Medium'] text-sm rounded-2xl transition-all ${
          intensity === 'low'
            ? 'bg-white text-blue-600 font-semibold shadow-md'
            : 'text-slate-500'
        }`}
        onClick={() => onIntensityChange('low')}
      >
        Medium-Low
      </button>
      <button
        className={`flex-1 py-2.5 text-center font-['AlibabaSans-Medium'] text-sm rounded-2xl transition-all ${
          intensity === 'high'
            ? 'bg-white text-blue-600 font-semibold shadow-md'
            : 'text-slate-500'
        }`}
        onClick={() => onIntensityChange('high')}
      >
        High Intensity
      </button>
    </div>
  );
}
