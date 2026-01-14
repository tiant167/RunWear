import { SuggestionData } from '@/app/page';

interface CharacterImageProps {
  suggestion: SuggestionData | null;
}

const IMAGE_MAP: Record<string, string> = {
  winter_cold: '/images/winter_cold.png',
  winter_mild: '/images/winter_mild.png',
  spring_fall: '/images/spring_fall.png',
  summer_warm: '/images/summer_warm.png',
  summer_hot: '/images/summer_hot.png',
  gym: '/images/gym.png',
};

export default function CharacterImage({ suggestion }: CharacterImageProps) {
  const getImageUrl = (): string => {
    if (!suggestion) return '/images/summer_warm.png';

    const category = suggestion.category;
    return IMAGE_MAP[category] || '/images/summer_warm.png';
  };

  return (
    <div className="relative w-full h-[380px] flex justify-center items-start overflow-hidden">
      <img
        src={getImageUrl()}
        alt="Character"
        className="h-full w-auto object-contain drop-shadow-[0_10px_20px_rgba(37,99,235,0.1)] transition-opacity duration-400"
      />
    </div>
  );
}
