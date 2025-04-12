import { NextResponse } from "next/server";
import { sendCw20WithMsg } from "@/utils/sendCW20";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cw20TokenContract, recipientContract, amount } = body;

    if (!cw20TokenContract || !recipientContract || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const result = await sendCw20WithMsg({
      privateKeyHex,
      cw20TokenContract,
      recipientContract,
      amount,
    });

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
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
