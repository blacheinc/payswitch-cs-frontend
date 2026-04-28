"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Search, Layers } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trainingService, TRAINING_KEYS } from "@/lib/training-service";
import { TrainingUploadTable } from "@/components/training/training-upload-table";
import { useDebounce } from "@/hooks/use-debounce";

export default function DataSourceDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  // Queries
  const { data: source, isLoading: isLoadingSource } = useQuery({
    queryKey: TRAINING_KEYS.sourceDetail(id),
    queryFn: () => trainingService.getSource(id),
  });

  const {
    data: uploads,
    isLoading: isLoadingUploads,
    isError: isErrorUploads,
  } = useQuery({
    queryKey: TRAINING_KEYS.sourceUploads(id, {
      page,
      perPage,
      search: debouncedSearch,
    }),
    queryFn: () =>
      trainingService.listSourceUploads(id, {
        page,
        perPage,
        search: debouncedSearch,
      }),
  });

  if (isLoadingSource) {
    return (
      <div className="space-y-6">
        {/* Back button + header */}
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            className="w-fit"
            onClick={() => router.push("/training")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Training Data
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-56" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Source Information card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 w-40" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row}>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  {row < 4 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upload History table — spans both columns */}
          <Card className="col-span-2">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-sm" />
                  <Skeleton className="h-5 w-56" />
                </div>
                <Skeleton className="h-9 w-full sm:w-64" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2, 3, 4].map((row) => (
                <Skeleton key={row} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!source) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">
          Failed to load data source details.
        </p>
        <Button variant="outline" onClick={() => router.push("/training")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Training Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/training")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Training Data
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl font-bold">
              {source.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{source.name}</h1>
                <Badge variant="secondary" className="font-mono">
                  {source.shortCode}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {source.sourceType} • Institutional Data Source
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Details card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Source Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              label="Description"
              value={source.description || "No description provided."}
            />
            <Separator />
            <DetailRow
              label="Source Type"
              value={source.sourceType}
              capitalize
            />
            <Separator />
            <DetailRow label="Short Code" value={source.shortCode} mono />
            <Separator />
            <DetailRow
              label="Total Uploads"
              value={String(source.totalUploads)}
            />
            <Separator />
            <DetailRow
              label="Registered"
              value={format(new Date(source.createdAt), "MMM d, yyyy")}
            />
          </CardContent>
        </Card>

        {/* Upload History table */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-primary" />
                Dataset Upload History
                {uploads && (
                  <Badge variant="secondary" className="ml-2">
                    {uploads.total}
                  </Badge>
                )}
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search history..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TrainingUploadTable
              data={uploads}
              isLoading={isLoadingUploads}
              isError={isErrorUploads}
              page={page}
              onPageChange={setPage}
              perPage={perPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---- Helper component ----

function DetailRow({
  label,
  value,
  capitalize,
  mono,
}: {
  label: string;
  value: string | null;
  capitalize?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium ${capitalize ? "capitalize" : ""} ${mono ? "font-mono text-xs" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
