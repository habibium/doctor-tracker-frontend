import Image from "next/image";
import { cn } from "@/lib/utils";

/** The logo mark. Decorative wherever the wordmark or a label names it. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      loading="eager"
      className={cn("shrink-0 select-none", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

/** "Doctor" in the logo's blue and "Tracker" in its mint, each stepped for the theme. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-brand leading-none font-extrabold tracking-[-0.015em] whitespace-nowrap [word-spacing:-0.06em]",
        className,
      )}
    >
      <span className="text-brand-blue">Doctor</span>{" "}
      <span className="text-brand-mint">Tracker</span>
    </span>
  );
}

const LOCKUP_SIZES = {
  sm: { logo: 28, text: "text-[1.0625rem]", gap: "gap-2" },
  md: { logo: 32, text: "text-lg", gap: "gap-2.5" },
  lg: { logo: 44, text: "text-[1.625rem]", gap: "gap-3" },
};

export function BrandLockup({
  size = "md",
  className,
  wordmarkClassName,
}: {
  size?: keyof typeof LOCKUP_SIZES;
  className?: string;
  wordmarkClassName?: string;
}) {
  const { logo, text, gap } = LOCKUP_SIZES[size];
  return (
    <span className={cn("flex min-w-0 items-center", gap, className)}>
      <Logo size={logo} />
      <Wordmark className={cn(text, wordmarkClassName)} />
    </span>
  );
}
