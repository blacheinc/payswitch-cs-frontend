"use client";

// Re-exported so the ~25 existing call sites keep importing from here.
// The implementation moved to a context seeded server-side — see
// src/contexts/permissions-context.tsx.
export { usePermissions } from "@/contexts/permissions-context";
