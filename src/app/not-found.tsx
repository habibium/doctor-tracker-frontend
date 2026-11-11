import Link from "next/link";
import { BrandLockup, MissingMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col bg-sidebar">
      <header className="p-6">
        <Link
          href="/dashboard"
          aria-label="Doctor Tracker, go to the dashboard"
          className="inline-flex rounded-lg ring-ring outline-none focus-visible:ring-2"
        >
          <BrandLockup />
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-24 text-center">
        <MissingMark />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-pretty text-muted-foreground">There is nothing at this address.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Go to the dashboard
        </Button>
      </main>
    </div>
  );
}
