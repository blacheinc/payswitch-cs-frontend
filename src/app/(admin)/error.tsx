"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constant";

/**
 * Error boundary for the admin area. Isolates crashes to the route segment so
 * the sidebar + shell stay interactive. A full-page crash above this should be
 * caught by the root global-error.tsx.
 *
 * Next.js file convention: https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook for error reporting — pipe to Sentry / Logtail here later.
    console.error("[admin] route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        An unexpected error happened while rendering this page. Try again, or
        head back to the admin dashboard.
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
          <Link href={ROUTES.ADMIN.DASHBOARD}>Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
