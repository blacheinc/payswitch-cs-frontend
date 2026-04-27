import { Loader2 } from "lucide-react";

/**
 * Root-level route-segment loading UI.
 *
 * Per Next.js's nearest-loading rule, this file becomes the Suspense fallback
 * for *every* segment in the app that doesn't define its own `loading.tsx`.
 * The closest enclosing layout (root, (auth), (org) sidebar, (admin) sidebar,
 * …) stays mounted during the transition — only the content area shows this
 * indicator. Page-specific skeletons remain in the page components themselves
 * because those handle data-fetching, not navigation.

 */
export default function RootLoading() {
  return (
    <div
      className="flex h-[60vh] items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
