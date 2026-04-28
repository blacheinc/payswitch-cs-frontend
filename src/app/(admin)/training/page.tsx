"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Building2,
  FileText,
  Star,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Skeleton } from "@/components/ui/skeleton";
import { trainingService, TRAINING_KEYS } from "@/lib/training-service";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CODES } from "@/lib/constant";
import { NoPermission } from "@/components/shared/no-permission";
import { TrainingUploadTable } from "@/components/training/training-upload-table";
import { DataSourceTable } from "@/components/training/data-source-table";
import { UploadDatasetModal } from "@/components/training/upload-dataset-modal";
import { AddDataSourceModal } from "@/components/training/add-data-source-modal";

export default function TrainingPage() {
  const { can } = usePermissions();
  const canReadDatasets = can(PERMISSION_CODES.ADMIN.TRAINING_READ);
  const canUpload = can(PERMISSION_CODES.ADMIN.TRAINING_UPLOAD);
  const canReadSources = can(PERMISSION_CODES.ADMIN.SOURCES_READ);
  const canManageSources = can(PERMISSION_CODES.ADMIN.SOURCES_MANAGE);
  const hasAnyAccess = canReadDatasets || canReadSources;

  const [activeTab, setActiveTab] = useState(
    canReadDatasets ? "datasets" : "data-sources",
  );
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);

  // Search & Pagination State
  const [datasetPage, setDatasetPage] = useState(1);
  const [datasetPerPage, setDatasetPerPage] = useState(10);
  const [datasetSearch, setDatasetSearch] = useState("");
  const debouncedDatasetSearch = useDebounce(datasetSearch);

  const [sourcePage, setSourcePage] = useState(1);
  const [sourcePerPage, setSourcePerPage] = useState(10);
  const [sourceSearch, setSourceSearch] = useState("");
  const debouncedSourceSearch = useDebounce(sourceSearch);

  // Queries
  const {
    data: datasets,
    isLoading: isLoadingDatasets,
    isError: isErrorDatasets,
  } = useQuery({
    queryKey: TRAINING_KEYS.uploads({
      page: datasetPage,
      perPage: datasetPerPage,
      search: debouncedDatasetSearch,
    }),
    queryFn: () =>
      trainingService.listUploads({
        page: datasetPage,
        perPage: datasetPerPage,
        search: debouncedDatasetSearch,
      }),
    enabled: canReadDatasets,
  });

  const {
    data: sources,
    isLoading: isLoadingSources,
    isError: isErrorSources,
  } = useQuery({
    queryKey: TRAINING_KEYS.sources({
      page: sourcePage,
      perPage: sourcePerPage,
      search: debouncedSourceSearch,
    }),
    queryFn: () =>
      trainingService.listSources({
        page: sourcePage,
        perPage: sourcePerPage,
        search: debouncedSourceSearch,
      }),
    enabled: canReadSources,
  });

  if (!hasAnyAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Training Data</h1>
          <p className="text-muted-foreground">
            Upload and manage datasets for model training and retraining
          </p>
        </div>
        <NoPermission />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Training Data</h1>
          <p className="text-muted-foreground">
            Upload and manage datasets for model training and retraining
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          {canReadDatasets && (
            <TabsTrigger value="datasets">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Datasets
            </TabsTrigger>
          )}
          {canReadSources && (
            <TabsTrigger value="data-sources">
              <Building2 className="mr-2 h-4 w-4" /> Data Sources
            </TabsTrigger>
          )}
        </TabsList>

        {/* ==================== DATASETS TAB ==================== */}
        <TabsContent value="datasets" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Uploads
                </CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingDatasets ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    (datasets?.total ?? "—")
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Data Sources
                </CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingSources ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    (sources?.total ?? "—")
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Latest Upload
                </CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {isLoadingDatasets ? (
                  <>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-1.5 h-3 w-20" />
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium truncate">
                      {datasets?.items[0]?.fileName ?? "—"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {datasets?.items[0]?.status ?? ""}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Quality
                </CardTitle>
                <Star className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isLoadingDatasets ? (
                    <Skeleton className="h-7 w-16" />
                  ) : datasets?.items &&
                    datasets?.items?.some((u) => u.qualityScore > 0) ? (
                    `${Math.round(datasets?.items?.filter((u) => u.qualityScore > 0).reduce((a, b) => a + (b.qualityScore || 0), 0) / (datasets?.items?.filter((u) => u.qualityScore > 0).length || 1))}%`
                  ) : (
                    "—"
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Uploaded Datasets</CardTitle>
                  <CardDescription>
                    Training data uploads from registered sources
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search datasets..."
                      className="pl-9"
                      value={datasetSearch}
                      onChange={(e) => {
                        setDatasetSearch(e.target.value);
                        setDatasetPage(1);
                      }}
                    />
                  </div>
                  {canUpload && (
                    <Button
                      onClick={() => setIsUploadOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <UploadCloud className="mr-2 h-4 w-4" /> Upload Dataset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TrainingUploadTable
                data={datasets}
                isLoading={isLoadingDatasets}
                isError={isErrorDatasets}
                page={datasetPage}
                onPageChange={setDatasetPage}
                perPage={datasetPerPage}
                onPerPageChange={(n) => {
                  setDatasetPerPage(n);
                  setDatasetPage(1);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DATA SOURCES TAB ==================== */}
        <TabsContent value="data-sources" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Data Sources</CardTitle>
                  <CardDescription>
                    Registered institutions and data providers
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sources..."
                      className="pl-9"
                      value={sourceSearch}
                      onChange={(e) => {
                        setSourceSearch(e.target.value);
                        setSourcePage(1);
                      }}
                    />
                  </div>
                  {canManageSources && (
                    <Button
                      onClick={() => setIsAddSourceOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Source
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataSourceTable
                data={sources}
                isLoading={isLoadingSources}
                isError={isErrorSources}
                page={sourcePage}
                onPageChange={setSourcePage}
                perPage={sourcePerPage}
                onPerPageChange={(n) => {
                  setSourcePerPage(n);
                  setSourcePage(1);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <UploadDatasetModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
      <AddDataSourceModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
      />
    </div>
  );
}
