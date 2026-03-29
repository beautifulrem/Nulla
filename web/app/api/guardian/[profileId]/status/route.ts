import { NextResponse } from "next/server";
import { getGuardianStatus } from "@/server/actions";
import { serializeJson } from "@/server/models/json";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await context.params;
  const payload = await getGuardianStatus(profileId as `0x${string}`);
  return NextResponse.json(serializeJson(payload));
}
