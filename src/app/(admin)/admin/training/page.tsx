"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  Plus,
  Search,
  Download,
  Eye,
  Building2,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

import type { TrainingDataUpload } from "@/types/training";
import type { DataSource } from "@/types/training";

// Accepted file extensions
const ACCEPTED_EXTENSIONS = ".csv,.json,.xlsx,.tsv,.txt";

// ==================== MOCK DATA (will be replaced by API calls) ====================

const mockDataSources: DataSource[] = [
  {
    id: "ds_src_001",
    name: "Fidelity Bank",
    short_code: "FID",
    source_type: "bank",
    description: "Fidelity Bank Ghana loan and credit data",
    total_uploads: 3,
    last_upload_at: "2025-02-08T10:30:00Z",
    created_at: "2024-09-15T00:00:00Z",
    updated_at: "2025-02-08T10:30:00Z",
  },
  {
    id: "ds_src_002",
    name: "GCB Bank",
    short_code: "GCB",
    source_type: "bank",
    description: "Ghana Commercial Bank credit portfolio",
    total_uploads: 2,
    last_upload_at: "2025-02-05T14:15:00Z",
    created_at: "2024-10-02T00:00:00Z",
    updated_at: "2025-02-05T14:15:00Z",
  },
  {
    id: "ds_src_003",
    name: "Ecobank Ghana",
    short_code: "ECO",
    source_type: "bank",
    description: "Ecobank Ghana performance and loan data",
    total_uploads: 1,
    last_upload_at: "2025-02-10T09:00:00Z",
    created_at: "2024-11-18T00:00:00Z",
    updated_at: "2025-02-10T09:00:00Z",
  },
  {
    id: "ds_src_004",
    name: "Absa Bank Ghana",
    short_code: "ABSA",
    source_type: "bank",
    description: "Absa Bank Ghana historical loan records",
    total_uploads: 1,
    last_upload_at: "2025-01-28T16:45:00Z",
    created_at: "2025-01-05T00:00:00Z",
    updated_at: "2025-01-28T16:45:00Z",
  },
  {
    id: "ds_src_005",
    name: "Stanbic Bank",
    short_code: "STB",
    source_type: "bank",
    description: "Stanbic Bank quarterly default data",
    total_uploads: 1,
    last_upload_at: "2025-02-01T11:20:00Z",
    created_at: "2025-01-20T00:00:00Z",
    updated_at: "2025-02-01T11:20:00Z",
  },
];

const mockUploads: TrainingDataUpload[] = [
  {
    id: "upl_001",
    data_source_id: "ds_src_001",
    data_source_name: "Fidelity Bank",
    status: "processed",
    file_name: "fidelity_loans_2024_q4.csv",
    file_format: "csv",
    file_size_bytes: 13003980,
    record_count: 45230,
    valid_record_count: 44980,
    features_mapped: 16,
    target_features_total: 18,
    quality_score: 92,
    quality_report: {},
    rejection_reason: "",
    error_message: "",
    uploaded_by_id: "admin_001",
    approved_by_id: "admin_002",
    approved_at: "2025-02-08T12:00:00Z",
    completed_at: "2025-02-08T12:30:00Z",
    created_at: "2025-02-08T10:30:00Z",
    updated_at: "2025-02-08T12:30:00Z",
  },
  {
    id: "upl_002",
    data_source_id: "ds_src_002",
    data_source_name: "GCB Bank",
    status: "processed",
    file_name: "gcb_credit_data_jan2025.xlsx",
    file_format: "xlsx",
    file_size_bytes: 9122611,
    record_count: 28100,
    valid_record_count: 27850,
    features_mapped: 18,
    target_features_total: 18,
    quality_score: 98,
    quality_report: {},
    rejection_reason: "",
    error_message: "",
    uploaded_by_id: "admin_001",
    approved_by_id: "admin_002",
    approved_at: "2025-02-05T16:00:00Z",
    completed_at: "2025-02-05T16:45:00Z",
    created_at: "2025-02-05T14:15:00Z",
    updated_at: "2025-02-05T16:45:00Z",
  },
  {
    id: "upl_003",
    data_source_id: "ds_src_003",
    data_source_name: "Ecobank Ghana",
    status: "processing",
    file_name: "ecobank_performance_feb.json",
    file_format: "json",
    file_size_bytes: 3355443,
    record_count: 12450,
    valid_record_count: 0,
    features_mapped: 0,
    target_features_total: 18,
    quality_score: 0,
    quality_report: {},
    rejection_reason: "",
    error_message: "",
    uploaded_by_id: "admin_001",
    approved_by_id: "",
    approved_at: "",
    completed_at: "",
    created_at: "2025-02-10T09:00:00Z",
    updated_at: "2025-02-10T09:00:00Z",
  },
  {
    id: "upl_004",
    data_source_id: "ds_src_004",
    data_source_name: "Absa Bank Ghana",
    status: "processed",
    file_name: "absa_historical_loans.tsv",
    file_format: "tsv",
    file_size_bytes: 23173530,
    record_count: 67800,
    valid_record_count: 67200,
    features_mapped: 15,
    target_features_total: 18,
    quality_score: 85,
    quality_report: {},
    rejection_reason: "",
    error_message: "",
    uploaded_by_id: "admin_001",
    approved_by_id: "admin_002",
    approved_at: "2025-01-28T18:00:00Z",
    completed_at: "2025-01-28T19:15:00Z",
    created_at: "2025-01-28T16:45:00Z",
    updated_at: "2025-01-28T19:15:00Z",
  },
  {
    id: "upl_005",
    data_source_id: "ds_src_005",
    data_source_name: "Stanbic Bank",
    status: "failed",
    file_name: "stanbic_q1_defaults.csv",
    file_format: "csv",
    file_size_bytes: 1887436,
    record_count: 5400,
    valid_record_count: 0,
    features_mapped: 0,
    target_features_total: 18,
    quality_score: 0,
    quality_report: {},
    rejection_reason: "Schema validation failed",
    error_message: "Missing required columns: loan_amount, repayment_status",
    uploaded_by_id: "admin_001",
    approved_by_id: "",
    approved_at: "",
    completed_at: "",
    created_at: "2025-02-01T11:20:00Z",
    updated_at: "2025-02-01T11:45:00Z",
  },
];

// ==================== COMPONENT ====================

export default function TrainingPage() {
  const [uploads, setUploads] = useState<TrainingDataUpload[]>(mockUploads);
  const [dataSources, setDataSources] = useState<DataSource[]>(mockDataSources);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add Source dialog state
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceShortCode, setNewSourceShortCode] = useState("");
  const [newSourceType, setNewSourceType] = useState("");
  const [newSourceDescription, setNewSourceDescription] = useState("");

  // ==================== Handlers ====================

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "json", "xlsx", "tsv", "txt"].includes(ext || "")) {
        toast.error(
          "Unsupported file type. Please use CSV, JSON, XLSX, TSV, or TXT.",
        );
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (!selectedSourceId) {
      toast.error("Please select a data source.");
      return;
    }

    const source = dataSources.find((s) => s.id === selectedSourceId);
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "csv";

    // Mock: create a new upload entry (will be replaced by API call)
    const newUpload: TrainingDataUpload = {
      id: `upl_${Date.now()}`,
      data_source_id: selectedSourceId,
      data_source_name: source?.name || "",
      status: "processing",
      file_name: selectedFile.name,
      file_format: ext,
      file_size_bytes: selectedFile.size,
      record_count: 0,
      valid_record_count: 0,
      features_mapped: 0,
      target_features_total: 18,
      quality_score: 0,
      quality_report: {},
      rejection_reason: "",
      error_message: "",
      uploaded_by_id: "admin_001",
      approved_by_id: "",
      approved_at: "",
      completed_at: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUploads([newUpload, ...uploads]);
    setSelectedFile(null);
    setSelectedSourceId("");
    setIsUploadOpen(false);
    toast.success(
      `"${selectedFile.name}" uploaded successfully. Processing...`,
    );
  };

  const handleDeleteUpload = (id: string) => {
    setUploads(uploads.filter((u) => u.id !== id));
    toast.success("Dataset removed.");
  };

  const handleAddSource = () => {
    if (!newSourceName.trim()) {
      toast.error("Please enter a source name.");
      return;
    }
    if (!newSourceShortCode.trim()) {
      toast.error("Please enter a short code.");
      return;
    }
    if (
      dataSources.some(
        (s) => s.name.toLowerCase() === newSourceName.trim().toLowerCase(),
      )
    ) {
      toast.error("This data source already exists.");
      return;
    }

    // Mock: create a new data source (will be replaced by API call)
    const newSource: DataSource = {
      id: `ds_src_${Date.now()}`,
      name: newSourceName.trim(),
      short_code: newSourceShortCode.trim().toUpperCase(),
      source_type: newSourceType.trim() || "bank",
      description: newSourceDescription.trim(),
      total_uploads: 0,
      last_upload_at: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDataSources([...dataSources, newSource]);
    setNewSourceName("");
    setNewSourceShortCode("");
    setNewSourceType("");
    setNewSourceDescription("");
    setIsAddSourceOpen(false);
    toast.success(`"${newSource.name}" added as a data source.`);
  };

  const handleDeleteSource = (id: string) => {
    setDataSources(dataSources.filter((s) => s.id !== id));
    toast.success("Data source removed.");
  };

  // ==================== Status Badge ====================

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 gap-1"
          >
            <CheckCircle className="h-3 w-3" /> Processed
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 gap-1"
          >
            <Clock className="h-3 w-3 animate-spin" /> Processing
          </Badge>
        );
      case "pending_review":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 gap-1"
          >
            <Clock className="h-3 w-3" /> Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
          >
            <ShieldCheck className="h-3 w-3" /> Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200 gap-1"
          >
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 gap-1"
          >
            <AlertCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            {status}
          </Badge>
        );
    }
  };

  // ==================== Computed Values ====================

  const filteredUploads = uploads.filter(
    (u) =>
      u.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.data_source_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredSources = dataSources.filter((s) =>
    s.name.toLowerCase().includes(sourceSearchQuery.toLowerCase()),
  );

  const totalRecords = uploads
    .filter((u) => u.status === "processed")
    .reduce((sum, u) => sum + u.record_count, 0);

  const avgQualityScore =
    uploads.filter((u) => u.quality_score > 0).length > 0
      ? Math.round(
          uploads
            .filter((u) => u.quality_score > 0)
            .reduce((sum, u) => sum + u.quality_score, 0) /
            uploads.filter((u) => u.quality_score > 0).length,
        )
      : 0;

  const getQualityColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  // ==================== RENDER ====================

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

      <Tabs defaultValue="datasets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="datasets">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Datasets
          </TabsTrigger>
          <TabsTrigger value="data-sources">
            <Building2 className="mr-2 h-4 w-4" /> Data Sources
          </TabsTrigger>
        </TabsList>

        {/* ==================== DATASETS TAB ==================== */}
        <TabsContent value="datasets" className="space-y-6">
          {/* Upload button */}
          <div className="flex justify-end">
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload Dataset
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Upload Training Data</DialogTitle>
                  <DialogDescription>
                    Upload a dataset file for model training. Supported formats:
                    CSV, JSON, XLSX, TSV, TXT.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* File Upload Zone */}
                  <div className="space-y-2">
                    <Label>File *</Label>
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_EXTENSIONS}
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      {selectedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileSpreadsheet className="h-8 w-8 text-primary" />
                          <div className="text-left">
                            <p className="text-sm font-medium">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to browse or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            CSV, JSON, XLSX, TSV, TXT
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Source Selector */}
                  <div className="space-y-2">
                    <Label>Data Source *</Label>
                    <Select
                      value={selectedSourceId}
                      onValueChange={setSelectedSourceId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            <span className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">
                                {source.short_code}
                              </span>
                              {source.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || !selectedSourceId}
                  >
                    Upload &amp; Process
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

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
                <div className="text-2xl font-bold">{uploads.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Records
                </CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalRecords.toLocaleString()}
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
                <div className="text-2xl font-bold">{dataSources.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Quality Score
                </CardTitle>
                <Star className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getQualityColor(avgQualityScore)}`}
                >
                  {avgQualityScore > 0 ? `${avgQualityScore}%` : "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Uploads Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Uploaded Datasets</CardTitle>
                  <CardDescription>
                    Training data uploads from registered sources
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search datasets..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredUploads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No datasets found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUploads.map((upload) => (
                      <TableRow key={upload.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium max-w-[200px] truncate">
                              {upload.file_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {upload.data_source_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {upload.file_format.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(upload.file_size_bytes)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            {upload.record_count > 0
                              ? upload.record_count.toLocaleString()
                              : "—"}
                            {upload.valid_record_count > 0 &&
                              upload.valid_record_count !==
                                upload.record_count && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({upload.valid_record_count.toLocaleString()}{" "}
                                  valid)
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {upload.quality_score > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-sm font-medium ${getQualityColor(upload.quality_score)}`}
                                >
                                  {upload.quality_score}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span>
                                  {upload.features_mapped}/
                                  {upload.target_features_total} features
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(upload.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(upload.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Preview">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Dataset
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &quot;
                                    {upload.file_name}&quot;? This action cannot
                                    be undone and may affect model training
                                    pipelines.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteUpload(upload.id)
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DATA SOURCES TAB ==================== */}
        <TabsContent value="data-sources" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Registered Data Sources</CardTitle>
                  <CardDescription>
                    Banks and financial institutions providing training data
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sources..."
                      className="pl-9"
                      value={sourceSearchQuery}
                      onChange={(e) => setSourceSearchQuery(e.target.value)}
                    />
                  </div>
                  <Dialog
                    open={isAddSourceOpen}
                    onOpenChange={setIsAddSourceOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Source
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                      <DialogHeader>
                        <DialogTitle>Add Data Source</DialogTitle>
                        <DialogDescription>
                          Register a new bank or financial institution as a
                          training data source.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input
                            placeholder="e.g. CalBank Limited"
                            value={newSourceName}
                            onChange={(e) => setNewSourceName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Short Code *</Label>
                          <Input
                            placeholder="e.g. CAL"
                            value={newSourceShortCode}
                            onChange={(e) =>
                              setNewSourceShortCode(e.target.value)
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            A unique abbreviation for this source
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Source Type</Label>
                          <Select
                            value={newSourceType}
                            onValueChange={setNewSourceType}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank">Bank</SelectItem>
                              <SelectItem value="microfinance">
                                Microfinance
                              </SelectItem>
                              <SelectItem value="fintech">Fintech</SelectItem>
                              <SelectItem value="credit_bureau">
                                Credit Bureau
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="Brief description of the data source"
                            value={newSourceDescription}
                            onChange={(e) =>
                              setNewSourceDescription(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleAddSource}
                          disabled={
                            !newSourceName.trim() || !newSourceShortCode.trim()
                          }
                        >
                          Add Source
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No data sources found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Short Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Total Uploads</TableHead>
                      <TableHead>Last Upload</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{source.name}</span>
                              {source.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {source.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {source.short_code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {source.source_type.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {source.total_uploads} upload
                            {source.total_uploads !== 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {source.last_upload_at
                            ? new Date(
                                source.last_upload_at,
                              ).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(source.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                title="Remove source"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Data Source
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove &quot;
                                  {source.name}&quot;? Existing datasets from
                                  this source will not be deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSource(source.id)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
