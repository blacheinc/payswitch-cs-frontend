"use client";

import { Loader2, MoreVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { ApiKeyResponse } from "@/lib/developer-service";
import { formatDate } from "@/lib/utils";

interface ApiKeyTableProps {
  data: ApiKeyResponse[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRevokeKey: (key: { id: string; name: string }) => void;
}

export function ApiKeyTable({
  data,
  isLoading,
  isError,
  onRevokeKey,
}: ApiKeyTableProps) {
  const keys = data ?? [];

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
        Failed to load API keys. Please try again.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          <TableHead>Key Prefix</TableHead>
          <TableHead>Environment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Used</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.length === 0 ? (
          <TableEmpty
            colSpan={7}
            title="No API keys"
            description="Generate a new key to get started."
          />
        ) : (
          keys.map((key) => (
            <TableRow key={key.id}>
              <TableCell className="font-medium">{key.name}</TableCell>
              <TableCell className="text-xs font-mono">
                {key.keyPrefix}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    key.environment === "production" ? "default" : "secondary"
                  }
                  className="capitalize"
                >
                  {key.environment}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={key.status === "active" ? "success" : "destructive"}
                  className="capitalize"
                >
                  {key.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(key.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() =>
                        onRevokeKey({ id: key.id, name: key.name })
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Revoke Key
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
