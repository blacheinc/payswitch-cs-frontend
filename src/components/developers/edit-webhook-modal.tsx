"use client";

import { useState, useEffect } from "react";
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

import {
  webhookService,
  WEBHOOK_KEYS,
  type WebhookResponse,
} from "@/lib/developer-service";

// Fallback event definitions
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

interface EditWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: WebhookResponse | null;
}

export function EditWebhookModal({
  open,
  onOpenChange,
  webhook,
}: EditWebhookModalProps) {
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Fetch supported events from API
  const { data: rawEvents } = useQuery({
    queryKey: WEBHOOK_KEYS.events(),
    queryFn: webhookService.listEvents,
  });

  const events =
    rawEvents && rawEvents.length > 0
      ? (rawEvents as unknown as Record<string, unknown>[]).map((ev) => ({
          id: (ev.id ?? ev.event ?? ev.name ?? "") as string,
          label: (ev.label ?? ev.name ?? ev.id ?? ev.event ?? "") as string,
          description: (ev.description ?? "") as string,
        }))
      : FALLBACK_EVENTS;

  // Populate form when webhook prop changes
  useEffect(() => {
    if (webhook) {
      setUrl(webhook.url);
      setDescription(webhook.description ?? "");
      setSelectedEvents(webhook.events);
    }
  }, [webhook]);

  const updateMutation = useMutation({
    mutationFn: (data: {
      url: string;
      events: string[];
      description: string | null;
    }) =>
      webhookService.update(webhook!.id, {
        url: data.url,
        events: data.events,
        description: data.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.all });
      onOpenChange(false);
      toast.success("Webhook updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update webhook");
    },
  });

  const handleSubmit = () => {
    if (!url || selectedEvents.length === 0) {
      toast.error("Please provide a URL and select at least one event.");
      return;
    }
    updateMutation.mutate({
      url,
      events: selectedEvents,
      description: description || null,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Webhook</DialogTitle>
          <DialogDescription>
            Update the endpoint URL, subscribed events, or description.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Endpoint
            </h3>
            <div className="space-y-2">
              <Label htmlFor="edit-webhook-url">
                Webhook URL <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-webhook-url"
                  className="pl-8"
                  placeholder="https://api.yourbank.com/webhooks/credit-score"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-webhook-desc">Description</Label>
              <Input
                id="edit-webhook-desc"
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
              !url || selectedEvents.length === 0 || updateMutation.isPending
            }
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
