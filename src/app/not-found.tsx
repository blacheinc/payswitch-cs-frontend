"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constant";
import { AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/session-storage";

/**
 * 404 / wrong-scope page.
 *
 * The proxy rewrites cross-scope access here (e.g. an org user hitting an
 * admin URL), so we tailor the "go home" destination to whoever is logged in:
 *   - admin  → /admin-dashboard
 *   - org    → /dashboard
 *   - anon   → /login
 */
export default function NotFound() {
  const [home, setHome] = useState<{ label: string; href: string }>({
    label: "Go to login",
    href: ROUTES.AUTH.LOGIN,
  });

  useEffect(() => {
    // Browser-only read on mount: localStorage isn't available during SSR, so
    // we start with the anon default and upgrade client-side. The setState-in-
    // effect warning is intentional here — this is synchronising React state
    // with an external store (the session cookie/localStorage).
    const session = getSession();
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHome(
      session.userType === "admin"
        ? { label: "Go to admin dashboard", href: ROUTES.ADMIN.DASHBOARD }
        : { label: "Go to dashboard", href: ROUTES.ORG.DASHBOARD },
    );
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist, has been moved,
          or you don&apos;t have access to it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild>
            <Link href={home.href}>{home.label}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
