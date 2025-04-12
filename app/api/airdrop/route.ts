import { NextResponse } from "next/server";
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";

const RPC_ENDPOINT = "https://rpc.xion-testnet-2.burnt.com:443";

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

async function sendCw20WithMsg({
  privateKeyHex,
  cw20TokenContract,
  recipientContract,
  amount,
}: {
  privateKeyHex: string;
  cw20TokenContract: string;
  recipientContract: string;
  amount: string;
}) {
  const privateKeyBytes = Uint8Array.from(Buffer.from(privateKeyHex, "hex"));
  const wallet = await DirectSecp256k1Wallet.fromKey(privateKeyBytes, "xion");
  const [account] = await wallet.getAccounts();

  const client = await SigningCosmWasmClient.connectWithSigner(
    RPC_ENDPOINT,
    wallet,
    {
      gasPrice: GasPrice.fromString("0.025uxion"),
    }
  );

  const sendMsg = {
    mint: {
      recipient: recipientContract,
      amount,
    },
  };

  const result = await client.execute(
    account.address,
    cw20TokenContract,
    sendMsg,
    "auto"
  );

  return result;
}
