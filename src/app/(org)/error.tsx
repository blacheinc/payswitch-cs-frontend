"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constant";

/**
 * Error boundary for the organization portal. Keeps the shell interactive
 * while isolating render failures inside the route segment.
 */
export default function OrgError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[org] route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        This page couldn&apos;t render. You can retry, or go back to your
        dashboard and pick it up from there.
      </p>
      {error?.digest && (
        <p className="mt-2 text-[10px] font-mono text-muted-foreground/70">
          Ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={() => reset()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button asChild>
          <Link href={ROUTES.ORG.DASHBOARD}>Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
