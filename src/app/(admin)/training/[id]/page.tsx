"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Clock,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trainingService, TRAINING_KEYS } from "@/lib/training-service";

export default function TrainingDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const pollInterval = useQuery({
    queryKey: TRAINING_KEYS.uploadStatus(id),
    queryFn: () => trainingService.getUploadStatus(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "processing" || status === "queued" ? 3000 : false;
    },
  }).data?.status;

  // Queries
  const { data: upload, isLoading: isLoadingUpload } = useQuery({
    queryKey: TRAINING_KEYS.uploadDetail(id),
    queryFn: () => trainingService.getUpload(id),
  });

  // Handle status change from polling (handled by React Query invalidation)
  useEffect(() => {
    if (pollInterval && pollInterval !== upload?.status) {
      queryClient.invalidateQueries({
        queryKey: TRAINING_KEYS.uploadDetail(id),
      });
    }
  }, [pollInterval, upload?.status, id, queryClient]);

  // Mutations
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
        </div>

        {/* Action Area: Quality Report & Status */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={upload.qualityScore === 0 ? "opacity-50" : ""}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Data Quality Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-center space-y-2">
                  <div
                    className={`text-6xl font-black ${
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
                  <Progress value={upload.qualityScore} className="h-2 mt-4" />
                </div>

                <div className="space-y-4">
                  {upload.qualityReport &&
                  Object.entries(upload.qualityReport).length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Detailed Metrics
                      </p>
                      <div className="space-y-2">
                        {Object.entries(upload.qualityReport).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="capitalize text-muted-foreground">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="font-medium">
                                {typeof value === "number"
                                  ? `${(value * 100).toFixed(1)}%`
                                  : String(value)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                      <p className="text-sm text-muted-foreground">
                        Quality analysis in progress...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {upload.status === "failed" && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-sm font-bold text-red-800 mb-1 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Processing Error
                  </p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {upload.errorMessage ||
                      upload.rejectionReason ||
                      "Unknown error occurred during processing."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {upload.status === "processing" && (
            <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative b-12 bg-primary/10 p-6 rounded-full">
                  <Clock className="h-12 w-12 text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Analyzing Dataset...</h3>
              <p className="text-muted-foreground max-w-sm text-sm">
                Our AI agents are parsing your file, extracting samples, and
                evaluating data integrity.
              </p>
              <Progress value={45} className="w-[200px] mt-6 h-1.5" />
            </Card>
          )}

          {upload.status === "approved" && (
            <Card className="bg-green-50/50 border-green-100 border-dashed flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
              <div className="p-6 bg-green-100 rounded-full mb-6">
                <ShieldCheck className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">
                Training Initiated
              </h3>
              <p className="text-green-700 max-w-sm text-sm">
                This dataset has been approved and moved to the model training
                pipeline.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
