import type { ReactNode } from "react";

import { getServerSession } from "@/lib/server-session";
import { PermissionsProvider } from "@/contexts/permissions-context";
import { OrgShell } from "@/components/layout/org-shell";

// Server component: the permission set is read from the HttpOnly session
// cookie here, never from a response body the browser can intercept and edit
// (VAPT §2.8).
export default async function OrgLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  return (
    <PermissionsProvider permissions={session?.user?.permissions ?? []}>
      <OrgShell>{children}</OrgShell>
    </PermissionsProvider>
  );
}
