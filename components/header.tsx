import Image from "next/image";
import BlazeLogo from "@/public/blaze.png";
import BlazeText from "@/public/logo-text.png";

export function Header() {
  return (
    <div className="flex items-center justify-center w-full p-8 mx-auto ">
      <Image src={BlazeLogo} alt="Solana Logo" height={64} />
      <Image src={BlazeText} alt="Solana Logo" height={64} />
    </div>
  );
}
