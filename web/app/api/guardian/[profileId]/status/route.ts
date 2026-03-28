import { NextResponse } from "next/server";
import { getGuardianStatus } from "@/server/actions";
import { serializeJson } from "@/server/models/json";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: { profileId: string } }) {
  const payload = await getGuardianStatus(context.params.profileId as `0x${string}`);
  return NextResponse.json(serializeJson(payload));
}
