"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  Building2,
  RefreshCcw,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trainingService, TRAINING_KEYS } from "@/lib/training-service";
import { MappingEditor } from "@/components/training/mapping-editor";
import type { UpdateFieldMappingItem } from "@/types/training-type";

export default function TrainingDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pollInterval, setPollInterval] = useState<number | false>(false);

  // Queries
  const { data: upload, isLoading: isLoadingUpload } = useQuery({
    queryKey: TRAINING_KEYS.uploadDetail(id),
    queryFn: () => trainingService.getUpload(id),
  });

  const { data: statusData } = useQuery({
    queryKey: TRAINING_KEYS.uploadStatus(id),
    queryFn: () => trainingService.getUploadStatus(id),
    refetchInterval: pollInterval,
    enabled: !!pollInterval,
  });

  const { data: mappingData } = useQuery({
    queryKey: TRAINING_KEYS.uploadMapping(id),
    queryFn: () => trainingService.getMapping(id),
    enabled:
      upload?.status === "pending_review" ||
      upload?.status === "processed" ||
      upload?.status === "approved",
  });

  // Polling logic
  useEffect(() => {
    if (upload?.status === "processing" || upload?.status === "queued") {
      setPollInterval(3000); // Poll every 3 seconds
    } else {
      setPollInterval(false);
    }
  }, [upload?.status]);

  // Handle status change from polling
  useEffect(() => {
    if (statusData?.status && statusData.status !== upload?.status) {
      queryClient.invalidateQueries({
        queryKey: TRAINING_KEYS.uploadDetail(id),
      });
    }
  }, [statusData?.status, upload?.status, id, queryClient]);

  // Mutations
  const updateMappingMutation = useMutation({
    mutationFn: (mappings: UpdateFieldMappingItem[]) =>
      trainingService.updateMapping(id, { mappings }),
    onSuccess: () => {
      toast.success("Mappings updated successfully.");
      queryClient.invalidateQueries({
        queryKey: TRAINING_KEYS.uploadMapping(id),
      });
    },
    onError: () => toast.error("Failed to update mappings."),
  });

  const approveMutation = useMutation({
    mutationFn: () => trainingService.approveUpload(id),
    onSuccess: () => {
      toast.success("Upload approved. Training started.");
      queryClient.invalidateQueries({
        queryKey: TRAINING_KEYS.uploadDetail(id),
      });
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => trainingService.retryUpload(id),
    onSuccess: () => {
      toast.success("Processing retried.");
      queryClient.invalidateQueries({
        queryKey: TRAINING_KEYS.uploadDetail(id),
      });
    },
  });

  if (isLoadingUpload) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dataset details...</p>
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Upload not found</h2>
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
      case "pending_review":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            Pending Review
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="animate-pulse">
            Processing...
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{upload.fileName}</h1>
                {getStatusBadge(upload.status)}
              </div>
              <p className="text-muted-foreground">
                Uploaded on{" "}
                {format(new Date(upload.createdAt), "MMMM d, yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {upload.status === "failed" && (
              <Button
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${retryMutation.isPending ? "animate-spin" : ""}`}
                />
                Retry Processing
              </Button>
            )}
            {upload.status === "pending_review" && (
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                <ShieldCheck className="mr-2 h-4 w-4" /> Approve & Train
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dataset Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dataset Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Source</span>
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" /> {upload.dataSourceName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Format</span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {upload.fileFormat}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Size</span>
                <span className="text-sm font-medium">
                  {(upload.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Records
                </span>
                <span className="text-sm font-medium">
                  {upload.recordCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Valid Records
                </span>
                <span className="text-sm font-medium text-green-600">
                  {upload.validRecordCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Features Mapped
                </span>
                <span className="text-sm font-medium">
                  {upload.featuresMapped} / {upload.targetFeaturesTotal}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quality Report */}
          <Card className={upload.qualityScore === 0 ? "opacity-50" : ""}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Data Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <div
                  className={`text-4xl font-black ${
                    upload.qualityScore >= 90
                      ? "text-green-600"
                      : upload.qualityScore >= 70
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {upload.qualityScore}%
                </div>
                <p className="text-sm font-medium">Overall Quality Score</p>
              </div>

              <Progress value={upload.qualityScore} className="h-2" />

              {upload.qualityReport &&
                Object.entries(upload.qualityReport).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Metrics
                    </p>
                    <div className="space-y-2">
                      {Object.entries(upload.qualityReport).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span>
                              {typeof value === "number"
                                ? `${(value * 100).toFixed(1)}%`
                                : String(value)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {upload.status === "failed" && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Processing Error
                  </p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    {upload.errorMessage ||
                      upload.rejectionReason ||
                      "Unknown error occurred during processing."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Area: Mapping & Review */}
        <div className="lg:col-span-2 space-y-6">
          {upload.status === "processing" ? (
            <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative b-12 bg-primary/10 p-6 rounded-full">
                  <Clock className="h-12 w-12 text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Analyzing Dataset...</h3>
              <p className="text-muted-foreground max-w-sm">
                Our AI agents are currently parsing your file, extracting
                samples, identifying fields, and generating suggested mappings.
              </p>
              <Progress value={45} className="w-[200px] mt-6 h-1.5" />
            </Card>
          ) : mappingData ? (
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Field Mapping Review</CardTitle>
                  <CardDescription>
                    Review and confirm how source fields map to model target
                    features.
                  </CardDescription>
                </div>
                {upload.status === "approved" && (
                  <Badge
                    variant="outline"
                    className="text-green-700 border-green-200 bg-green-50"
                  >
                    <ShieldCheck className="h-3 w-3 mr-1" /> Mapping Finalized
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <MappingEditor
                  mappings={mappingData.mappings}
                  onSave={(updates) => updateMappingMutation.mutate(updates)}
                  isSaving={updateMappingMutation.isPending}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground">
                No mapping data available
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Mapping will be generated once the dataset is successfully
                processed.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
