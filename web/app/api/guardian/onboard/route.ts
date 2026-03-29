import { NextResponse } from "next/server";
import { getAddress } from "viem";
import { onboardGuardianProfile } from "@/server/actions";
import { guardianOnboardSchema } from "@/server/schemas/guardian";
import { serializeJson } from "@/server/models/json";
import type { OnboardGuardianInput } from "@/lib/types";
import { ZodError } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = guardianOnboardSchema.parse(body);
    const input: OnboardGuardianInput = {
      safeAddress: getAddress(parsed.safeAddress),
      ownerAddress: getAddress(parsed.ownerAddress),
      tokenEth: getAddress(parsed.tokenEth),
      tokenBase: getAddress(parsed.tokenBase),
      allowlist: parsed.allowlist.map((value) => getAddress(value)),
      blacklist: parsed.blacklist.map((value) => getAddress(value)),
      cap: parsed.cap
    };
    const result = await onboardGuardianProfile(input);
    return NextResponse.json(serializeJson(result));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues.at(0)?.message ?? "Invalid Guardian onboarding input." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Guardian onboarding failed." },
      { status: 500 }
    );
  }
}
