"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constant";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-muted-foreground">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" asChild>
            <Link href={ROUTES.AUTH.LOGIN}>Go back home</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.ADMIN.DASHBOARD}>Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
