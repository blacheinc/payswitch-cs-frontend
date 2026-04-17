"use client";

import {
  Server,
  ShieldAlert,
  BrainCircuit,
  Shield,
  Bell,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { InfrastructureTab } from "@/components/admin/monitoring/infrastructure-tab";
import { RiskTab } from "@/components/admin/monitoring/risk-tab";
import { ModelOpsTab } from "@/components/admin/monitoring/model-ops-tab";
import { ComplianceTab } from "@/components/admin/monitoring/compliance-tab";
import { AlertsTab } from "@/components/admin/monitoring/alerts-tab";

export default function AdminMonitoringPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Monitoring</h1>
          <p className="text-muted-foreground">
            Live data from{" "}
            <code className="text-xs bg-muted px-1 rounded">/v1/monitoring/*</code>{" "}
            — infrastructure, risk, model ops, compliance, and alerts (query
            params match OpenAPI).
          </p>
        </div>
      </div>

      <Tabs defaultValue="infrastructure" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="infrastructure">
            <Server className="mr-2 h-4 w-4" />
            Infrastructure
          </TabsTrigger>
          <TabsTrigger value="risk">
            <ShieldAlert className="mr-2 h-4 w-4" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="model-ops">
            <BrainCircuit className="mr-2 h-4 w-4" />
            Model Ops
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <Shield className="mr-2 h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="mr-2 h-4 w-4" />
            Alerts
          </TabsTrigger>
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
      </Tabs>
    </div>
  );
}
