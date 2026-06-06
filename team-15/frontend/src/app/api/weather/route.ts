import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    temperature: 18.5,
    humidity: 62,
    condition: "Partly Cloudy",
    windSpeed: 14.5,
    precipitation: 0.0,
    timestamp: new Date().toISOString()
  });
}
