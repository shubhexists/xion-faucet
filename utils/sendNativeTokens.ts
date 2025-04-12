import { RPC_ENDPOINT } from "@/lib/constants";
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";
import { GasPrice } from "@cosmjs/stargate";

export async function sendNativeTokens({
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
