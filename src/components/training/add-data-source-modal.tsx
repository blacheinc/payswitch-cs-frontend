"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trainingService, TRAINING_KEYS } from "@/lib/training-service";
import { SOURCE_TYPE_ENUM } from "@/lib/constant";
import {
  addDataSourceSchema,
  type AddDataSourceValues,
} from "@/lib/schemas/developer-training-management";

interface AddDataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDataSourceModal({
  isOpen,
  onClose,
}: AddDataSourceModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<AddDataSourceValues>({
    resolver: zodResolver(addDataSourceSchema),
    defaultValues: {
      name: "",
      shortCode: "",
      sourceType: "bank",
      description: "",
    },
    mode: "onTouched",
  });

  const resetForm = () =>
    form.reset({
      name: "",
      shortCode: "",
      sourceType: "bank",
      description: "",
    });

  const createMutation = useMutation({
    mutationFn: trainingService.createSource,
    onSuccess: () => {
      toast.success("Data source registered successfully.");
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create data source.",
      );
    },
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (values: AddDataSourceValues) => {
    createMutation.mutate(values);
  };

  const generateShortCode = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Add Data Source</DialogTitle>
            <DialogDescription>
              Register a new institution or channel as a data source.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="grid gap-4 py-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="name" required>
                    Name
                  </FieldLabel>
                  <Input
                    id="name"
                    placeholder="e.g. GCB Bank"
                    aria-invalid={fieldState.invalid}
                    {...field}
                    onChange={(e) => {
                      const name = e.target.value;
                      field.onChange(name);
                      form.setValue("shortCode", generateShortCode(name), {
                        shouldValidate: true,
                        shouldTouch: true,
                      });
                    }}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="shortCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="shortCode" required>
                    Short Code
                  </FieldLabel>
                  <Input
                    id="shortCode"
                    placeholder="e.g. gcb-bank"
                    aria-invalid={fieldState.invalid}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      )
                    }
                  />
                  <FieldDescription>
                    URL-safe unique identifier for this source.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="sourceType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="type" required>
                    Source Type
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SOURCE_TYPE_ENUM).map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="Briefly describe this data source..."
                    className="max-h-[100px]"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="min-w-[100px]"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Source"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
