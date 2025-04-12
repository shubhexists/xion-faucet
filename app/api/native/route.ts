import { sendNativeTokens } from "@/utils/sendNativeTokens";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipient, amount, denom = "uxion", gasFee = "5000uxion" } = body;

    if (!recipient || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: recipient and amount are required" },
        { status: 400 }
      );
    }

    const privateKeyHex = process.env.OWNER_PRIVATE_KEY;
    if (!privateKeyHex) {
      return NextResponse.json(
        { error: "Server configuration error: Missing private key" },
        { status: 500 }
      );
    }

    const result = await sendNativeTokens({
      privateKeyHex,
      recipient,
      amount,
      denom,
      gasFee,
    });

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed,
      gasWanted: result.gasWanted,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid string. Length must be a multiple of 4"
    ) {
      return NextResponse.json(
        {
          error: error.message,
          success: false,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
