import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { SITE } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Blazeswap Testnet Faucet",
  description: "Get swap tokens airdrop from this public Faucet, on testnet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <Header />

        <section className="p-4 mx-auto space-y-10 md:p-0 md:space-y-0">
          {children}
        </section>

        <Footer />
      </body>
    </html>
  );
}
