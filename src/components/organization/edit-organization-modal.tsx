"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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

import { organizationService, ORG_KEYS } from "@/lib/organization-service";
import type { OrganizationResponse } from "@/types/organization-type";
import { getErrorMessage } from "@/types/models";

interface EditOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: OrganizationResponse | null;
}

export function EditOrganizationModal({
  open,
  onOpenChange,
  organization,
}: EditOrganizationModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");

  // Populate form when organization changes
  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setContactName(organization.primaryContactName || "");
      setContactEmail(organization.primaryContactEmail || "");
      setContactPhone(organization.primaryContactPhone || "");
      setAddress(organization.address || "");
    }
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof organizationService.update>[1];
    }) => organizationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORG_KEYS.all });
      onOpenChange(false);
      toast.success("Organization updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update organization"));
    },
  });

  const handleSubmit = () => {
    if (!organization) return;
    updateMutation.mutate({
      id: organization.id,
      data: {
        name: name || null,
        primaryContactName: contactName || null,
        primaryContactEmail: contactEmail || null,
        primaryContactPhone: contactPhone || null,
        address: address || null,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update details for {organization?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Organization Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-contact-name">Contact Name</Label>
            <Input
              id="edit-contact-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-contact-email">Contact Email</Label>
              <Input
                id="edit-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-phone">Contact Phone</Label>
              <Input
                id="edit-contact-phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
