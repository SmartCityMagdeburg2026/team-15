import { NextResponse } from "next/server";

export async function GET() {
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
