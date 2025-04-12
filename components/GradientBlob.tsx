"use client";
import { useEffect, useRef } from "react";

export const GradientBlob = () => {
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!blobRef.current) return;
    blobRef.current.animate(
      [
        {
          borderRadius: "42% 58% 31% 69% / 45% 35% 65% 55%",
          transform: "translate(-50%, -50%) scale(1)",
        },
        {
          borderRadius: "60% 40% 70% 30% / 30% 65% 35% 70%",
          transform: "translate(-50%, -50%) scale(1.1)",
        },
        {
          borderRadius: "42% 58% 31% 69% / 45% 35% 65% 55%",
          transform: "translate(-50%, -50%) scale(1)",
        },
      ],
      {
        duration: 8000,
        iterations: Infinity,
        direction: "alternate",
        easing: "ease-in-out",
      }
    );
  }, []);

  return (
    <div
      ref={blobRef}
      className="pointer-events-none fixed top-1/4 left-1/2 w-72 h-72 bg-gradient-to-br from-pink-400 via-purple-500 to-fuchsia-400 opacity-70 blur-[100px] -translate-x-1/2 -translate-y-1/2 z-[-1]"
    ></div>
  );
};
