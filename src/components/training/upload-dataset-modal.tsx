"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trainingService, TRAINING_KEYS } from "@/lib/training-service";
import {
  uploadDatasetSchema,
  type UploadDatasetValues,
} from "@/lib/schemas/developer-training-management";

interface UploadDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadDatasetModal({
  isOpen,
  onClose,
}: UploadDatasetModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<UploadDatasetValues>({
    resolver: zodResolver(uploadDatasetSchema),
    defaultValues: {
      sourceId: "",
      file: undefined as unknown as File,
    },
    mode: "onTouched",
  });

  const { data: sourcesData, isLoading: isLoadingSources } = useQuery({
    queryKey: TRAINING_KEYS.sources({ perPage: 100 }),
    queryFn: () => trainingService.listSources({ perPage: 100 }),
    enabled: isOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, sourceId }: { file: File; sourceId: string }) =>
      trainingService.uploadTrainingData(file, sourceId),
    onSuccess: () => {
      toast.success("Dataset uploaded successfully. Processing started.");
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to upload dataset.",
      );
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: File) => void,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = [".csv", ".json", ".xlsx", ".tsv", ".txt"];
      const extension = selectedFile.name
        .substring(selectedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (!validTypes.includes(extension)) {
        toast.error(
          "Invalid file type. Please upload CSV, JSON, XLSX, TSV, or TXT.",
        );
        return;
      }

      onChange(selectedFile);
    }
  };

  const handleClose = () => {
    form.reset({
      sourceId: "",
      file: undefined as unknown as File,
    });
    onClose();
  };

  const handleUpload = (values: UploadDatasetValues) => {
    uploadMutation.mutate({ file: values.file, sourceId: values.sourceId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(handleUpload)} noValidate>
          <DialogHeader>
            <DialogTitle>Upload Training Dataset</DialogTitle>
            <DialogDescription>
              Select a data source and upload a bank data file for processing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <Controller
              name="sourceId"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <FieldLabel htmlFor="source" required>
                    Data Source
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="source" aria-invalid={fieldState.invalid}>
                      <SelectValue
                        placeholder={
                          isLoadingSources ? "Loading sources..." : "Select source"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sourcesData?.items?.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </div>
              )}
            />

            <Controller
              name="file"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <FieldLabel required>Dataset File</FieldLabel>
                  {!field.value ? (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 transition-colors hover:bg-accent/50 cursor-pointer relative">
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileChange(e, field.onChange)}
                        accept=".csv,.json,.xlsx,.tsv,.txt"
                      />
                      <FileUp className="h-8 w-8 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Click to browse or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        CSV, JSON, XLSX (Max 100MB)
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/30">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-primary/10 p-2 rounded">
                          <Upload className="h-4 w-4 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate">
                            {field.value.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(field.value.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          form.setValue("file", undefined as unknown as File, {
                            shouldValidate: true,
                            shouldTouch: true,
                          })
                        }
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </div>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending} className="min-w-[100px]">
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload & Start"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
