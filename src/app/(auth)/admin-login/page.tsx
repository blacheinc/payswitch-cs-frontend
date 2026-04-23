import { Suspense } from "react";
import { LoginShell } from "@/components/auth/login-shell";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginShell audience="admin" />
    </Suspense>
  );
}
