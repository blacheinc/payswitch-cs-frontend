"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  apiKeyService,
  API_KEY_KEYS,
  type ApiKeyCreatedResponse,
} from "@/lib/developer-service";

interface GenerateApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateApiKeyModal({
  open,
  onOpenChange,
}: GenerateApiKeyModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("sandbox");
  const [generatedKey, setGeneratedKey] =
    useState<ApiKeyCreatedResponse | null>(null);
  const [showKey, setShowKey] = useState(false);

  const resetForm = () => {
    setName("");
    setEnvironment("sandbox");
    setGeneratedKey(null);
    setShowKey(false);
  };

  const createMutation = useMutation({
    mutationFn: apiKeyService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: API_KEY_KEYS.all });
      setGeneratedKey(data);
      toast.success("API key generated");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to generate API key");
    },
  });

  const handleGenerate = () => {
    createMutation.mutate({ name, environment });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        {!generatedKey ? (
          <>
            <DialogHeader>
              <DialogTitle>Generate API Key</DialogTitle>
              <DialogDescription>
                Create a new key to authenticate your API requests.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">
                  Key Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="key-name"
                  placeholder="e.g. ERP Integration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-env">Environment</Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                    <SelectItem value="production">
                      Production (Real Data)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!name || createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4 py-4">
            <DialogHeader>
              <DialogTitle>Key Generated</DialogTitle>
            </DialogHeader>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {generatedKey?.message}
            </div>
            <div className="relative">
              <Input
                readOnly
                value={generatedKey.key}
                type={showKey ? "text" : "password"}
                className="pr-20 font-mono text-xs"
              />
              <div className="absolute right-1 top-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(generatedKey.key)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
