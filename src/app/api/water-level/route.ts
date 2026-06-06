import { NextResponse, type NextRequest } from "next/server";

// Proxy endpoint for Pegelonline (Magdeburg-Strombrücke)
// Returns consistent shape for internal consumers (value in cm)

const SEED = {
  value: 235, // cm (backwards-compatible)
  value_cm: 235,
  value_m: 2.35,
  timestamp: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isHistory = searchParams.get("history") === "true";

  try {
    if (isHistory) {
      // 1-day measurements from Pegelonline
      const res = await fetch(
        "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/MAGDEBURG-STROMBR%C3%9CCKE/W/measurements.json?start=P1D",
        { next: { revalidate: 300 } }
      );
      if (!res.ok) return NextResponse.json({ error: "Pegelonline history fetch failed" }, { status: res.status });
      const data = await res.json();
      return NextResponse.json({ measurements: data });
    }

    // current measurement
    const cur = await fetch(
      "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/MAGDEBURG-STROMBR%C3%9CCKE/W/currentmeasurement.json",
      { next: { revalidate: 60 } }
    );
    if (!cur.ok) return NextResponse.json(SEED);
    const json = await cur.json();

    // Pegelonline returns value in cm in `value` field for this station
    const valueCm = Number(json?.value ?? json?.level ?? 0);
    const valueM = Number((valueCm / 100).toFixed(3));
    const timestamp = json?.timestamp ?? new Date().toISOString();
    const trend = json?.trend ?? undefined;

    // Return both `value` (cm) for backward compatibility and explicit fields
    return NextResponse.json({ value: valueCm, value_cm: valueCm, value_m: valueM, timestamp, trend });
  } catch (err) {
    return NextResponse.json(SEED);
  }
}
