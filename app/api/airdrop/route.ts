import { NextResponse } from "next/server";
import { sendCw20WithMsg } from "@/utils/sendCW20";
import { rateLimit } from "@/lib/rateLimit";
import { DAILY_LIMIT, LIFETIME_LIMIT } from "@/lib/constants";

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

    const tokenKey = cw20TokenContract;

    const rateLimitResult = await rateLimit(recipientContract, tokenKey, {
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
              message: `You have reached the maximum number of allowed airdrops (${LIFETIME_LIMIT}) for this token with this wallet`,
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
            message:
              "You can only request this token airdrop once per day for this wallet",
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

    const result = await sendCw20WithMsg({
      privateKeyHex,
      cw20TokenContract,
      recipientContract,
      amount,
    });

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
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
