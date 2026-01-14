import { NextRequest, NextResponse } from 'next/server';

export interface SuggestionData {
  category: string;
  description: string;
  clothingItems: string[];
}

const CLOTHING_CATEGORIES = {
  WINTER_COLD: 'winter_cold',
  WINTER_MILD: 'winter_mild',
  SPRING_FALL: 'spring_fall',
  SUMMER_WARM: 'summer_warm',
  SUMMER_HOT: 'summer_hot',
  GYM: 'gym',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  [CLOTHING_CATEGORIES.WINTER_COLD]: 'Wear <span class="highlight">thermal base layer</span>, <span class="highlight">fleece jacket</span>, and <span class="highlight">long tights</span> with gloves and hat.',
  [CLOTHING_CATEGORIES.WINTER_MILD]: 'Wear <span class="highlight">long-sleeve base</span> with a light jacket and tights. <span class="highlight">Light gloves</span> recommended.',
  [CLOTHING_CATEGORIES.SPRING_FALL]: 'Wear <span class="highlight">short-sleeve shirt</span> with a light jacket or <span class="highlight">long-sleeve top</span>. Tights or shorts work.',
  [CLOTHING_CATEGORIES.SUMMER_WARM]: 'Wear <span class="highlight">short-sleeve shirt</span> and shorts. Choose <span class="highlight">lightweight</span> materials.',
  [CLOTHING_CATEGORIES.SUMMER_HOT]: 'Opt for <span class="highlight">breathable shorts</span> and light tank. Don\'t forget <span class="highlight">sunscreen</span>.',
  [CLOTHING_CATEGORIES.GYM]: 'Run indoors on treadmill. Wear light, comfortable clothing.',
};

const CATEGORY_CLOTHING: Record<string, string[]> = {
  [CLOTHING_CATEGORIES.WINTER_COLD]: [
    'Thermal base layer',
    'Fleece midlayer',
    'Windproof jacket',
    'Long running tights',
    'Warm hat',
    'Gloves',
  ],
  [CLOTHING_CATEGORIES.WINTER_MILD]: [
    'Long-sleeve base layer',
    'Light jacket',
    'Running tights',
    'Light gloves',
  ],
  [CLOTHING_CATEGORIES.SPRING_FALL]: [
    'Short-sleeve or long-sleeve shirt',
    'Light jacket (optional)',
    'Running shorts or tights',
  ],
  [CLOTHING_CATEGORIES.SUMMER_WARM]: [
    'Short-sleeve shirt',
    'Running shorts',
    'Light socks',
  ],
  [CLOTHING_CATEGORIES.SUMMER_HOT]: [
    'Breathable shorts',
    'Light running tank',
    'Sun hat',
    'Sunscreen',
  ],
  [CLOTHING_CATEGORIES.GYM]: [
    'Light running t-shirt',
    'Running shorts or leggings',
    'Running shoes',
    'Water bottle',
    'Towel',
  ],
};

function isUnsuitableForRunning(weatherCode: number): boolean {
  const unsuitableCodes = [
    51, 53, 55,
    61, 63, 65,
    71, 73, 75,
    80, 81, 82,
    95, 96, 99,
  ];
  return unsuitableCodes.includes(weatherCode);
}

function categorizeClothing(
  temperature: number,
  humidity: number,
  windSpeed: number,
  feelsLike: number,
  aqi: number,
  weatherCode: number,
  intensity: string
): string {
  const isUnsuitable =
    isUnsuitableForRunning(weatherCode) ||
    aqi >= 200 ||
    temperature < -20 || feelsLike < -20 ||
    temperature > 35 || feelsLike > 35 ||
    windSpeed > 50;

  if (isUnsuitable) {
    return CLOTHING_CATEGORIES.GYM;
  }

  const adjustedTemp = intensity === 'high' ? feelsLike + 5 : feelsLike;

  if (adjustedTemp <= 5) {
    return CLOTHING_CATEGORIES.WINTER_COLD;
  }

  if (adjustedTemp <= 12) {
    return CLOTHING_CATEGORIES.WINTER_MILD;
  }

  if (adjustedTemp <= 20) {
    return CLOTHING_CATEGORIES.SPRING_FALL;
  }

  if (adjustedTemp <= 27) {
    return CLOTHING_CATEGORIES.SUMMER_WARM;
  }

  return CLOTHING_CATEGORIES.SUMMER_HOT;
}

async function generateSuggestion(
  category: string,
  temperature: number,
  humidity: number,
  windSpeed: number,
  feelsLike: number,
  aqi: number,
  weatherCode: number,
  intensity: string
): Promise<SuggestionData> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

    if (apiKey) {
      try {
        const prompt = `You are a running clothing expert. Based on weather, provide ONE concise sentence recommendation for a ${intensity === 'high' ? 'high intensity (Zone 4-5)' : 'low-medium intensity (Zone 1-3)'} run.

Weather: ${temperature}°C (feels ${feelsLike}°C), ${humidity}% humidity, ${windSpeed}km/h wind, AQI ${aqi}, weather code ${weatherCode}
Category: ${category}

${category === 'gym' ? 'Note: Outdoor conditions are unsafe. Recommend running indoors.' : ''}

Write ONE sentence (max 30 words) with key clothing items wrapped in <span class="highlight">item</span> tags.

Example: Wear <span class="highlight">thermal base layer</span> and <span class="highlight">windbreaker</span> for cold conditions.

Respond with JSON:
{
  "description": "...",
  "clothingItems": ["item1", "item2", ...]
}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful running clothing advisor. Always respond with valid JSON.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 300,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0].message.content;
          const llmResult = JSON.parse(content);

          return {
            category,
            description: llmResult.description || CATEGORY_DESCRIPTIONS[category],
            clothingItems: CATEGORY_CLOTHING[category],
          };
        }
      } catch (err) {
        console.log('LLM API call failed, using defaults');
      }
    }

    return {
      category,
      description: CATEGORY_DESCRIPTIONS[category],
      clothingItems: CATEGORY_CLOTHING[category],
    };
  } catch (error) {
    console.error('Error generating suggestion:', error);

    return {
      category,
      description: CATEGORY_DESCRIPTIONS[category],
      clothingItems: CATEGORY_CLOTHING[category],
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      temperature,
      humidity,
      windSpeed,
      feelsLike,
      aqi,
      weatherCode,
      intensity,
    } = body;

    if (
      temperature === undefined ||
      humidity === undefined ||
      windSpeed === undefined ||
      feelsLike === undefined ||
      aqi === undefined ||
      weatherCode === undefined ||
      !intensity
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const category = categorizeClothing(
      temperature,
      humidity,
      windSpeed,
      feelsLike,
      aqi,
      weatherCode,
      intensity
    );

    console.log(`Suggestion API - Temp: ${temperature}°C, Feels: ${feelsLike}°C, Intensity: ${intensity}, Category: ${category}`);

    const suggestion = await generateSuggestion(
      category,
      temperature,
      humidity,
      windSpeed,
      feelsLike,
      aqi,
      weatherCode,
      intensity
    );

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Suggestion API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}
