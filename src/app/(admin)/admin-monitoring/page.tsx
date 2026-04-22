"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Server,
  ShieldAlert,
  BrainCircuit,
  Shield,
  Bell,
  BellOff,
  Footprints,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { monitoringService, MONITORING_KEYS } from "@/lib/monitoring-service";
import { InfrastructureTab } from "@/components/admin/monitoring/infrastructure-tab";
import { RiskTab } from "@/components/admin/monitoring/risk-tab";
import { ModelOpsTab } from "@/components/admin/monitoring/model-ops-tab";
import { ComplianceTab } from "@/components/admin/monitoring/compliance-tab";
import { AlertsTab } from "@/components/admin/monitoring/alerts-tab";
import { ActivityTab } from "@/components/admin/monitoring/activity-tab";

const TABS = [
  {
    value: "infrastructure",
    label: "Infrastructure",
    icon: Server,
  },
  { value: "risk", label: "Risk", icon: ShieldAlert },
  { value: "model-ops", label: "Model Ops", icon: BrainCircuit },
  { value: "compliance", label: "Compliance", icon: Shield },
  { value: "alerts", label: "Alerts", icon: Bell },
  { value: "activity", label: "Activity", icon: Footprints },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function AdminMonitoringPage() {
  const [active, setActive] = useState<TabValue>("infrastructure");

  // Global "firing" banner — polls every 60s per integration guide.
  const firingQuery = useQuery({
    queryKey: MONITORING_KEYS.alerts({ status: "firing", limit: 5 }),
    queryFn: () =>
      monitoringService.getAlerts({ status: "firing", limit: 5 }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const summary = firingQuery.data?.summary;
  const firingCount = summary?.total_firing ?? 0;
  const criticalCount = summary?.critical_firing ?? 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Monitoring</h1>
          <p className="text-muted-foreground text-sm">
            A live look at platform health, lending decisions, model
            performance, and compliance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActive("alerts")}
          className="inline-flex items-center gap-2 text-left"
          aria-label="Jump to alerts"
        >
          {firingCount > 0 ? (
            <Badge
              variant="destructive"
              className="px-3 py-1.5 text-sm gap-2"
            >
              <Bell className="h-3.5 w-3.5" />
              {firingCount} need{firingCount === 1 ? "s" : ""} attention
              {criticalCount > 0 && (
                <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]">
                  {criticalCount} urgent
                </span>
              )}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="px-3 py-1.5 text-sm bg-green-50 text-green-700 border-green-200 gap-2 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50"
            >
              <BellOff className="h-3.5 w-3.5" />
              All systems healthy
            </Badge>
          )}
        </button>
      </div>

      <Tabs
        value={active}
        onValueChange={(v) => setActive(v as TabValue)}
        className="space-y-6"
      >
        <TabsList className="flex-wrap h-auto gap-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
              {tab.value === "alerts" && firingCount > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                  {firingCount}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="infrastructure">
          <InfrastructureTab />
        </TabsContent>
        <TabsContent value="risk">
          <RiskTab />
        </TabsContent>
        <TabsContent value="model-ops">
          <ModelOpsTab />
        </TabsContent>
        <TabsContent value="compliance">
          <ComplianceTab />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertsTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
