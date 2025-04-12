import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { RPC_ENDPOINT } from "@/lib/constants";

export async function sendCw20WithMsg({
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
