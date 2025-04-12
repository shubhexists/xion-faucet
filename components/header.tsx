import Image from "next/image";
import BlazeLogo from "@/public/header.png";

export function Header() {
  return (
    <div className="flex items-center justify-center w-full p-8 mx-auto ">
      <Image src={BlazeLogo} alt="Solana Logo" height={64} />
    </div>
  );
}
