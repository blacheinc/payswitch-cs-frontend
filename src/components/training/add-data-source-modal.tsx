"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trainingService, TRAINING_KEYS } from "@/lib/training-service";
import type { CreateDataSourceRequest } from "@/types/training-type";
import { INDUSTRY_TYPE_ENUM } from "@/lib/constant";

interface AddDataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDataSourceModal({
  isOpen,
  onClose,
}: AddDataSourceModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateDataSourceRequest>({
    name: "",
    shortCode: "",
    sourceType: "bank",
    description: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDataSourceRequest) =>
      trainingService.createSource(data),
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
    setFormData({
      name: "",
      shortCode: "",
      sourceType: "bank",
      description: "",
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.shortCode) return;
    createMutation.mutate(formData);
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Data Source</DialogTitle>
            <DialogDescription>
              Register a new institution or channel as a data source.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. GCB Bank"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    name,
                    shortCode: generateShortCode(name),
                  }));
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortCode">Short Code</Label>
              <Input
                id="shortCode"
                placeholder="e.g. gcb-bank"
                value={formData.shortCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shortCode: e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-"),
                  }))
                }
                required
              />
              <p className="text-[10px] text-muted-foreground">
                URL-safe unique identifier for this source.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Source Type</Label>
              <Select
                value={formData.sourceType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, sourceType: value }))
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(INDUSTRY_TYPE_ENUM).map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe this data source..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="max-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.name ||
                !formData.shortCode ||
                createMutation.isPending
              }
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
