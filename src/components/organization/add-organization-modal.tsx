"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { organizationService, ORG_KEYS } from "@/lib/organization-service";
import { INDUSTRY_TYPE_ENUM } from "@/lib/constant";

interface AddOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddOrganizationModal({
  open,
  onOpenChange,
}: AddOrganizationModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [industryType, setIndustryType] = useState("fintech");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const resetForm = () => {
    setName("");
    setShortName("");
    setIndustryType("fintech");
    setAddress("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
  };

  const createMutation = useMutation({
    mutationFn: organizationService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORG_KEYS.all });
      onOpenChange(false);
      resetForm();
      toast.success("Organization created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create organization");
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({
      name,
      shortName,
      industryType,
      address: address || null,
      primaryContactName: contactName || null,
      primaryContactEmail: contactEmail || null,
      primaryContactPhone: contactPhone || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Organization</DialogTitle>
          <DialogDescription>
            Onboard a new client to the platform.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Organization Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-name"
                  placeholder="e.g. Ecobank Ghana Ltd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-shortName">
                  Short Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-shortName"
                  placeholder="e.g. ecobank"
                  value={shortName}
                  onChange={(e) =>
                    setShortName(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, hyphens, underscores only
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-industry">
                  Industry Type <span className="text-red-500">*</span>
                </Label>
                <Select value={industryType} onValueChange={setIndustryType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(INDUSTRY_TYPE_ENUM).map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-address">Address</Label>
                <Input
                  id="add-address"
                  placeholder="Physical Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Primary Contact
            </h3>
            <div className="space-y-2">
              <Label htmlFor="add-contactName">Contact Name</Label>
              <div className="relative">
                <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="add-contactName"
                  placeholder="Full Name"
                  className="pl-8"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-contactEmail">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="add-contactEmail"
                    type="email"
                    placeholder="email@company.com"
                    className="pl-8"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-contactPhone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="add-contactPhone"
                    placeholder="+233..."
                    className="pl-8"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !shortName || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
