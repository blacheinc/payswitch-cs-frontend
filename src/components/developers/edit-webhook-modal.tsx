"use client";

import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Globe } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

import {
  webhookService,
  WEBHOOK_KEYS,
  type WebhookResponse,
} from "@/lib/developer-service";
import {
  webhookFormSchema,
  type WebhookFormValues,
} from "@/lib/schemas/developer-training-management";

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
  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: { url: "", description: "", events: [] },
    mode: "onTouched",
  });

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
      form.reset({
        url: webhook.url,
        description: webhook.description ?? "",
        events: webhook.events,
      });
    }
  }, [webhook, form]);

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
      toast.error(error?.message || "Failed to update webhook");
    },
  });

  const handleSubmit = (values: WebhookFormValues) => {
    updateMutation.mutate({
      url: values.url,
      events: values.events,
      description: values.description || null,
    });
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4" noValidate>
          <FieldGroup className="gap-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Endpoint
            </h3>
            <Controller
              name="url"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="edit-webhook-url" required>
                    Webhook URL
                  </FieldLabel>
                  <div className="relative">
                    <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="edit-webhook-url"
                      className="pl-8"
                      placeholder="https://api.yourbank.com/webhooks/credit-score"
                      aria-invalid={fieldState.invalid}
                      autoComplete="url"
                      {...field}
                    />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="edit-webhook-desc">Description</FieldLabel>
                  <Input
                    id="edit-webhook-desc"
                    placeholder="e.g. Production scoring webhook"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <Separator />

          <Controller
            name="events"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel required>Subscribe to Events</FieldLabel>
                <div className="space-y-3">
                  {events.map((event) => {
                    const isChecked = field.value.includes(event.id);
                    const toggleEvent = () => {
                      field.onChange(
                        isChecked
                          ? field.value.filter((e) => e !== event.id)
                          : [...field.value, event.id],
                      );
                    };

                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={toggleEvent}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={toggleEvent}
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
                    );
                  })}
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
