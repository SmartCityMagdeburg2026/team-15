import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "online",
    botName: "Ottobot",
    description: "Magdeburg Smart City Assistant. Ask me about local air quality, transit delays, or tax revenue.",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = body.message || "";
    
    let responseText = "I'm Ottobot, your smart city assistant. I didn't quite catch that. How can I help you with Magdeburg's data today?";
    
    const normalized = userMessage.toLowerCase();
    if (normalized.includes("weather") || normalized.includes("climate")) {
      responseText = "Currently, Magdeburg-Mitte reports 18.5°C with 62% humidity. It's partly cloudy today.";
    } else if (normalized.includes("transit") || normalized.includes("tram") || normalized.includes("bus")) {
      responseText = "There are minor delays: Bus 51 is running 7 minutes late, and Tram 1 has a 3-minute delay. Other lines are on time.";
    } else if (normalized.includes("air") || normalized.includes("pollution") || normalized.includes("aqi")) {
      responseText = "The air quality index (AQI) in Magdeburg is 42, which is rated as 'Good'. PM2.5 is at 9.4 µg/m³.";
    } else if (normalized.includes("project") || normalized.includes("hackathon")) {
      responseText = "We have 42 total active hackathon projects right now! Delta is completed, while Alpha and Beta are active.";
    }

    return NextResponse.json({
      reply: responseText,
      botName: "Ottobot",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
}
