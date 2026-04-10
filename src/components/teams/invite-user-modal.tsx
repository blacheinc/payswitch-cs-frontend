"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, User, Loader2 } from "lucide-react";
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

import {
  userManagementService,
  USER_MGMT_KEYS,
} from "@/lib/user-management-service";
import { ROLE_LABELS_ENUM, ROUTES } from "@/lib/constant";

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleLabel, setRoleLabel] = useState("viewer");

  const resetForm = () => {
    setName("");
    setEmail("");
    setRoleLabel("viewer");
  };

  const inviteMutation = useMutation({
    mutationFn: userManagementService.invite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_MGMT_KEYS.all });
      onOpenChange(false);
      resetForm();
      toast.success(`Invitation sent to ${email}`);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to send invitation");
    },
  });

  const handleSubmit = () => {
    const callbackUrl = `${window.location.origin}${ROUTES.AUTH.LOGIN}`;
    inviteMutation.mutate({
      email,
      name,
      roleLabel,
      callbackUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization. They will receive an
            email to set up their account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Member Details
            </h3>
            <div className="space-y-2">
              <Label htmlFor="invite-name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-name"
                  placeholder="John Doe"
                  className="pl-8"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  className="pl-8"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Access Level
            </h3>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={roleLabel} onValueChange={setRoleLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ROLE_LABELS_ENUM).map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">{role.label}</span>
                        {/* <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span> */}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !email || inviteMutation.isPending}
          >
            {inviteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
