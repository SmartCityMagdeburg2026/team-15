import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isHistory = searchParams.get("history") === "true";

  if (isHistory) {
    return NextResponse.json({
      status: "Moderate Delays",
      delays: [
        { line: "Tram 1", delay: "5 min", status: "Delayed" },
        { line: "Tram 9", delay: "2 min", status: "Minor Delay" },
        { line: "Bus 51", delay: "10 min", status: "Delayed" },
        { line: "Bus 54", delay: "0 min", status: "On Time" }
      ],
      timestamp: new Date(Date.now() - 86400000).toISOString()
    });
  }

  return NextResponse.json({
    status: "Minor Delays",
    delays: [
      { line: "Tram 1", delay: "3 min", status: "Minor Delay" },
      { line: "Tram 9", delay: "0 min", status: "On Time" },
      { line: "Bus 51", delay: "7 min", status: "Delayed" },
      { line: "Bus 54", delay: "0 min", status: "On Time" }
    ],
    timestamp: new Date().toISOString()
  });
}
