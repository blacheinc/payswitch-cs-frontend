"use client";

import { useState } from "react";
import {
  Activity,
  ShieldCheck,
  Cpu,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCcw,
  Network,
  Database,
  BrainCircuit,
  HardDrive,
  Server,
  Wifi,
  WifiOff,
  Settings2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AIAgent, AgentActionLog, AgentStatus } from "@/types/models";

// Mock data for AI Agents
const mockAgents: AIAgent[] = [
  {
    id: "agent_dq_001",
    name: "Data Quality Sentinel",
    role: "data_quality",
    status: "running",
    lastAction: "Cleaned trailing spaces in address fields",
    lastActionAt: "2 mins ago",
    successRate24h: 99.8,
    autonomousActionsCount: 1245,
    healthMetrics: { cpu: 12, memory: 450, latency: 15 },
  },
  {
    id: "agent_fe_002",
    name: "Feature Engine Alpha",
    role: "feature_engineering",
    status: "running",
    lastAction: 'Synthesized "Momo Regularity" feature',
    lastActionAt: "5 mins ago",
    successRate24h: 98.5,
    autonomousActionsCount: 856,
    healthMetrics: { cpu: 45, memory: 1200, latency: 45 },
  },
  // {
  //   id: "agent_rs_003",
  //   name: "Risk Scorer Core",
  //   role: "risk_scoring",
  //   status: "idle",
  //   lastAction: "Applied lgbm_v2.3.1 to request SCR-FID-001",
  //   lastActionAt: "12 mins ago",
  //   successRate24h: 100,
  //   autonomousActionsCount: 342,
  //   healthMetrics: { cpu: 8, memory: 800, latency: 120 },
  // },
  {
    id: "agent_rt_004",
    name: "Retraining Guardian",
    role: "retraining",
    status: "warning",
    lastAction: "Detected drift in Income feature group",
    lastActionAt: "1 hour ago",
    successRate24h: 92.4,
    autonomousActionsCount: 12,
    healthMetrics: { cpu: 78, memory: 2400, latency: 850 },
  },
  // {
  //   id: "agent_cm_005",
  //   name: "Compliance Watcher",
  //   role: "compliance_checker",
  //   status: "running",
  //   lastAction: "Verified PII redaction in logs",
  //   lastActionAt: "45 mins ago",
  //   successRate24h: 100,
  //   autonomousActionsCount: 5412,
  //   healthMetrics: { cpu: 5, memory: 320, latency: 5 },
  // },
];

const actionLogs: AgentActionLog[] = [
  {
    id: "log_1",
    agentId: "agent_dq_001",
    actionType: "Data Cleaning",
    description: "Auto-corrected date format for 12 incoming requests",
    impact: "low",
    status: "success",
    timestamp: "2025-02-10 14:24:00",
  },
  {
    id: "log_2",
    agentId: "agent_rt_004",
    actionType: "Drift Detection",
    description: "Flagged 15% shift in median loan amount for MTN Ghana client",
    impact: "high",
    status: "success",
    timestamp: "2025-02-10 13:45:00",
  },
  {
    id: "log_3",
    agentId: "agent_fe_002",
    actionType: "Feature Engineering",
    description: "Generated Debt-to-Momo-Inflow ratio for 45 applicants",
    impact: "medium",
    status: "success",
    timestamp: "2025-02-10 13:12:00",
  },
  {
    id: "log_4",
    agentId: "agent_dq_001",
    actionType: "Anomaly Detection",
    description: "Rejected 1 request with negative income value",
    impact: "medium",
    status: "success",
    timestamp: "2025-02-10 12:30:00",
  },
];

const efficiencyData = [
  { name: "00:00", autonomous: 120, manual: 10 },
  { name: "04:00", autonomous: 80, manual: 5 },
  { name: "08:00", autonomous: 250, manual: 45 },
  { name: "12:00", autonomous: 450, manual: 120 },
  { name: "16:00", autonomous: 380, manual: 90 },
  { name: "20:00", autonomous: 200, manual: 30 },
];

const workloadAllocation = [
  { name: "Autonomous", value: 85, color: "hsl(var(--primary))" },
  { name: "Manual Review", value: 15, color: "hsl(var(--muted-foreground))" },
];

const clusterNodes = [
  {
    id: "node-primary",
    name: "Primary Node",
    role: "Master",
    status: "healthy" as const,
    ip: "10.0.1.10",
    cpu: 34,
    memory: 62,
    disk: 45,
    uptime: "45d 12h 38m",
    connections: 128,
    maxConnections: 200,
  },
  {
    id: "node-worker-1",
    name: "Worker Node 1",
    role: "Worker",
    status: "healthy" as const,
    ip: "10.0.1.11",
    cpu: 58,
    memory: 71,
    disk: 38,
    uptime: "32d 8h 15m",
    connections: 95,
    maxConnections: 200,
  },
  {
    id: "node-worker-2",
    name: "Worker Node 2",
    role: "Worker",
    status: "degraded" as const,
    ip: "10.0.1.12",
    cpu: 87,
    memory: 89,
    disk: 72,
    uptime: "12d 3h 42m",
    connections: 184,
    maxConnections: 200,
  },
];

export default function AIMonitorPage() {
  const [agents, setAgents] = useState<AIAgent[]>(mockAgents);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orchestratorOpen, setOrchestratorOpen] = useState(false);
  const [orchestratorConfig, setOrchestratorConfig] = useState({
    autoRestart: true,
    maxConcurrentAgents: 5,
    driftThreshold: 0.15,
    emailNotifications: true,
    slackNotifications: false,
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Agent status updated");
    }, 1000);
  };

  const handleSaveConfig = () => {
    setOrchestratorOpen(false);
    toast.success("Orchestrator configuration saved successfully");
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case "running":
        return "bg-green-500";
      case "idle":
        return "bg-blue-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agentic AI Monitor</h1>
          <p className="text-muted-foreground">
            Observe and govern autonomous system operations and model
            self-healing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Agents
          </Button>
          <Dialog open={orchestratorOpen} onOpenChange={setOrchestratorOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Settings2 className="mr-2 h-4 w-4" />
                Configure Orchestrator
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Orchestrator Configuration</DialogTitle>
                <DialogDescription>
                  Manage how AI agents are orchestrated across the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Agent Auto-Restart
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically restart agents that crash or become
                      unresponsive.
                    </p>
                  </div>
                  <Switch
                    checked={orchestratorConfig.autoRestart}
                    onCheckedChange={(checked) =>
                      setOrchestratorConfig((prev) => ({
                        ...prev,
                        autoRestart: checked,
                      }))
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Max Concurrent Agents
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={orchestratorConfig.maxConcurrentAgents}
                    onChange={(e) =>
                      setOrchestratorConfig((prev) => ({
                        ...prev,
                        maxConcurrentAgents: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of agents running simultaneously (1–20).
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Drift Alert Threshold
                  </Label>
                  <Input
                    type="number"
                    step={0.01}
                    min={0.01}
                    max={1}
                    value={orchestratorConfig.driftThreshold}
                    onChange={(e) =>
                      setOrchestratorConfig((prev) => ({
                        ...prev,
                        driftThreshold: parseFloat(e.target.value) || 0.01,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Trigger retraining alert when data drift exceeds this value.
                  </p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Notifications</Label>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">
                      Email Alerts
                    </Label>
                    <Switch
                      checked={orchestratorConfig.emailNotifications}
                      onCheckedChange={(checked) =>
                        setOrchestratorConfig((prev) => ({
                          ...prev,
                          emailNotifications: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">
                      Slack Alerts
                    </Label>
                    <Switch
                      checked={orchestratorConfig.slackNotifications}
                      onCheckedChange={(checked) =>
                        setOrchestratorConfig((prev) => ({
                          ...prev,
                          slackNotifications: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOrchestratorOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveConfig}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Autonomous Efficiency
            </CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85.4%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              +2.1% improvement this week
            </div>
            <Progress value={85.4} className="h-1 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Self-Healing Actions
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7,860</div>
            <p className="text-xs text-muted-foreground mt-1">
              Actions taken without human intervention
            </p>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active AI Agents
            </CardTitle>
            <Cpu className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 / 5</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              All systems operational
            </p>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Data Drift Index
            </CardTitle>
            <Network className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.042</div>
            <div className="flex items-center text-xs text-yellow-600 mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              Staging model shows 0.12 drift
            </div>
          </CardContent>
        </Card>
      </div>

      {/* <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workload Autonomy</CardTitle>
                <CardDescription>
                  Ratio of autonomous actions vs manual interventions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={efficiencyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-muted"
                  />
                  <Area
                    type="monotone"
                    dataKey="autonomous"
                    stackId="1"
                    stroke="var(--primary)"
                    fillOpacity={1}
                    fill="url(#colorAuto)"
                  />
                  <Area
                    type="monotone"
                    dataKey="manual"
                    stackId="2"
                    stroke="var(--muted-foreground)"
                    fillOpacity={0.1}
                    fill="var(--muted-foreground)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Resource Distribution</CardTitle>
            <CardDescription>AI Workload vs Human Oversight</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workloadAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {workloadAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {workloadAllocation.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div> */}

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">
            <BrainCircuit className="mr-2 h-4 w-4" /> System Agents
          </TabsTrigger>
          <TabsTrigger value="actions">
            <Activity className="mr-2 h-4 w-4" /> Autonomous Action Log
          </TabsTrigger>
          <TabsTrigger value="health">
            <Database className="mr-2 h-4 w-4" /> Cluster Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className="overflow-hidden border-l-4"
                style={{ borderColor: getStatusBadgeColor(agent.status) }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                        {agent.role.replace("_", " ")}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {agent.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2 text-xs">
                      <Zap className="h-3 w-3 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">Latest Action:</p>
                        <p className="text-muted-foreground">
                          {agent.lastAction}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {agent.lastActionAt}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Success Rate
                      </p>
                      <p className="text-sm font-bold text-green-600">
                        {agent.successRate24h}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Autonomy Count
                      </p>
                      <p className="text-sm font-bold">
                        {agent.autonomousActionsCount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase">
                      <span>Thread Latency</span>
                      <span>{agent.healthMetrics.latency}ms</span>
                    </div>
                    <Progress
                      value={Math.min(agent.healthMetrics.latency / 2, 100)}
                      className="h-1"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Autonomous Action History</CardTitle>
              <CardDescription>
                Detailed audit of decisions made by the AI Orchestrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className={`mt-1 p-2 rounded-lg ${
                        log.impact === "high"
                          ? "bg-red-50 text-red-600"
                          : log.impact === "medium"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">
                          {log.actionType}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {log.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="ghost" className="text-[10px] h-5">
                          AGENT: {log.agentId}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 ${
                            log.impact === "high"
                              ? "border-red-200 text-red-600"
                              : log.impact === "medium"
                                ? "border-blue-200 text-blue-600"
                                : "border-gray-200 text-gray-600"
                          }`}
                        >
                          IMPACT: {log.impact.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-xs">
                View All Activity Logs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {clusterNodes.map((node) => (
              <Card key={node.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{node.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {node.role} · {node.ip}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={
                        node.status === "healthy" ? "outline" : "destructive"
                      }
                      className="capitalize"
                    >
                      {node.status === "healthy" ? (
                        <Wifi className="mr-1 h-3 w-3" />
                      ) : (
                        <WifiOff className="mr-1 h-3 w-3" />
                      )}
                      {node.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <Cpu className="h-3 w-3" /> CPU
                        </span>
                        <span
                          className={`font-semibold ${
                            node.cpu > 80
                              ? "text-red-600"
                              : node.cpu > 60
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {node.cpu}%
                        </span>
                      </div>
                      <Progress value={node.cpu} className="h-1.5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <Database className="h-3 w-3" /> Memory
                        </span>
                        <span
                          className={`font-semibold ${
                            node.memory > 80
                              ? "text-red-600"
                              : node.memory > 60
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {node.memory}%
                        </span>
                      </div>
                      <Progress value={node.memory} className="h-1.5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <HardDrive className="h-3 w-3" /> Disk
                        </span>
                        <span
                          className={`font-semibold ${
                            node.disk > 80
                              ? "text-red-600"
                              : node.disk > 60
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {node.disk}%
                        </span>
                      </div>
                      <Progress value={node.disk} className="h-1.5" />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                        Uptime
                      </p>
                      <p className="font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3 text-green-600" />
                        {node.uptime}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground uppercase tracking-wider text-[10px]">
                        Connections
                      </p>
                      <p className="font-semibold">
                        {node.connections}
                        <span className="text-muted-foreground font-normal">
                          /{node.maxConnections}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cluster Summary</CardTitle>
              <CardDescription>
                Aggregate resource usage across all compute nodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Nodes</p>
                  <p className="text-3xl font-bold">{clusterNodes.length}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {
                      clusterNodes.filter((n) => n.status === "healthy").length
                    }{" "}
                    healthy
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Avg. CPU Usage
                  </p>
                  <p className="text-3xl font-bold">
                    {Math.round(
                      clusterNodes.reduce((sum, n) => sum + n.cpu, 0) /
                        clusterNodes.length,
                    )}
                    %
                  </p>
                  <Progress
                    value={Math.round(
                      clusterNodes.reduce((sum, n) => sum + n.cpu, 0) /
                        clusterNodes.length,
                    )}
                    className="h-1.5"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg. Memory</p>
                  <p className="text-3xl font-bold">
                    {Math.round(
                      clusterNodes.reduce((sum, n) => sum + n.memory, 0) /
                        clusterNodes.length,
                    )}
                    %
                  </p>
                  <Progress
                    value={Math.round(
                      clusterNodes.reduce((sum, n) => sum + n.memory, 0) /
                        clusterNodes.length,
                    )}
                    className="h-1.5"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Total Connections
                  </p>
                  <p className="text-3xl font-bold">
                    {clusterNodes.reduce((sum, n) => sum + n.connections, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of{" "}
                    {clusterNodes.reduce((sum, n) => sum + n.maxConnections, 0)}{" "}
                    max
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case "running":
        return "hsl(var(--risk-very-low))";
      case "warning":
        return "hsl(var(--risk-medium))";
      case "error":
        return "hsl(var(--risk-high))";
      case "idle":
        return "hsl(var(--primary))";
      default:
        return "hsl(var(--muted))";
    }
  }
}
