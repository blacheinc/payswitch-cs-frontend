import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Route-segment loading UI for the admin area. The App Router wraps the
 * upcoming page in a Suspense boundary with this component as the fallback,
 * so the sidebar stays mounted and the content area shows a skeleton instead
 * of a blank pane while the target page compiles / fetches.
 *
 * Next.js file convention: https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-[240px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
