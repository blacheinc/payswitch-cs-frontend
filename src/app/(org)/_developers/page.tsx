"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Key,
  Plus,
  BookOpen,
  History,
  Workflow,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  apiLogService,
  API_LOG_KEYS,
  apiKeyService,
  API_KEY_KEYS,
  webhookService,
  WEBHOOK_KEYS,
  type WebhookResponse,
} from "@/lib/developer-service";
import { ApiLogTable } from "@/components/developers/api-log-table";
import { ApiKeyTable } from "@/components/developers/api-key-table";
import { GenerateApiKeyModal } from "@/components/developers/generate-api-key-modal";
import { RevokeApiKeyModal } from "@/components/developers/revoke-api-key-modal";
import { WebhookTable } from "@/components/developers/webhook-table";
import { AddWebhookModal } from "@/components/developers/add-webhook-modal";
import { EditWebhookModal } from "@/components/developers/edit-webhook-modal";
import { DeleteWebhookModal } from "@/components/developers/delete-webhook-modal";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CODES } from "@/lib/constant";

export default function DevelopersPage() {
  const { can } = usePermissions();
  // ---- API Keys state ----
  const [isGenerateKeyOpen, setIsGenerateKeyOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ---- Webhook state ----
  const [isAddWebhookOpen, setIsAddWebhookOpen] = useState(false);
  const [editWebhookTarget, setEditWebhookTarget] =
    useState<WebhookResponse | null>(null);
  const [deleteWebhookTarget, setDeleteWebhookTarget] = useState<{
    id: string;
    url: string;
  } | null>(null);

  // ---- IP Whitelist state ----
  const [ipWhitelist, setIpWhitelist] = useState(["192.168.1.5"]);
  const [newIp, setNewIp] = useState("");

  const {
    data: apiKeys,
    isLoading: keysLoading,
    isError: keysError,
  } = useQuery({
    queryKey: API_KEY_KEYS.list(),
    queryFn: apiKeyService.list,
  });

  const {
    data: webhooksData,
    isLoading: webhooksLoading,
    isError: webhooksError,
  } = useQuery({
    queryKey: WEBHOOK_KEYS.list(),
    queryFn: webhookService.list,
  });

  // ---- API Logs state ----
  const [logPage, setLogPage] = useState(1);
  const [logMethodFilter, setLogMethodFilter] = useState<string>("");
  const [logStatusFilter, setLogStatusFilter] = useState<string>("");

  const {
    data: logData,
    isLoading: logLoading,
    isError: logError,
  } = useQuery({
    queryKey: API_LOG_KEYS.list({
      page: logPage,
      method: logMethodFilter || null,
      statusClass: logStatusFilter || null,
    }),
    queryFn: () =>
      apiLogService.list({
        page: logPage,
        method: logMethodFilter || null,
        statusClass: logStatusFilter || null,
      }),
  });

  const handleAddIp = () => {
    if (newIp && !ipWhitelist.includes(newIp)) {
      setIpWhitelist([...ipWhitelist, newIp]);
      setNewIp("");
      toast.success("IP whitelisted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Developer Portal</h1>
          <p className="text-muted-foreground">
            API integration tools, documentation, and sandbox environment
          </p>
        </div>
      </div>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys" className="gap-2">
            <Key className="h-4 w-4" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <BookOpen className="h-4 w-4" /> Documentation
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" /> API Logs
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Workflow className="h-4 w-4" /> Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Authentication Keys</CardTitle>
                <CardDescription>
                  Secret keys used to authenticate your requests
                </CardDescription>
              </div>
              {can(PERMISSION_CODES.API_KEYS.CREATE) && (
                <Button onClick={() => setIsGenerateKeyOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Generate New Key
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ApiKeyTable
                data={apiKeys}
                isLoading={keysLoading}
                isError={keysError}
                onRevokeKey={setRevokeTarget}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IP Whitelist</CardTitle>
              <CardDescription>
                Restrict API calls to specific originating IP addresses
                (Production only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 max-w-sm mb-4">
                <Input
                  placeholder="e.g. 154.160.2.1"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                />
                <Button variant="outline" onClick={handleAddIp}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ipWhitelist.map((ip) => (
                  <Badge
                    key={ip}
                    variant="secondary"
                    className="pl-3 pr-1 py-1 gap-2"
                  >
                    {ip}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() =>
                        setIpWhitelist(ipWhitelist.filter((i) => i !== ip))
                      }
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">API Documentation</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Explore the full PaySwitch Credit Scoring API reference,
                  including endpoints, request/response schemas, and
                  authentication guides.
                </p>
              </div>
              <Button asChild size="lg" className="gap-2 mt-2">
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Documentation
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>API Logs</CardTitle>
                  <CardDescription>
                    Recent API requests and their responses
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={logMethodFilter}
                    onValueChange={(v) => {
                      setLogMethodFilter(v === "all" ? "" : v);
                      setLogPage(1);
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={logStatusFilter}
                    onValueChange={(v) => {
                      setLogStatusFilter(v === "all" ? "" : v);
                      setLogPage(1);
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="2xx">2xx Success</SelectItem>
                      <SelectItem value="4xx">4xx Client</SelectItem>
                      <SelectItem value="5xx">5xx Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ApiLogTable
                data={logData}
                isLoading={logLoading}
                isError={logError}
                page={logPage}
                onPageChange={setLogPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Webhook Endpoints</CardTitle>
                <CardDescription>
                  Receive signed HTTP callbacks when scoring events complete
                </CardDescription>
              </div>
              {can(PERMISSION_CODES.WEBHOOKS.MANAGE) && (
                <Button onClick={() => setIsAddWebhookOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Endpoint
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <WebhookTable
                data={webhooksData}
                isLoading={webhooksLoading}
                isError={webhooksError}
                onEditWebhook={setEditWebhookTarget}
                onDeleteWebhook={setDeleteWebhookTarget}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Key Modals */}
      <GenerateApiKeyModal
        open={isGenerateKeyOpen}
        onOpenChange={setIsGenerateKeyOpen}
      />
      <RevokeApiKeyModal
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        keyId={revokeTarget?.id ?? null}
        keyName={revokeTarget?.name ?? ""}
      />

      {/* Webhook Modals */}
      <AddWebhookModal
        open={isAddWebhookOpen}
        onOpenChange={setIsAddWebhookOpen}
      />
      <EditWebhookModal
        open={!!editWebhookTarget}
        onOpenChange={(open) => {
          if (!open) setEditWebhookTarget(null);
        }}
        webhook={editWebhookTarget}
      />
      <DeleteWebhookModal
        open={!!deleteWebhookTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteWebhookTarget(null);
        }}
        webhookId={deleteWebhookTarget?.id ?? null}
        webhookUrl={deleteWebhookTarget?.url ?? ""}
      />
    </div>
  );
}
