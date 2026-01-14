import { NextRequest, NextResponse } from 'next/server';

interface CityResult {
  name: string;
  admin1: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');

    if (!city) {
      return NextResponse.json(
        { error: 'City name is required' },
        { status: 400 }
      );
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
    const response = await fetch(geoUrl);

    if (!response.ok) {
      throw new Error('Failed to search cities');
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ cities: [] });
    }

    const cities: CityResult[] = data.results.map((result: any) => ({
      name: result.name,
      admin1: result.admin1 || '',
      country: result.country || '',
      country_code: result.country_code || '',
      latitude: result.latitude,
      longitude: result.longitude,
    }));

    return NextResponse.json({ cities });
  } catch (error) {
    console.error('City search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search cities' },
      { status: 500 }
    );
  }
}
