import { NextRequest, NextResponse } from 'next/server';

export interface SuggestionData {
  category: string;
  description: string;
  clothingItems: string[];
}

export interface DualSuggestions {
  low: SuggestionData;
  high: SuggestionData;
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

function categorizeClothing(
  temperature: number,
  humidity: number,
  windSpeed: number,
  feelsLike: number,
  aqi: number,
  weatherCode: number,
  intensity: string
): string {
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

async function generateDualSuggestions(
  temperature: number,
  humidity: number,
  windSpeed: number,
  feelsLike: number,
  aqi: number,
  weatherCode: number
): Promise<DualSuggestions> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

    if (apiKey) {
      try {
        const prompt = `You are a running clothing expert. Based on weather conditions, determine the most appropriate clothing category for both low-medium intensity (Zone 1-3) and high intensity (Zone 4-5) runs.

Current weather:
- Temperature: ${temperature}°C (feels like ${feelsLike}°C)
- Humidity: ${humidity}%
- Wind speed: ${windSpeed}km/h
- AQI (air quality): ${aqi}
- Weather code: ${weatherCode}

Available categories:
1. winter_cold - Very cold conditions (≤5°C adjusted)
2. winter_mild - Cool conditions (6-12°C adjusted)
3. spring_fall - Mild conditions (13-20°C adjusted)
4. summer_warm - Warm conditions (21-27°C adjusted)
5. summer_hot - Hot conditions (>27°C adjusted)
6. gym - Outdoor conditions are unsafe (extreme AQI, severe weather, dangerous temperature, or extreme wind)

IMPORTANT: Determine category based on ALL weather factors. Choose 'gym' if any condition makes outdoor running unsafe:
- AQI ≥ 150 (unhealthy or worse - running increases breathing rate, avoid polluted air)
- Temperature or feels-like < -20°C or > 35°C
- Wind speed > 50 km/h
- Severe weather (rain, snow, thunderstorms, etc.)

For low-medium intensity runs: Use feels-like temperature.
For high intensity runs: Adjust for body heat generation (feels-like + 5°C).

Write ONE concise sentence (max 30 words) for each intensity with key clothing items wrapped in <span class="highlight">item</span> tags.

Example:
low: "Wear <span class="highlight">thermal base layer</span> and <span class="highlight">windbreaker</span>."
high: "Wear <span class="highlight">light base layer</span> and <span class="highlight">shorts</span>."

Respond with JSON:
{
  "low": {
    "category": "winter_cold|winter_mild|spring_fall|summer_warm|summer_hot|gym",
    "description": "..."
  },
  "high": {
    "category": "winter_cold|winter_mild|spring_fall|summer_warm|summer_hot|gym",
    "description": "..."
  }
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
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0].message.content;
          const llmResult = JSON.parse(content);

          const lowCategory = llmResult.low?.category || categorizeClothing(temperature, humidity, windSpeed, feelsLike, aqi, weatherCode, 'low');
          const highCategory = llmResult.high?.category || categorizeClothing(temperature, humidity, windSpeed, feelsLike, aqi, weatherCode, 'high');

          return {
            low: {
              category: lowCategory,
              description: llmResult.low?.description || CATEGORY_DESCRIPTIONS[lowCategory],
              clothingItems: CATEGORY_CLOTHING[lowCategory],
            },
            high: {
              category: highCategory,
              description: llmResult.high?.description || CATEGORY_DESCRIPTIONS[highCategory],
              clothingItems: CATEGORY_CLOTHING[highCategory],
            },
          };
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('LLM API call failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
        }
      } catch (err) {
        console.error('LLM API call failed:', err);
      }
    }

    const lowCategory = categorizeClothing(temperature, humidity, windSpeed, feelsLike, aqi, weatherCode, 'low');
    const highCategory = categorizeClothing(temperature, humidity, windSpeed, feelsLike, aqi, weatherCode, 'high');

    return {
      low: {
        category: lowCategory,
        description: CATEGORY_DESCRIPTIONS[lowCategory],
        clothingItems: CATEGORY_CLOTHING[lowCategory],
      },
      high: {
        category: highCategory,
        description: CATEGORY_DESCRIPTIONS[highCategory],
        clothingItems: CATEGORY_CLOTHING[highCategory],
      },
    };
  } catch (error) {
    console.error('Error generating dual suggestions:', error);

    const lowCategory = categorizeClothing(temperature, humidity, windSpeed, feelsLike, aqi, weatherCode, 'low');
    const highCategory = categorizeClothing(temperature, humidity, windSpeed, feelsLike, aqi, weatherCode, 'high');

    return {
      low: {
        category: lowCategory,
        description: CATEGORY_DESCRIPTIONS[lowCategory],
        clothingItems: CATEGORY_CLOTHING[lowCategory],
      },
      high: {
        category: highCategory,
        description: CATEGORY_DESCRIPTIONS[highCategory],
        clothingItems: CATEGORY_CLOTHING[highCategory],
      },
    };
  }
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
        const prompt = `You are a running clothing expert. Based on weather conditions, determine the most appropriate clothing category and provide ONE concise sentence recommendation.

Current weather:
- Temperature: ${temperature}°C (feels like ${feelsLike}°C)
- Humidity: ${humidity}%
- Wind speed: ${windSpeed}km/h
- AQI (air quality): ${aqi}
- Weather code: ${weatherCode}
- Running intensity: ${intensity === 'high' ? 'high intensity (Zone 4-5)' : 'low-medium intensity (Zone 1-3)'}

Available categories:
1. winter_cold - Very cold conditions (≤5°C adjusted)
2. winter_mild - Cool conditions (6-12°C adjusted)
3. spring_fall - Mild conditions (13-20°C adjusted)
4. summer_warm - Warm conditions (21-27°C adjusted)
5. summer_hot - Hot conditions (>27°C adjusted)
6. gym - Outdoor conditions are unsafe (extreme AQI, severe weather, dangerous temperature, or extreme wind)

IMPORTANT: You must determine the category based on ALL weather factors. Choose 'gym' if any condition makes outdoor running unsafe:
- AQI ≥ 150 (unhealthy or worse - running increases breathing rate, avoid polluted air)
- Temperature or feels-like < -20°C or > 35°C
- Wind speed > 50 km/h
- Severe weather (rain, snow, thunderstorms, etc.)

For ${intensity === 'high' ? 'high intensity' : 'low-medium intensity'} runs, adjust for body heat generation (+5°C for high intensity).

Write ONE sentence (max 30 words) with key clothing items wrapped in <span class="highlight">item</span> tags.

Example: Wear <span class="highlight">thermal base layer</span> and <span class="highlight">windbreaker</span> for cold conditions.

Respond with JSON:
{
  "category": "winter_cold|winter_mild|spring_fall|summer_warm|summer_hot|gym",
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
          const llmCategory = llmResult.category || category;

          return {
            category: llmCategory,
            description: llmResult.description || CATEGORY_DESCRIPTIONS[llmCategory],
            clothingItems: CATEGORY_CLOTHING[llmCategory],
          };
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('LLM API call failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
        }
      } catch (err) {
        console.error('LLM API call failed:', err);
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

    if (intensity === 'both') {
      console.log(`Suggestion API - Temp: ${temperature}°C, Feels: ${feelsLike}°C, Getting dual suggestions`);
      const suggestions = await generateDualSuggestions(
        temperature,
        humidity,
        windSpeed,
        feelsLike,
        aqi,
        weatherCode
      );
      return NextResponse.json(suggestions);
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
