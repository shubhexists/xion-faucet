import { sendNativeTokens } from "@/utils/sendNativeTokens";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { DAILY_LIMIT, LIFETIME_LIMIT } from "@/lib/constants";

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

    const tokenKey = denom;

    const rateLimitResult = await rateLimit(recipient, tokenKey, {
      windowMs: DAILY_LIMIT,
      maxRequests: 1,
      maxLifetimeRequests: LIFETIME_LIMIT,
    });

    if (!rateLimitResult.success) {
      if (rateLimitResult.lifetimeLimitReached) {
        return NextResponse.json(
          {
            error: "Lifetime limit exceeded",
            details: {
              message: `You have reached the maximum number of allowed airdrops (${LIFETIME_LIMIT}) for ${denom} with this wallet`,
              lifetimeLimit: LIFETIME_LIMIT,
              lifetimeRemaining: 0,
            },
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details: {
            message: `You can only request ${denom} airdrops once per day for this wallet`,
            resetAt: rateLimitResult.resetAt,
            msBeforeNext: rateLimitResult.msBeforeNext,
            lifetimeRemaining: rateLimitResult.lifetimeRemaining,
            lifetimeLimit: rateLimitResult.lifetimeLimit,
          },
        },
        { status: 429 }
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
      limits: {
        lifetimeRemaining: rateLimitResult.lifetimeRemaining,
        lifetimeLimit: rateLimitResult.lifetimeLimit,
        nextRequestAvailable: rateLimitResult.resetAt,
      },
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
