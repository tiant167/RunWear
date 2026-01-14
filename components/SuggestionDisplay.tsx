import { SuggestionData } from '@/app/page';

interface SuggestionDisplayProps {
  suggestion: SuggestionData;
}

export default function SuggestionDisplay({ suggestion }: SuggestionDisplayProps) {
  return (
    <div className="text-center">
      {suggestion.category === 'gym' && (
        <div className="bg-red-50 text-red-700 p-3 rounded-2xl mb-4 font-semibold border border-red-200 text-sm">
          ⚠️ Outdoor running is not recommended
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mb-4 font-['MiSans-Bold'] text-lg text-slate-900">
        <i className="ri-magic-line text-blue-500 text-xl"></i>
        <span>Recommendation</span>
      </div>

      <p
        className="font-['MiSans-Regular'] text-base leading-relaxed text-slate-700"
        dangerouslySetInnerHTML={{ __html: suggestion.description }}
      />
    </div>
  );
}
