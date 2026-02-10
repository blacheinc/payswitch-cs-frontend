'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Key,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  TrendingUp,
  Bell,
  LogOut,
  Moon,
  Sun,
  User,
  Building2,
  Terminal,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/shared/notification-center';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Score Requests', href: '/score-requests', icon: FileText },
  { title: 'Developers', href: '/developers', icon: Terminal },
  { title: 'Team', href: '/team', icon: Users },
  { title: 'Reports', href: '/reports', icon: BarChart3 },
  { title: 'Settings', href: '/settings', icon: Settings },
];

interface OrgLayoutProps {
  children: React.ReactNode;
}

export default function OrgLayout({ children }: OrgLayoutProps) {
  const pathname = usePathname();
  const { user, organization, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-6',
        collapsed && !isMobile && 'justify-center px-2'
      )}>
        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="flex flex-col">
            <span className="font-semibold text-sm">PaySwitch</span>
            <span className="text-xs text-muted-foreground">Credit Scoring</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Organization badge */}
      {(!collapsed || isMobile) && organization && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium truncate">{organization.name}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && !isMobile && 'justify-center px-2'
              )}
              title={collapsed && !isMobile ? item.title : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && (
                <span className="flex-1">{item.title}</span>
              )}
              {(!collapsed || isMobile) && item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button (desktop only) */}
      {!isMobile && (
        <div className="px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>
      )}

      <Separator />

      {/* User section */}
      <div className={cn('p-4', collapsed && !isMobile && 'px-2')}>
        <div className={cn(
          'flex items-center gap-3',
          collapsed && !isMobile && 'justify-center'
        )}>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {user?.name ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {user?.roleLabel?.replace('_', ' ') || 'Member'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300 hidden lg:block',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className={cn(
        'transition-all duration-300',
        collapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
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
              <SidebarContent isMobile />
            </SheetContent>
          </Sheet>

          {/* Page title / breadcrumb area */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationCenter type="org" />

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {resolvedTheme === 'dark' ? (
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
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
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
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
