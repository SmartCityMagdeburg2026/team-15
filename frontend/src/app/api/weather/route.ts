import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.XWEATHER_CLIENT_ID;
  const clientSecret = process.env.XWEATHER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing XWEATHER_CLIENT_ID or XWEATHER_CLIENT_SECRET." },
      { status: 500 }
    );
  }

  const url = `https://data.api.xweather.com/conditions/magdeburg,de?format=json&plimit=1&filter=1min&client_id=${clientId}&client_secret=${clientSecret}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const details = await res.text();
      return NextResponse.json(
        { error: "XWeather request failed.", details },
        { status: res.status }
      );
    }

    const data = await res.json();
    const payload = data?.response ?? data;
    const item = payload?.[0]?.periods?.[0];
    const place = payload?.[0]?.place;

    if (!item) {
      return NextResponse.json(
        { error: "Unexpected XWeather response shape.", response: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      temperature: item.tempC,
      humidity: item.humidity,
      condition: item.weather,
      windSpeed: item.windSpeedKPH,
      city: place?.name || "Magdeburg",
      timestamp: item.dateTimeISO
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch weather data.", details: String(error) },
      { status: 500 }
    );
  }
}