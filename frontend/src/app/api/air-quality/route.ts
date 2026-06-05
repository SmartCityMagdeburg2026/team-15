import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    aqi: 42,
    status: "Good",
    station: "Magdeburg-Mitte",
    pm25: 9.4,
    pm10: 18.2,
    timestamp: new Date().toISOString()
  });
}
