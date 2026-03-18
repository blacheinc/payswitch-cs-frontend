"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Globe } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { webhookService, WEBHOOK_KEYS } from "@/lib/developer-service";

// Fallback event definitions used when the API events haven't loaded yet
const FALLBACK_EVENTS = [
  {
    id: "score.initiated",
    label: "Score Initiated",
    description: "Triggered when a credit score request is initiated.",
  },
  {
    id: "score.completed",
    label: "Score Completed",
    description: "Triggered when a credit score request finishes processing.",
  },
  {
    id: "score.failed",
    label: "Score Failed",
    description: "Triggered when a score request encounters an error.",
  },
];

interface AddWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddWebhookModal({ open, onOpenChange }: AddWebhookModalProps) {
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "score.completed",
  ]);

  // Fetch supported events from API — shape may vary, so we normalise
  const { data: rawEvents } = useQuery({
    queryKey: WEBHOOK_KEYS.events(),
    queryFn: webhookService.listEvents,
  });

  // Normalise: the API may return {id, label, description} or {event, name, description}
  // or another shape — we handle gracefully with fallback
  const events =
    rawEvents && rawEvents.length > 0
      ? (rawEvents as unknown as Record<string, unknown>[]).map((ev) => ({
          id: (ev.id ?? ev.event ?? ev.name ?? "") as string,
          label: (ev.label ?? ev.name ?? ev.id ?? ev.event ?? "") as string,
          description: (ev.description ?? "") as string,
        }))
      : FALLBACK_EVENTS;

  const resetForm = () => {
    setUrl("");
    setDescription("");
    setSelectedEvents(["score.completed"]);
  };

  const createMutation = useMutation({
    mutationFn: webhookService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.all });
      resetForm();
      onOpenChange(false);
      toast.success("Webhook endpoint registered");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to register webhook");
    },
  });

  const handleSubmit = () => {
    if (!url || selectedEvents.length === 0) {
      toast.error("Please provide a URL and select at least one event.");
      return;
    }
    createMutation.mutate({
      url,
      events: selectedEvents,
      description: description || undefined,
    });
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId],
    );
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
        <DialogHeader>
          <DialogTitle>Register Webhook Endpoint</DialogTitle>
          <DialogDescription>
            We will POST event payloads to this URL with an X-Signature header
            for verification.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Endpoint
            </h3>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">
                Webhook URL <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="webhook-url"
                  className="pl-8"
                  placeholder="https://api.yourbank.com/webhooks/credit-score"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-desc">Description</Label>
              <Input
                id="webhook-desc"
                placeholder="e.g. Production scoring webhook"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Subscribe to Events <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleEvent(event.id)}
                >
                  <Checkbox
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      {event.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !url || selectedEvents.length === 0 || createMutation.isPending
            }
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Register Endpoint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
