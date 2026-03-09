"use client";

import { useState } from "react";
import { Bell, Check, Info, AlertTriangle, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
}

interface NotificationCenterProps {
  type: "admin" | "org";
}

const ADMIN_MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Model Drift Detected",
    description: "Significant drift detected in Credit Risk XGBoost (v2.3.1).",
    time: "5m ago",
    type: "warning",
    read: false,
  },
  {
    id: "2",
    title: "New Org Signup",
    description: "EcoBank Ghana has requested sandbox access.",
    time: "1h ago",
    type: "info",
    read: false,
  },
  {
    id: "3",
    title: "System Health Alert",
    description: "Latency p99 exceeded 2s in Europe-West region.",
    time: "2h ago",
    type: "error",
    read: true,
  },
];

const ORG_MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Score Request Complete",
    description: "Result for Kwame Asante (SCR-202502-0042) is ready.",
    time: "2m ago",
    type: "success",
    read: false,
  },
  {
    id: "2",
    title: "API Key Revoked",
    description: "The production key ending in ...4f2a has been revoked.",
    time: "10m ago",
    type: "warning",
    read: false,
  },
  {
    id: "3",
    title: "Monthly Report Ready",
    description:
      "Your January scoring performance report is available for download.",
    time: "1d ago",
    type: "info",
    read: true,
  },
];

export function NotificationCenter({ type }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(
    type === "admin" ? ADMIN_MOCK_NOTIFICATIONS : ORG_MOCK_NOTIFICATIONS,
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto p-0 text-muted-foreground hover:text-primary"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator className="my-2" />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 p-4 transition-colors hover:bg-accent/50 cursor-pointer relative group",
                    !n.read && "bg-primary/[0.03]",
                  )}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          "text-sm font-medium leading-none",
                          !n.read && "font-bold",
                        )}
                      >
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {n.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute -right-0 -top-0"
                    onClick={(e) => deleteNotification(e, n.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {!n.read && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full text-xs h-8 text-muted-foreground"
          >
            View all activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
