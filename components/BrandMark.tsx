import Image from "next/image";
import { isDevin } from "@/lib/app-name";
import { cn } from "@/lib/utils";

// Logo mark: a dispenser slot ejecting a receipt with a torn edge.
// The slot bar inherits currentColor; the receipt is always brand blue.
// When IS_DEVIN=true, the Devin logo is shown instead — scaled up slightly
// because the PNG has built-in padding around the mark.
export default function BrandMark({ className }: { className?: string }) {
  if (isDevin()) {
    return (
      <Image
        src="/devin-white.png"
        alt=""
        aria-hidden="true"
        width={40}
        height={40}
        className={cn("scale-125", className)}
      />
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2.25 4h19.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M5.5 4h13v13.5l-2.17 2.5-2.17-2.5-2.17 2.5-2.16-2.5-2.17 2.5-2.16-2.5z"
        className="fill-brand"
      />
    </svg>
  );
}
