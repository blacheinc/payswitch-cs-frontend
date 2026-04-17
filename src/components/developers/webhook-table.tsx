"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MoreVertical, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  webhookService,
  WEBHOOK_KEYS,
  type WebhookResponse,
} from "@/lib/developer-service";
import { formatDate } from "@/lib/utils";

interface WebhookTableProps {
  data: WebhookResponse[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEditWebhook: (webhook: WebhookResponse) => void;
  onDeleteWebhook: (webhook: { id: string; url: string }) => void;
}

export function WebhookTable({
  data,
  isLoading,
  isError,
  onEditWebhook,
  onDeleteWebhook,
}: WebhookTableProps) {
  const queryClient = useQueryClient();
  const webhooks = data ?? [];

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      webhookService.update(id, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.all });
      toast.success(
        variables.isActive ? "Webhook activated" : "Webhook deactivated",
      );
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update webhook");
    },
  });

  const handleTest = (id: string) => {
    toast.success(
      "Test event sent! Check your endpoint for a score.completed payload.",
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load webhooks. Please try again.
      </div>
    );
  }

  if (webhooks.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableEmpty
            colSpan={5}
            title="No webhook endpoints"
            description="Register a new endpoint to receive scoring webhook events."
          />
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Endpoint URL</TableHead>
          <TableHead>Events</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {webhooks.map((wh) => (
          <TableRow key={wh.id}>
            <TableCell className="max-w-[220px]">
              <div className="flex flex-col">
                <span className="text-xs truncate">{wh.url}</span>
                {wh.description && (
                  <span className="text-xs text-muted-foreground truncate">
                    {wh.description}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {wh.events.map((ev) => (
                  <Badge key={ev} variant="secondary" className="text-[10px]">
                    {ev}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={wh.isActive}
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({
                      id: wh.id,
                      isActive: checked,
                    })
                  }
                />
                <span className="text-xs text-muted-foreground">
                  {wh.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(wh.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditWebhook(wh)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTest(wh.id)}>
                    <Send className="mr-2 h-4 w-4" />
                    Test
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteWebhook({ id: wh.id, url: wh.url })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
