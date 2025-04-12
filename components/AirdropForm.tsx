"use client";

import { useState, ChangeEvent, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { bech32 } from "bech32";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import Image from "next/image";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import BlazeLogo from "@/public/blaze.png";
import EarthLogo from "@/public/earth.jpeg";
import XIONLogo from "@/public/xion.png";
import FluxLogo from "@/public/Fluxion.jpg";
import XMTLogo from "@/public/xmt.jpg";
import { StaticImageData } from "next/image";

type TokenOption = {
  symbol: string;
  amount: number;
  logo: StaticImageData;
  contractAddress: string;
};

type AirdropFormProps = {
  className?: string;
};

export const AirdropForm = ({ className }: AirdropFormProps) => {
  const { toast } = useToast();
  const tokenOptions: TokenOption[] = [
    {
      symbol: "XION",
      amount: 0.5,
      logo: XIONLogo,
      contractAddress: "",
    },
    {
      symbol: "EAR",
      amount: 10,
      logo: EarthLogo,
      contractAddress:
        "xion1dyak845ktsrcskkl6kjx96za7zw9l6k7hll8lpy0wtxvvcuqfe6qkrenrp",
    },
    {
      symbol: "FLUX",
      amount: 10,
      logo: FluxLogo,
      contractAddress:
        "xion1gs4udmzdvkw32tk4mh6y3d9qnylepdek6sna7ky76qtals05gk4qfdyrss",
    },
    {
      symbol: "XMT",
      amount: 10,
      logo: XMTLogo,
      contractAddress:
        "xion1kgnnvdkk8urereur969tfhje54jvd67xz3hh3nv6pgpxc790dd2sy35s53",
    },
    {
      symbol: "BLAZE",
      amount: 10,
      logo: BlazeLogo,
      contractAddress:
        "xion1ujng4tufdqsd9s0nw5wtflzcemyg0g8trwtet33zafj29a3k0zhqejyfgs",
    },
  ];
  const [loading, setLoading] = useState<boolean>(false);

  const [walletAddress, setWalletAddress] = useState<string>("");
  const [errors, setErrors] = useState<{ wallet: string }>({
    wallet: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<{
    [key: string]: string;
  }>({});

  const validateWallet = (address: string): boolean => {
    try {
      const decoded = bech32.decode(address);
      return decoded.prefix === "xion";
    } catch (error) {
      return false;
    }
  };

  const handleWalletChange = (event: ChangeEvent<HTMLInputElement>) => {
    const address = event.target.value;
    setWalletAddress(address);

    if (!validateWallet(address)) {
      setErrors((errors) => ({
        ...errors,
        wallet: "Invalid wallet address",
      }));
    } else {
      setErrors((errors) => ({
        ...errors,
        wallet: "",
      }));
    }
  };

  const requestAirdrop = useCallback(
    async (token: TokenOption) => {
      try {
        setProcessingStatus((prev) => ({
          ...prev,
          [token.symbol]: "processing",
        }));

        if (token.symbol === "XION") {
          const response = await fetch("/api/native", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recipient: walletAddress,
              amount: (token.amount * 1000000).toString(),
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to process airdrop");
          }

          setProcessingStatus((prev) => ({
            ...prev,
            [token.symbol]: "success",
          }));
          return { success: true };
        }
        const response = await fetch("/api/airdrop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cw20TokenContract: token.contractAddress,
            recipientContract: walletAddress,
            amount: (token.amount * 1000000).toString(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to process airdrop");
        }

        setProcessingStatus((prev) => ({
          ...prev,
          [token.symbol]: "success",
        }));

        return { success: true };
      } catch (error) {
        setProcessingStatus((prev) => ({
          ...prev,
          [token.symbol]: "failed",
        }));
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    [walletAddress]
  );

  const requestAllAirdrops = useCallback(async () => {
    setProcessingStatus({});
    let successCount = 0;
    let errorMessages = [];

    for (const token of tokenOptions) {
      const result = await requestAirdrop(token);
      if (result.success) {
        successCount++;
      } else if (result.error) {
        errorMessages.push(`${token.symbol}: ${result.error}`);
      }
    }

    if (successCount === tokenOptions.length) {
      toast({
        title: "Airdrop Successful",
        description: `All tokens have been sent to your wallet!`,
      });
    } else if (successCount > 0) {
      toast({
        title: "Partial Airdrop Success",
        description: `${successCount} out of ${tokenOptions.length} tokens were sent successfully.`,
      });
    } else {
      toast({
        title: "Airdrop Failed",
        description:
          errorMessages.length > 0 ? errorMessages[0] : "Failed to send tokens",
        variant: "destructive",
      });
    }
  }, [requestAirdrop, tokenOptions, toast]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const addressFromUrl = urlParams.get("walletAddress");

    if (addressFromUrl && validateWallet(addressFromUrl)) {
      setWalletAddress(addressFromUrl);
    }
  }, []);

  useEffect(() => {
    setIsFormValid(walletAddress !== "" && errors.wallet === "");
  }, [errors.wallet, walletAddress]);

  const submitHandler = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (loading || !isFormValid) return;

      try {
        setLoading(true);
        await requestAllAirdrops();
      } catch (error) {
        toast({
          title: "Airdrop Failed",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, isFormValid, requestAllAirdrops, toast]
  );

  return (
    <form onSubmit={submitHandler} className={className}>
      <Toaster />

      <Card className="w-full mx-auto md:max-w-lg">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between gap-3">
              <span>Request Airdrop</span>
            </div>
          </CardTitle>
          <CardDescription>
            Get all tokens at once! Each set of tokens can be requested maximum
            1 time per day.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <input
            type="text"
            placeholder="Wallet Address"
            onChange={handleWalletChange}
            value={walletAddress}
            required={true}
            disabled={loading}
            className="w-full p-2 border rounded"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {tokenOptions.map((token) => (
              <div
                key={token.symbol}
                className={`p-2 border rounded flex items-center justify-between ${
                  processingStatus[token.symbol] === "success"
                    ? "bg-green-50"
                    : processingStatus[token.symbol] === "failed"
                    ? "bg-red-50"
                    : processingStatus[token.symbol] === "processing"
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <div className="flex items-center">
                  <Image
                    src={token.logo}
                    alt={`${token.symbol} logo`}
                    className="mr-2"
                    width={20}
                    height={20}
                  />
                  <span
                    className={
                      processingStatus[token.symbol] === "success"
                        ? "text-black font-medium"
                        : processingStatus[token.symbol] === "processing"
                        ? "text-blue-800 font-medium"
                        : processingStatus[token.symbol] === "failed"
                        ? "text-red-800 font-medium"
                        : ""
                    }
                  >
                    {token.amount} {token.symbol}
                  </span>
                </div>
                {processingStatus[token.symbol] === "success" && (
                  <span className="text-green-500 text-xs">✓</span>
                )}
                {processingStatus[token.symbol] === "failed" && (
                  <span className="text-red-500 text-xs">✗</span>
                )}
                {processingStatus[token.symbol] === "processing" && (
                  <span className="text-blue-500 text-xs">...</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter>
          <section className="grid w-full gap-3">
            <Button
              type="submit"
              className="w-full"
              variant="default"
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <span className="">Processing...</span>
              ) : (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  <span>
                    {errors.wallet ? "INVALID XION ADDRESS" : "Request Tokens"}
                  </span>
                </>
              )}
            </Button>
          </section>
        </CardFooter>
      </Card>
    </form>
  );
};
