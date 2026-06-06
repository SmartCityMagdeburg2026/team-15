import { NextResponse, type NextRequest } from "next/server";

const SEED = {
  aqi: 42,
  europeanAqi: 18,
  status: "Good",
  station: "Magdeburg-Mitte",
  pm25: 9.4,
  pm10: 18.2,
};

const SEED_HISTORY = {
  aqi: 48,
  europeanAqi: 22,
  status: "Good",
  station: "Magdeburg-Mitte",
  pm25: 11.2,
  pm10: 20.4,
};

function aqiStatusFromEuropean(eaqi: number): string {
  if (eaqi <= 20) return "Good";
  if (eaqi <= 40) return "Fair";
  if (eaqi <= 60) return "Moderate";
  if (eaqi <= 80) return "Poor";
  return "Very Poor";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isHistory = searchParams.get("history") === "true";

  if (isHistory) {
    return NextResponse.json({
      ...SEED_HISTORY,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    });
  }

  // Attempt live fetch from Open-Meteo Air Quality API
  try {
    const res = await fetch(
      "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=52.1205&longitude=11.6276&current=european_aqi,pm2_5,pm10",
      { next: { revalidate: 300 } } // cache for 5 min
    );

    if (res.ok) {
      const json = await res.json();
      const eaqi: number  = json?.current?.european_aqi ?? SEED.europeanAqi;
      const pm25: number  = json?.current?.pm2_5        ?? SEED.pm25;
      const pm10: number  = json?.current?.pm10         ?? SEED.pm10;
      // Approximate legacy AQI (not EAQI) using pm2.5
      const legacyAqi = Math.round(pm25 * 4.5);

      return NextResponse.json({
        aqi: legacyAqi,
        europeanAqi: eaqi,
        status: aqiStatusFromEuropean(eaqi),
        station: "Open-Meteo / Magdeburg",
        pm25,
        pm10,
        timestamp: json?.current?.time ?? new Date().toISOString(),
      });
    }
  } catch {
    // Fall through to seed
  }

  return NextResponse.json({
    ...SEED,
    timestamp: new Date().toISOString(),
  });
}
