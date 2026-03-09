"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export function NotificationsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Control which emails you receive from the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Score Completed</Label>
              <p className="text-sm text-muted-foreground">
                Notify me when a credit score request is processed
              </p>
            </div>
            <Switch checked={true} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Important updates about platform status and model health
              </p>
            </div>
            <Switch checked={true} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Team Activity</Label>
              <p className="text-sm text-muted-foreground">
                Notifications about new team members or role changes
              </p>
            </div>
            <Switch checked={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
