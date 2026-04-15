"use client";

import { BrainCircuit, Scale } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ModelsTab } from "@/components/admin/scoring-engine/models-tab";
import { RulesSandboxTab } from "@/components/admin/scoring-engine/rules-sandbox-tab";

export default function ScoringEnginePage() {
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

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="models">
            <BrainCircuit className="mr-2 h-4 w-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="rules-sandbox">
            <Scale className="mr-2 h-4 w-4" />
            Rules Sandbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <ModelsTab />
        </TabsContent>

        <TabsContent value="rules-sandbox">
          <RulesSandboxTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
