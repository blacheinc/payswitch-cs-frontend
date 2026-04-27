"use client";

import { BrainCircuit, Scale } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ModelsTab } from "@/components/admin/scoring-engine/models-tab";
import { RulesSandboxTab } from "@/components/admin/scoring-engine/rules-sandbox-tab";
import { NoPermission } from "@/components/shared/no-permission";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CODES } from "@/lib/constant";

export default function ScoringEnginePage() {
  const { can } = usePermissions();
  const canModels = can(PERMISSION_CODES.MODELS.READ);
  const canRules = can(PERMISSION_CODES.RULES.EVALUATE);

  if (!canModels && !canRules) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Scoring Engine</h1>
          <p className="text-muted-foreground">
            Champion models and rules sandbox for scoring pipeline management
          </p>
        </div>
        <NoPermission />
      </div>
    );
  }

  const defaultTab = canModels ? "models" : "rules-sandbox";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Scoring Engine</h1>
          <p className="text-muted-foreground">
            Champion models and rules sandbox for scoring pipeline management
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          {canModels && (
            <TabsTrigger value="models">
              <BrainCircuit className="mr-2 h-4 w-4" />
              Models
            </TabsTrigger>
          )}
          {canRules && (
            <TabsTrigger value="rules-sandbox">
              <Scale className="mr-2 h-4 w-4" />
              Rules Sandbox
            </TabsTrigger>
          )}
        </TabsList>

        {canModels && (
          <TabsContent value="models">
            <ModelsTab />
          </TabsContent>
        )}

        {canRules && (
          <TabsContent value="rules-sandbox">
            <RulesSandboxTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
