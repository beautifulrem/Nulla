import { NextResponse } from "next/server";
import { getHealthStatus } from "@/server/actions";
import { serializeJson } from "@/server/models/json";

export const runtime = "nodejs";

export async function GET() {
  const payload = await getHealthStatus();
  return NextResponse.json(serializeJson(payload));
}
