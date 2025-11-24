import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // ensure no static caching

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      version: "1.0",
      uptime: process.uptime(), // optional, nice touch
    },
    { status: 200 }
  );
}
