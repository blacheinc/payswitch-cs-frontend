"use client";

import { useState } from "react";
import {
  Check,
  Info,
  AlertTriangle,
  ChevronDown,
  Save,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  MappingItem,
  UpdateFieldMappingItem,
} from "@/types/training-type";

// Common target features used in our scoring model
const TARGET_FEATURES = [
  "loan_amount",
  "loan_tenor",
  "loan_purpose",
  "monthly_income",
  "monthly_expenses",
  "age",
  "gender",
  "employment_status",
  "residence_type",
  "years_at_current_job",
  "repayment_history",
  "outstanding_debts",
  "education_level",
  "marital_status",
  "bank_account_type",
  "total_dependents",
  "identification_type",
  "location_region",
];

interface MappingEditorProps {
  mappings: MappingItem[];
  onSave: (updatedMappings: UpdateFieldMappingItem[]) => void;
  isSaving: boolean;
}

export function MappingEditor({
  mappings,
  onSave,
  isSaving,
}: MappingEditorProps) {
  const [localMappings, setLocalMappings] = useState<Record<string, string>>(
    mappings.reduce(
      (acc, item) => ({
        ...acc,
        [item.sourceField]: item.targetFeature || "unmapped",
      }),
      {},
    ),
  );

  const handleMappingChange = (sourceField: string, targetFeature: string) => {
    setLocalMappings((prev) => ({
      ...prev,
      [sourceField]: targetFeature,
    }));
  };

  const handleSave = () => {
    const updates: UpdateFieldMappingItem[] = Object.entries(localMappings)
      .filter(([_, target]) => target !== "unmapped")
      .map(([source, target]) => ({
        sourceField: source,
        targetFeature: target,
        isApproved: true,
      }));
    onSave(updates);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.7) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                Source Field (from file)
              </TableHead>
              <TableHead className="w-[100px]">Confidence</TableHead>
              <TableHead>Sample Values</TableHead>
              <TableHead className="w-[300px]">
                Target Feature (Model Input)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((item) => (
              <TableRow key={item.sourceField}>
                <TableCell className="font-medium flex items-center gap-2">
                  {item.sourceField}
                  {item.isRequired && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Required for basic scoring</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs font-semibold ${getConfidenceColor(item.confidence)}`}
                  >
                    {Math.round(item.confidence * 100)}%
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.sampleValues.slice(0, 3).map((val, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-[10px] font-normal px-1.5 py-0 h-4 max-w-[120px] truncate"
                      >
                        {val}
                      </Badge>
                    ))}
                    {item.sampleValues.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{item.sampleValues.length - 3}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={localMappings[item.sourceField]}
                    onValueChange={(val) =>
                      handleMappingChange(item.sourceField, val)
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Map to feature..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="unmapped"
                        className="text-muted-foreground"
                      >
                        Unmapped
                      </SelectItem>
                      {TARGET_FEATURES.map((feature) => (
                        <SelectItem key={feature} value={feature}>
                          {feature.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border border-dashed">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <p>
            Mapping ensures source fields correctly align with model features.
            Review unmapped required fields before approval.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Mappings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
