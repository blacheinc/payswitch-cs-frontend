"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  Download,
  X,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Send,
  Trash2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROUTES, PERMISSION_CODES } from "@/lib/constant";
import {
  BATCH_KEYS,
  scoreService,
  type BatchItemPayload,
  type BatchJobStatus,
} from "@/lib/score-service";
import { batchItemSchema } from "@/lib/schemas/batch-scoring";
import { usePermissions } from "@/hooks/use-permissions";
import { BatchJobsTable } from "@/components/score-requests/batch-jobs-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// =============================================================================
// CSV parsing — minimal tolerant parser for the expected template columns.
// =============================================================================

const TEMPLATE_HEADERS = [
  "Full Name",
  "Date of Birth",
  "Identification",
  "Phone Number",
  "Account Number",
  "Enquiry Reason",
] as const;

// Header variants → canonical field name
const HEADER_ALIASES: Record<string, keyof BatchItemPayload> = {
  full_name: "fullName",
  fullname: "fullName",
  name: "fullName",
  date_of_birth: "dateOfBirth",
  dateofbirth: "dateOfBirth",
  dob: "dateOfBirth",
  identification: "identification",
  national_id: "identification",
  nationalid: "identification",
  ghana_card: "identification",
  phone_number: "phoneNumber",
  phonenumber: "phoneNumber",
  phone: "phoneNumber",
  account_number: "accountNumber",
  accountnumber: "accountNumber",
  account: "accountNumber",
  enquiry_reason: "enquiryReason",
  enquiryreason: "enquiryReason",
  reason: "enquiryReason",
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

interface RowError {
  field: keyof BatchItemPayload | "_root";
  message: string;
}

interface ParsedRow {
  rowNumber: number;
  item: BatchItemPayload;
  errors: RowError[];
}

function validateRow(item: BatchItemPayload): RowError[] {
  const result = batchItemSchema.safeParse(item);
  if (result.success) return [];
  return result.error.issues.map((iss) => ({
    field: (iss.path[0] as keyof BatchItemPayload) ?? "_root",
    message: iss.message,
  }));
}

const FIELD_LABELS: Record<keyof BatchItemPayload, string> = {
  fullName: "Full name",
  dateOfBirth: "Date of birth",
  identification: "Identification",
  phoneNumber: "Phone number",
  accountNumber: "Account number",
  enquiryReason: "Enquiry reason",
};

function parseCsv(text: string): {
  rows: ParsedRow[];
  unknownHeaders: string[];
  missingHeaders: string[];
} {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { rows: [], unknownHeaders: [], missingHeaders: [] };
  }

  const originalHeaders = splitCsvLine(lines[0]);
  const normalizedHeaders = originalHeaders.map((h) =>
    h.toLowerCase().replace(/\s+/g, "_"),
  );
  const unknownHeaders: string[] = [];
  const headerFields: (keyof BatchItemPayload | null)[] = normalizedHeaders.map(
    (h, idx) => {
      const mapped = HEADER_ALIASES[h];
      if (!mapped) {
        unknownHeaders.push(originalHeaders[idx] || h);
        return null;
      }
      return mapped;
    },
  );

  const presentFields = new Set(
    headerFields.filter((f): f is keyof BatchItemPayload => f !== null),
  );
  const missingHeaders: string[] = [];
  if (!presentFields.has("dateOfBirth")) missingHeaders.push("Date of Birth");

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const item: BatchItemPayload = { dateOfBirth: "" };
    headerFields.forEach((field, idx) => {
      if (!field) return;
      const value = (cells[idx] ?? "").trim();
      if (value) (item as unknown as Record<string, string>)[field] = value;
    });

    rows.push({
      rowNumber: i,
      item,
      errors: validateRow(item),
    });
  }

  return { rows, unknownHeaders, missingHeaders };
}

function buildTemplateCsv(): string {
  const sample = [
    "John Doe",
    "1990-05-15",
    "3611003033",
    "0244123456",
    "",
    "Application for credit by a borrower",
  ];
  return [TEMPLATE_HEADERS.join(","), sample.join(",")].join("\n");
}

function downloadTemplate() {
  const blob = new Blob([buildTemplateCsv()], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "batch_scoring_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// Page
// =============================================================================

const STATUS_OPTIONS: { value: BatchJobStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "queued", label: "Queued" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BulkScoreRequestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headerWarnings, setHeaderWarnings] = useState<{
    unknown: string[];
    missing: string[];
  }>({ unknown: [], missing: [] });

  const [historyPage, setHistoryPage] = useState(1);
  const [historyStatus, setHistoryStatus] = useState<BatchJobStatus | "all">(
    "all",
  );
  const [historyPageSize, setHistoryPageSize] = useState(10);

  const canCreate = can(PERMISSION_CODES.BATCH_SCORING.CREATE);
  const canList = can(PERMISSION_CODES.BATCH_SCORING.LIST);

  // --- Jobs history ---
  const historyParams = {
    page: historyPage,
    pageSize: historyPageSize,
    status: historyStatus,
  };
  const historyQuery = useQuery({
    queryKey: BATCH_KEYS.list(historyParams),
    queryFn: () => scoreService.listBatchJobs(historyParams),
    enabled: canList,
  });

  // --- Submit mutation ---
  const submitMutation = useMutation({
    mutationFn: (items: BatchItemPayload[]) =>
      scoreService.submitBatch({ items }),
    onSuccess: (res) => {
      toast.success(`Batch ${res.jobId} queued (${res.total} items)`);
      queryClient.invalidateQueries({ queryKey: BATCH_KEYS.all });
      router.push(`${ROUTES.ORG.SCORE_REQUESTS}/bulk/${res.jobId}`);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number }; message?: string };
      if (err?.response?.status === 503) {
        toast.error("Queue unavailable — please retry in a moment.");
      } else {
        toast.error(err?.message || "Failed to submit batch job.");
      }
    },
  });

  // --- File handling ---
  const processFile = async (f: File) => {
    if (!/\.csv$/i.test(f.name)) {
      toast.error("Only .csv files are supported.");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error("File too large. Maximum 2MB.");
      return;
    }
    const text = await f.text();
    const parsed = parseCsv(text);
    setFile(f);
    setRows(parsed.rows);
    setHeaderWarnings({
      unknown: parsed.unknownHeaders,
      missing: parsed.missingHeaders,
    });

    if (parsed.rows.length === 0) {
      toast.warning("No rows found in file.");
    } else if (parsed.rows.length > 100) {
      toast.error(
        `${parsed.rows.length} rows found — the 100-applicant limit is exceeded. Remove extra rows before submitting.`,
      );
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) await processFile(f);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await processFile(f);
    e.target.value = "";
  };

  const clearFile = () => {
    setFile(null);
    setRows([]);
    setHeaderWarnings({ unknown: [], missing: [] });
  };

  // --- Derived counts ---
  const { validCount, invalidCount, submittableRows, exceedsLimit } = useMemo(
    () => {
      const valid = rows.filter((r) => r.errors.length === 0);
      return {
        validCount: valid.length,
        invalidCount: rows.length - valid.length,
        submittableRows: valid,
        exceedsLimit: rows.length > 100,
      };
    },
    [rows],
  );

  const updateRowField = (
    rowNumber: number,
    field: keyof BatchItemPayload,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        const nextItem: BatchItemPayload = {
          ...r.item,
          [field]: value,
        };
        return { ...r, item: nextItem, errors: validateRow(nextItem) };
      }),
    );
  };

  const removeRow = (rowNumber: number) => {
    setRows((prev) => prev.filter((r) => r.rowNumber !== rowNumber));
  };

  const handleSubmit = () => {
    if (exceedsLimit) {
      toast.error(
        `You have ${rows.length} rows. Remove ${rows.length - 100} or more before submitting.`,
      );
      return;
    }
    if (submittableRows.length === 0) {
      toast.error("No valid rows to submit.");
      return;
    }
    submitMutation.mutate(submittableRows.map((r) => r.item));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.ORG.SCORE_REQUESTS}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Batch Score Requests</h1>
          <p className="text-muted-foreground">
            Upload a CSV to score up to 100 applicants in a single job.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>
              Required column: <strong>Date of Birth</strong> (YYYY-MM-DD). Max
              100 rows, 2MB file size.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 rounded-full bg-muted">
                  <UploadCloud className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Drag & drop your CSV, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use the template below to ensure your file parses correctly
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            </div>

            {file && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB · {rows.length} row
                      {rows.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Guidelines</CardTitle>
            <CardDescription>
              Bureau data will be automatically retrieved for each applicant
              during processing; you are not required to provide bureau details
              in your upload.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Columns</p>
                <p className="text-xs text-muted-foreground">
                  Full Name, Date of Birth, Identification, Phone Number,
                  Account Number, Enquiry Reason.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Date format</p>
                <p className="text-xs text-muted-foreground">
                  Use YYYY-MM-DD for Date of Birth.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Match rule</p>
                <p className="text-xs text-muted-foreground">
                  Each row must include at least one of Full Name,
                  Identification, or Phone Number.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={downloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parsed preview */}
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  {rows.length} row{rows.length === 1 ? "" : "s"} · {validCount}{" "}
                  valid
                  {invalidCount > 0 && ` · ${invalidCount} invalid`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearFile}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                {canCreate && (
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      submitMutation.isPending ||
                      submittableRows.length === 0 ||
                      exceedsLimit
                    }
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit {submittableRows.length} applicant
                        {submittableRows.length === 1 ? "" : "s"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {exceedsLimit && (
              <div className="flex items-start gap-2 rounded-lg border border-red-300/60 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    Batch size exceeds the 100-applicant limit.
                  </p>
                  <p>
                    You have {rows.length} rows — remove at least{" "}
                    {rows.length - 100} before submitting.
                  </p>
                </div>
              </div>
            )}

            {(headerWarnings.missing.length > 0 ||
              headerWarnings.unknown.length > 0) && (
              <div className="flex items-start gap-2 rounded-lg border border-yellow-300/50 bg-yellow-50 dark:bg-yellow-900/10 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {headerWarnings.missing.length > 0 && (
                    <p>
                      Missing required column:{" "}
                      <strong>{headerWarnings.missing.join(", ")}</strong>
                    </p>
                  )}
                  {headerWarnings.unknown.length > 0 && (
                    <p>
                      Unrecognised columns (ignored):{" "}
                      <strong>
                        &ldquo;{headerWarnings.unknown.join('", "')}&rdquo;
                      </strong>
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground flex items-center">
              <Info className="w-4 h-4 mr-1" /> Please review and correct any
              highlighted fields below prior to submission. Validation results
              update in real time as you make changes.
            </p>

            <TooltipProvider delayDuration={150}>
              <div className="rounded-md border max-h-[480px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-14">Row</TableHead>
                      <TableHead className="min-w-[160px]">Full Name</TableHead>
                      <TableHead className="min-w-[140px]">
                        Date of Birth
                      </TableHead>
                      <TableHead className="min-w-[140px]">
                        Identification
                      </TableHead>
                      <TableHead className="min-w-[140px]">
                        Phone Number
                      </TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => {
                      const errorsByField = new Map<string, string>();
                      r.errors.forEach((e) => {
                        if (!errorsByField.has(e.field)) {
                          errorsByField.set(e.field, e.message);
                        }
                      });
                      const rootError = errorsByField.get("_root");
                      const allErrorMessages = r.errors.map((e) =>
                        e.field === "_root"
                          ? e.message
                          : `${FIELD_LABELS[e.field as keyof BatchItemPayload] ?? e.field}: ${e.message}`,
                      );

                      return (
                        <TableRow
                          key={r.rowNumber}
                          className={
                            r.errors.length > 0
                              ? "bg-red-50/40 dark:bg-red-950/10"
                              : undefined
                          }
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground align-top pt-3">
                            {r.rowNumber}
                          </TableCell>
                          <EditableCell
                            value={r.item.fullName ?? ""}
                            placeholder="Kwame Asante"
                            error={errorsByField.get("fullName")}
                            onChange={(v) =>
                              updateRowField(r.rowNumber, "fullName", v)
                            }
                          />
                          <EditableCell
                            value={r.item.dateOfBirth ?? ""}
                            placeholder="YYYY-MM-DD"
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            error={errorsByField.get("dateOfBirth")}
                            onChange={(v) =>
                              updateRowField(r.rowNumber, "dateOfBirth", v)
                            }
                          />
                          <EditableCell
                            value={r.item.identification ?? ""}
                            placeholder="Ghana Card / ID"
                            error={errorsByField.get("identification")}
                            onChange={(v) =>
                              updateRowField(r.rowNumber, "identification", v)
                            }
                          />
                          <EditableCell
                            value={r.item.phoneNumber ?? ""}
                            placeholder="0244123456"
                            error={errorsByField.get("phoneNumber")}
                            onChange={(v) =>
                              updateRowField(r.rowNumber, "phoneNumber", v)
                            }
                          />
                          <TableCell className="align-top pt-3">
                            {r.errors.length === 0 ? (
                              <Badge variant="success">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Valid
                              </Badge>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="inline-flex flex-col items-start gap-1 cursor-help">
                                    <Badge variant="destructive">
                                      <AlertTriangle className="mr-1 h-3 w-3" />
                                      {r.errors.length} issue
                                      {r.errors.length === 1 ? "" : "s"}
                                    </Badge>
                                    {rootError && (
                                      <p className="text-xs text-red-600 leading-tight">
                                        {rootError}
                                      </p>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <ul className="text-xs space-y-1 list-disc pl-4">
                                    {allErrorMessages.map((m, idx) => (
                                      <li key={idx}>{m}</li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell className="align-top pt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeRow(r.rowNumber)}
                              title="Remove row"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {canList && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle>Batch History</CardTitle>
                <CardDescription>
                  Previous batch jobs submitted by your organisation.
                </CardDescription>
              </div>
              <Select
                value={historyStatus}
                onValueChange={(v) => {
                  setHistoryStatus(v as BatchJobStatus | "all");
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <BatchJobsTable
              jobs={historyQuery.data?.items ?? []}
              total={historyQuery.data?.total ?? 0}
              page={historyPage}
              pageSize={historyPageSize}
              isLoading={historyQuery.isLoading}
              isError={historyQuery.isError}
              onPageChange={setHistoryPage}
              onPageSizeChange={(n) => {
                setHistoryPageSize(n);
                setHistoryPage(1);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EditableCell({
  value,
  placeholder,
  error,
  onChange,
  type = "text",
  max,
}: {
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (next: string) => void;
  type?: "text" | "date";
  max?: string;
}) {
  return (
    <TableCell className="align-top py-2">
      <Input
        type={type}
        max={max}
        value={value}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
      {error && (
        <p className="text-[11px] text-red-600 mt-1 leading-tight">{error}</p>
      )}
    </TableCell>
  );
}
