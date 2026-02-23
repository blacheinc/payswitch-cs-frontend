"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Search,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trainingService, TRAINING_KEYS } from "@/lib/training-service";
import { TrainingUploadTable } from "@/components/training/training-upload-table";
import { useDebounce } from "@/hooks/use-debounce";

export default function DataSourceDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

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
      search: debouncedSearch,
    }),
    queryFn: () =>
      trainingService.listSourceUploads(id, { page, search: debouncedSearch }),
  });

  if (isLoadingSource) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading source details...</p>
      </div>
    );
  }

  if (!source) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Data Source not found</h2>
        <Button
          variant="link"
          onClick={() => router.push("/training")}
          className="mt-2"
        >
          Back to Training Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 h-8 text-muted-foreground"
          onClick={() => router.push("/training")}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to Training Data
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{source.name}</h1>
                <Badge variant="secondary" className="font-mono">
                  {source.shortCode}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Institutional Data Source • {source.sourceType}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Source Metadata */}
        <div className="xl:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Description
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {source.description || "No description provided."}
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Total Uploads:</span>
                  <span className="font-medium">{source.totalUploads}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Short Code:</span>
                  <span className="font-mono text-[10px] font-bold">
                    {source.shortCode}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Registered:</span>
                  <span className="font-medium">
                    {format(new Date(source.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload History */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Dataset Upload History</CardTitle>
                  <CardDescription>
                    History of files provided by this institution
                  </CardDescription>
                </div>
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
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
