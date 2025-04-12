import { NextResponse } from "next/server";
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";
import { GasPrice } from "@cosmjs/stargate";

const RPC_ENDPOINT = "https://rpc.xion-testnet-2.burnt.com:443";

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

async function sendNativeTokens({
  privateKeyHex,
  recipient,
  amount,
  denom = "uxion",
  gasFee = "5000uxion",
}: {
  privateKeyHex: string;
  recipient: string;
  amount: string;
  denom?: string;
  gasFee?: string;
  gasLimit?: string;
}) {
  const privateKeyBytes = Uint8Array.from(Buffer.from(privateKeyHex, "hex"));

  const wallet = await DirectSecp256k1Wallet.fromKey(privateKeyBytes, "xion");
  const [account] = await wallet.getAccounts();

  const client = await SigningStargateClient.connectWithSigner(
    RPC_ENDPOINT,
    wallet,
    {
      gasPrice: GasPrice.fromString("0.025uxion"),
    }
  );

  const amountValue = parseInt(amount, 10);
  if (isNaN(amountValue)) {
    throw new Error("Invalid amount specified");
  }

  const sendAmount = {
    denom: denom,
    amount: amount.toString(),
  };

  const fee = {
    amount: [{ denom: "uxion", amount: "5000" }],
    gas: "200000",
  };

  const result = await client.sendTokens(
    account.address,
    recipient,
    [
      {
        denom: "uxion",
        amount: amount,
      },
    ],
    fee
  );

  return result;
}
