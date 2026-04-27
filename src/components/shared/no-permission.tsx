"use client";

import { Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface NoPermissionProps {
  /** Short heading shown to the user. Defaults to a generic copy. */
  title?: string;
  /** Optional sub-copy explaining what they're missing. */
  description?: string;
  /** When true, renders compact inline copy (for tab panels). When false, fills a card. */
  inline?: boolean;
}

/**
 * Rendered when the signed-in admin lacks the permission(s) required to view
 * a page or panel. Pair with `usePermissions().can(code)` checks.
 */
export function NoPermission({
  title = "You don't have permission to view this.",
  description = "Contact a Super Admin to request access.",
  inline = false,
}: NoPermissionProps) {
  if (inline) {
    return (
      <div className="rounded-md border bg-muted/30 px-4 py-6 text-center">
        <Lock className="h-7 w-7 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <Lock className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-base font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
