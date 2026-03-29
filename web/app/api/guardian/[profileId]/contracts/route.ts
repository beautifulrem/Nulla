import { NextResponse } from "next/server";
import { getGuardianContracts } from "@/server/actions";
import { serializeJson } from "@/server/models/json";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await context.params;
  const payload = await getGuardianContracts(profileId as `0x${string}`);
  return NextResponse.json(serializeJson(payload));
}
