# RunWear - Smart Running Clothing Suggestions

A web application that provides personalized running clothing recommendations based on weather conditions and air quality. Built with Next.js and powered by AI for intelligent suggestions.

## Features

- 🎨 Prominent character image display at the top with instant tab switching
- 🌤️ Real-time weather data (temperature, humidity, wind speed, feels-like temperature)
- 🌬️ Air quality index integration
- 🏃 Two running intensity levels (Low-Medium Zone 1-3, High Zone 4-5)
- ⚡ Pre-fetched suggestions for both intensities - no waiting when switching
- 🤖 AI-powered clothing suggestions using OpenRouter LLM
- 📱 Responsive design for both desktop and mobile devices
- ⚠️ Safety warnings for unsafe outdoor conditions

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **OpenRouter API** - AI-powered suggestions
- **Open-Meteo API** - Weather and air quality data (100% free, no API key)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenRouter API key (free at https://openrouter.ai/)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the example environment file and add your API key:

```bash
cp .env.example .env.local
```

3. Update `.env.local` with your actual API key:

```
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

Note: Weather data uses Open-Meteo API which is completely free and requires no API key.

You can change the LLM model by setting `OPENROUTER_MODEL` to any model available on OpenRouter (e.g., `openai/gpt-4o-mini`, `anthropic/claude-3-haiku`, etc.).

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
RunWear/
├── app/
│   ├── api/
│   │   ├── weather/
│   │   │   └── route.ts        # Weather & AQI data endpoint
│   │   └── suggestion/
│   │       └── route.ts        # AI-powered suggestion endpoint
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main page component
│   └── globals.css             # Global styles
├── components/
│   ├── WeatherDisplay.tsx      # Weather information display
│   ├── IntensitySelector.tsx   # Running intensity selector
│   └── SuggestionDisplay.tsx    # Clothing suggestion with character image
├── public/
│   └── images/                 # Add your character images here
└── ... config files
```

## Adding Character Images

The application expects character images for different clothing categories:

- `winter_cold.png` - Cold weather outfit
- `winter_mild.png` - Cool weather outfit
- `summer_hot.png` - Hot weather outfit
- `summer_warm.png` - Warm weather outfit
- `rain.png` - Rainy weather outfit
- `windy.png` - Windy weather outfit
- `normal.png` - Pleasant weather outfit
- `gym.png` - Indoor running outfit

Place your images in the `public/images/` directory. Recommended size: 600x800px.

## Clothing Categories

The AI suggestions are categorized into 8 fixed outfits:

### Outdoor Running (7 categories)

1. **Winter Cold** - Very cold temperatures (≤0°C)
2. **Winter Mild** - Cool temperatures (1-10°C)
3. **Summer Hot** - Hot temperatures (≥30°C)
4. **Summer Warm** - Warm temperatures (25-29°C)
5. **Rain** - High humidity (>85%)
6. **Windy** - High wind speed (20-50 km/h)
7. **Normal** - Pleasant conditions

### Indoor Running (1 category)

8. **Gym/Indoor** - Unsafe outdoor conditions (recommend treadmill/gym):
   - Air Quality Index (AQI) ≥ 4 (Unhealthy)
   - Extreme cold (temperature or feels-like < -20°C)
   - Extreme heat (temperature or feels-like > 35°C)
   - Extreme wind (wind speed > 50 km/h)

**Note:** The application automatically detects unsafe conditions and suggests indoor running instead.

## Deployment to Vercel

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to [Vercel](https://vercel.com) and import your repository

3. Add environment variables in Vercel dashboard:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_API_URL` (optional, defaults to OpenRouter)

4. Deploy!

The application will be automatically deployed with every push to your main branch.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Yes | - |
| `OPENROUTER_API_URL` | OpenRouter API URL | No | https://openrouter.ai/api/v1/chat/completions |
| `OPENROUTER_MODEL` | OpenRouter model to use | No | meta-llama/llama-3.1-8b-instruct:free |

**Note:** Weather API (Open-Meteo) is completely free and requires no configuration.

**Available Models:** You can use any model from [OpenRouter's model list](https://openrouter.ai/models). Popular free options include:
- `meta-llama/llama-3.1-8b-instruct:free` (default, free)
- `google/gemma-7b-it:free` (free)
- Paid models like `openai/gpt-4o-mini`, `anthropic/claude-3-haiku`

## API Endpoints

### GET /api/weather
Fetches weather and air quality data based on latitude and longitude.

Query Parameters:
- `lat` - Latitude
- `lon` - Longitude

### POST /api/suggestion
Generates AI-powered clothing suggestions.

Request Body:
- `temperature` - Current temperature (°C)
- `humidity` - Humidity percentage
- `windSpeed` - Wind speed (km/h)
- `feelsLike` - Feels-like temperature (°C)
- `aqi` - Air quality index
- `intensity` - Running intensity ('low', 'medium', or 'high')

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
