import type { Metadata } from "next";
import { Outfit, Oxanium } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import { PREFERENCES_KEY } from "@/stores/preferences";

const outfitHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Doctor Tracker", template: "%s | Doctor Tracker" },
  description: "Manage doctors, the patients in their care, and clinic activity in one place.",
};

// Runs before first paint so a saved dark theme never flashes light. It reads the same
// localStorage entry the preferences store persists to.
const themeScript = `(function(){try{var s=(JSON.parse(localStorage.getItem(${JSON.stringify(PREFERENCES_KEY)})||"{}").state||{}).theme||"system";var d=s==="dark"||(s==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased font-sans", oxanium.variable, outfitHeading.variable)}
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
