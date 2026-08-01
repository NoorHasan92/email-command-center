// app/page.tsx
// Main landing page for the application.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-[64rem] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
          {APP_CONFIG.name}
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          {APP_CONFIG.description}
        </p>
        <div className="flex gap-4 mt-6">
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
