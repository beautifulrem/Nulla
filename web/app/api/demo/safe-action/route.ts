import { NextResponse } from "next/server";
import { getAddress } from "viem";
import { executeSafeServerAction } from "@/server/safe/execute";
import type { NextAction } from "@/lib/types";
import { DEMO_SAFE_OWNER_ADDRESS, DEMO_SAFE_SHARED_ADDRESS } from "@/lib/constants";

export const runtime = "nodejs";

type SafeActionRequest = {
  safeAddress: string;
  ownerAddress: string;
  action: {
    chainId: number;
    label: string;
    description: string;
    to: string;
    data: `0x${string}`;
    value: string;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SafeActionRequest;
    if (
      getAddress(body.safeAddress) !== DEMO_SAFE_SHARED_ADDRESS ||
      getAddress(body.ownerAddress) !== DEMO_SAFE_OWNER_ADDRESS
    ) {
      return NextResponse.json({ error: "This demo executor only supports the shared demo Safe." }, { status: 400 });
    }

    const action: NextAction = {
      chainId: body.action.chainId as NextAction["chainId"],
      label: body.action.label,
      description: body.action.description,
      to: getAddress(body.action.to),
      data: body.action.data,
      value: BigInt(body.action.value),
    };

    const hash = await executeSafeServerAction(action, DEMO_SAFE_SHARED_ADDRESS);
    return NextResponse.json({ hash });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute Safe action." },
      { status: 500 },
    );
  }
}
