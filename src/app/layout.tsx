import type { Metadata, Viewport } from "next";
import { Nunito, Outfit, Oxanium } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import { PREFERENCES_KEY } from "@/stores/preferences";

const outfitHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-sans" });

// Only the wordmark uses it, so only its one weight is loaded.
const nunitoBrand = Nunito({ subsets: ["latin"], weight: "800", variable: "--font-brand" });

export const metadata: Metadata = {
  title: { default: "Doctor Tracker", template: "%s | Doctor Tracker" },
  description: "Manage doctors, the patients in their care, and clinic activity in one place.",
  applicationName: "Doctor Tracker",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eaf2fa" },
    { media: "(prefers-color-scheme: dark)", color: "#070d17" },
  ],
};

// Runs before first paint so a saved dark theme never flashes light. It reads the same
// localStorage entry the preferences store persists to, and exposes the choice to CSS.
const themeScript = `(function(){try{var s=(JSON.parse(localStorage.getItem(${JSON.stringify(PREFERENCES_KEY)})||"{}").state||{}).theme||"system";var d=s==="dark"||(s==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.dataset.themePreference=s}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        oxanium.variable,
        outfitHeading.variable,
        nunitoBrand.variable,
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
