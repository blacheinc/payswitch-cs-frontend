"use client";

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

import { webhookService, WEBHOOK_KEYS } from "@/lib/developer-service";
import {
  webhookFormSchema,
  type WebhookFormValues,
} from "@/lib/schemas/developer-training-management";

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
  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      url: "",
      description: "",
      events: ["score.completed"],
    },
    mode: "onTouched",
  });

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
    form.reset({
      url: "",
      description: "",
      events: ["score.completed"],
    });
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

  const handleSubmit = (values: WebhookFormValues) => {
    createMutation.mutate({
      url: values.url,
      events: values.events,
      description: values.description || undefined,
    });
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
                  <FieldLabel htmlFor="webhook-url" required>
                    Webhook URL
                  </FieldLabel>
                  <div className="relative">
                    <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="webhook-url"
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
                  <FieldLabel htmlFor="webhook-desc">Description</FieldLabel>
                  <Input
                    id="webhook-desc"
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Register Endpoint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
