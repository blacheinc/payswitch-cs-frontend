"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Settings,
  Menu,
  Database,
  LogOut,
  Moon,
  Sun,
  FileText,
  PanelLeftClose,
  PanelRightClose,
  BrainCircuit,
  MonitorDot,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constant";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/auth-service";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
  { title: "Organizations", href: ROUTES.ADMIN.ORGANIZATIONS, icon: Building2 },
  {
    title: "Score Requests",
    href: ROUTES.ADMIN.SCORE_REQUESTS,
    icon: FileText,
  },
  { title: "Training", href: ROUTES.ADMIN.TRAINING, icon: Database },
  {
    title: "Scoring Engine",
    href: ROUTES.ADMIN.SCORING_ENGINE,
    icon: BrainCircuit,
  },
  { title: "Monitoring", href: ROUTES.ADMIN.MONITORING, icon: MonitorDot },
  {
    title: "Access Control",
    href: ROUTES.ADMIN.ACCESS_CONTROL,
    icon: ShieldCheck,
  },
  { title: "Settings", href: ROUTES.ADMIN.SETTINGS, icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Hoisted out of AdminLayout so React treats it as a stable component type
// across renders. Declaring it inside the parent would re-create the type on
// every render, forcing the <Image /> logo (and everything else) to remount
// and causing a brief empty-sidebar flash during navigation.
interface SidebarContentProps {
  isMobile?: boolean;
  collapsed: boolean;
  resolvedTheme: "light" | "dark";
  pathname: string;
  userProfile?: { name?: string; email?: string } | null;
}

function SidebarContent({
  isMobile = false,
  collapsed,
  resolvedTheme,
  pathname,
  userProfile,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-6",
          collapsed && !isMobile && "justify-center px-2",
        )}
      >
        <Image
          src={
            resolvedTheme === "dark"
              ? "/payswitch_logo2.png"
              : "/payswitch_logo.png"
          }
          alt="PaySwitch Logo"
          width={128}
          height={128}
          className="object-contain"
          priority
          unoptimized
        />
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && !isMobile && "justify-center px-2",
              )}
              title={collapsed && !isMobile ? item.title : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={cn("p-4", collapsed && !isMobile && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && !isMobile && "justify-center",
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {userProfile?.name ? getInitials(userProfile.name) : "U"}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {userProfile?.name || "Admin User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userProfile?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const { data: userProfile } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authService.getMe(),
  });

  const { resolvedTheme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarProps = {
    collapsed,
    resolvedTheme,
    pathname,
    userProfile,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300 hidden lg:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent {...sidebarProps} />
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-11 z-50 size-8 rounded-full shadow-sm bg-background border"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </Button>
      </aside>

      {/* Main content area */}
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "lg:ml-16" : "lg:ml-64",
        )}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent {...sidebarProps} isMobile />
            </SheetContent>
          </Sheet>

          {/* Page title / breadcrumb area */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {userProfile?.name ? getInitials(userProfile.name) : "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {userProfile?.name || "Admin User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {userProfile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href={ROUTES.ADMIN.SETTINGS}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 mb-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
