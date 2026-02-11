"use client";

import { useState } from "react";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Check,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Zap,
  Lock,
  Terminal,
  BookOpen,
  History,
  Workflow,
  ExternalLink,
  Code,
  Send,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Mock data
const mockApiKeys = [
  {
    id: "key_1",
    name: "Production Server A",
    prefix: "pk_live_...",
    environment: "production",
    status: "active",
    lastUsed: "2 mins ago",
    created: "2024-12-15",
  },
  {
    id: "key_2",
    name: "Development Local",
    prefix: "pk_test_...",
    environment: "sandbox",
    status: "active",
    lastUsed: "1 hour ago",
    created: "2025-01-10",
  },
];

const apiLogs = [
  {
    id: "log_1",
    method: "POST",
    endpoint: "/v1/score-requests",
    status: 200,
    latency: "450ms",
    time: "5 mins ago",
  },
  {
    id: "log_2",
    method: "GET",
    endpoint: "/v1/score-requests/SCR-001",
    status: 200,
    latency: "120ms",
    time: "12 mins ago",
  },
  {
    id: "log_3",
    method: "POST",
    endpoint: "/v1/score-requests",
    status: 400,
    latency: "85ms",
    time: "1 hour ago",
    error: "Missing field: nationalId",
  },
  {
    id: "log_4",
    method: "GET",
    endpoint: "/v1/models",
    status: 200,
    latency: "54ms",
    time: "2 hours ago",
  },
];

const webhookEvents = [
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

const mockWebhooks = [
  {
    id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    url: "https://api.fidelitybank.com.gh/webhooks/credit-score",
    events: ["score.completed", "score.failed"],
    is_active: true,
    description: "Fidelity Bank production webhook",
    created_at: "2025-01-20T10:30:00.000Z",
  },
];

export default function DevelopersPage() {
  const [keys, setKeys] = useState(mockApiKeys);
  const [ipWhitelist, setIpWhitelist] = useState(["192.168.1.5"]);
  const [newIp, setNewIp] = useState("");

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState("sandbox");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookDescription, setNewWebhookDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isAddWebhookOpen, setIsAddWebhookOpen] = useState(false);

  const handleAddWebhook = () => {
    if (!newWebhookUrl || selectedEvents.length === 0) {
      toast.error("Please provide a URL and select at least one event.");
      return;
    }
    setWebhooks([
      {
        id: crypto.randomUUID(),
        url: newWebhookUrl,
        events: selectedEvents,
        is_active: true,
        description: newWebhookDescription,
        created_at: new Date().toISOString(),
      },
      ...webhooks,
    ]);
    setNewWebhookUrl("");
    setNewWebhookDescription("");
    setSelectedEvents([]);
    setIsAddWebhookOpen(false);
    toast.success("Webhook endpoint registered");
  };

  const handleTestWebhook = (id: string) => {
    toast.success(
      "Test event sent! Check your endpoint for a score.completed payload.",
    );
  };

  const handleToggleActive = (id: string) => {
    setWebhooks(
      webhooks.map((wh) =>
        wh.id === id ? { ...wh, is_active: !wh.is_active } : wh,
      ),
    );
    const wh = webhooks.find((w) => w.id === id);
    toast.success(wh?.is_active ? "Webhook deactivated" : "Webhook activated");
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId],
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleGenerateKey = () => {
    const prefix = newKeyEnv === "production" ? "pk_live_" : "pk_test_";
    const randomString = Math.random().toString(36).substring(2, 15);
    const fullKey = `${prefix}${randomString}`;

    setKeys([
      {
        id: `key_${Date.now()}`,
        name: newKeyName,
        prefix: `${prefix}...`,
        environment: newKeyEnv,
        status: "active",
        lastUsed: "Never",
        created: new Date().toISOString().split("T")[0],
      },
      ...keys,
    ]);

    setGeneratedKey(fullKey);
    toast.success("API Key generated");
  };

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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            Developer Portal
          </h1>
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
              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setGeneratedKey(null)}>
                    <Plus className="mr-2 h-4 w-4" /> Generate New Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {!generatedKey ? (
                    <>
                      <DialogHeader>
                        <DialogTitle>Generate API Key</DialogTitle>
                        <DialogDescription>
                          Create a new key to access the PaySwitch API.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Key Name</Label>
                          <Input
                            placeholder="e.g. ERP Integration"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Environment</Label>
                          <Select
                            value={newKeyEnv}
                            onValueChange={setNewKeyEnv}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandbox">
                                Sandbox (Testing)
                              </SelectItem>
                              <SelectItem value="production">
                                Production (Real Data)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleGenerateKey}
                          disabled={!newKeyName}
                        >
                          Generate
                        </Button>
                      </DialogFooter>
                    </>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Make sure to copy your key now. You won't be able to see
                        it again.
                      </div>
                      <div className="relative">
                        <Input
                          readOnly
                          value={generatedKey}
                          type={showKey ? "text" : "password"}
                          className="pr-20"
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
                            onClick={() => handleCopy(generatedKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        onClick={() => setIsGenerateOpen(false)}
                        className="w-full"
                      >
                        Done
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell className="text-xs">{key.prefix}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            key.environment === "production"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {key.environment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {key.lastUsed}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  href="https://bright-canary.outray.app/docs"
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
              <CardTitle>API Logs</CardTitle>
              <CardDescription>
                Recent API requests and their responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            log.method === "POST"
                              ? "text-blue-600"
                              : "text-green-600"
                          }
                        >
                          {log.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.endpoint}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            log.status === 200
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.latency}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.time}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Webhook Endpoints</CardTitle>
                <CardDescription>
                  Receive real-time notifications when scoring events occur
                </CardDescription>
              </div>
              <Dialog
                open={isAddWebhookOpen}
                onOpenChange={setIsAddWebhookOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Endpoint
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Register Webhook Endpoint</DialogTitle>
                    <DialogDescription>
                      We will POST event payloads to this URL with an
                      X-PaySwitch-Signature header for verification.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        placeholder="https://api.yourbank.com/webhooks/credit-score"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="e.g. Production scoring webhook"
                        value={newWebhookDescription}
                        onChange={(e) =>
                          setNewWebhookDescription(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subscribe to Events</Label>
                      <div className="space-y-3 pt-1">
                        {webhookEvents.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-start justify-between gap-4 rounded-lg border p-3"
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">
                                {event.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {event.description}
                              </p>
                            </div>
                            <Switch
                              checked={selectedEvents.includes(event.id)}
                              onCheckedChange={() => toggleEvent(event.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleAddWebhook}
                      disabled={!newWebhookUrl || selectedEvents.length === 0}
                    >
                      Register Endpoint
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Workflow className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm">
                    No webhook endpoints configured yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint URL</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((wh) => (
                      <TableRow key={wh.id}>
                        <TableCell className="text-xs max-w-[220px] truncate">
                          {wh.url}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                          {wh.description || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {wh.events.map((ev) => (
                              <Badge
                                key={ev}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {ev}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={wh.is_active}
                              onCheckedChange={() => handleToggleActive(wh.id)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {wh.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs gap-1"
                              onClick={() => handleTestWebhook(wh.id)}
                            >
                              <Send className="h-3 w-3" /> Test
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() =>
                                setWebhooks(
                                  webhooks.filter((w) => w.id !== wh.id),
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payload Example</CardTitle>
              <CardDescription>
                All webhooks include an X-PaySwitch-Signature header for
                verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                {`POST /webhooks/credit-score HTTP/1.1
Content-Type: application/json
X-PaySwitch-Signature: sha256=xxxxxxxx

{
  "event": "score.completed",
  "request_id": "scr_FID_20250203_00142",
  "timestamp": "2025-02-03T14:32:15Z",
  "data": {
    "status": "completed",
    "score": { "value": 724, "riskCategory": "low" },
    "risk_factors": [ ... ]
  }
}`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
