import type { Metadata } from "next";
import { GradientBlob } from "@/components/GradientBlob";
import { AirdropForm } from "@/components/AirdropForm";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Page() {
  return (
    <main className="items-center justify-center w-full space-y-8 md:py-20">
      <AirdropForm className="items-center justify-center w-full md:flex" />
      <GradientBlob />
    </main>
  );
}
