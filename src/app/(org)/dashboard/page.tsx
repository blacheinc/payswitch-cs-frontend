'use client';

import Link from 'next/link';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data - would be fetched from API
const stats = {
  totalRequests: 1247,
  requestsToday: 45,
  requestsThisWeek: 312,
  requestsChange: 12.5,
  averageScore: 682,
  scoreChange: 2.3,
  avgResponseTime: 187,
  responseTimeChange: -8.2,
  pendingRequests: 3,
};

const scoreDistribution = [
  { range: '300-499', count: 45, label: 'Very High Risk', color: 'var(--risk-very-high)' },
  { range: '500-579', count: 123, label: 'High Risk', color: 'var(--risk-high)' },
  { range: '580-669', count: 287, label: 'Medium Risk', color: 'var(--risk-medium)' },
  { range: '670-739', count: 412, label: 'Low Risk', color: 'var(--risk-low)' },
  { range: '740-850', count: 380, label: 'Very Low Risk', color: 'var(--risk-very-low)' },
];

const riskBreakdown = [
  { name: 'Very Low', value: 30, color: '#22c55e' },
  { name: 'Low', value: 33, color: '#84cc16' },
  { name: 'Medium', value: 23, color: '#eab308' },
  { name: 'High', value: 10, color: '#f97316' },
  { name: 'Very High', value: 4, color: '#ef4444' },
];

const recentRequests = [
  { id: 'SCR-FID-20250204-001', applicant: 'Kwame Asante', score: 720, risk: 'low', time: '5 mins ago' },
  { id: 'SCR-FID-20250204-002', applicant: 'Ama Serwaa', score: 645, risk: 'medium', time: '12 mins ago' },
  { id: 'SCR-FID-20250204-003', applicant: 'Kofi Mensah', score: 780, risk: 'very_low', time: '25 mins ago' },
  { id: 'SCR-FID-20250204-004', applicant: 'Akua Boateng', score: 520, risk: 'high', time: '1 hour ago' },
  { id: 'SCR-FID-20250204-005', applicant: 'Yaw Owusu', score: 695, risk: 'low', time: '2 hours ago' },
];

const getRiskColor = (risk: string) => {
  const colors: Record<string, string> = {
    very_low: 'bg-green-500/10 text-green-600 border-green-200',
    low: 'bg-lime-500/10 text-lime-600 border-lime-200',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    high: 'bg-orange-500/10 text-orange-600 border-orange-200',
    very_high: 'bg-red-500/10 text-red-600 border-red-200',
  };
  return colors[risk] || colors.medium;
};

const getRiskLabel = (risk: string) => {
  return risk.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your credit scoring activity
          </p>
        </div>
        <Button asChild>
          <Link href="/score-requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Score Request
          </Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="flex items-center text-green-600">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {stats.requestsChange}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="flex items-center text-green-600">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {stats.scoreChange}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="flex items-center text-green-600">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                {Math.abs(stats.responseTimeChange)}%
              </span>
              <span className="ml-1">faster than last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Awaiting decision
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Score distribution bar chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>Distribution of credit scores this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk breakdown pie chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Risk Categories</CardTitle>
            <CardDescription>Breakdown by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {riskBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  <span className="text-sm font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Score Requests</CardTitle>
            <CardDescription>Latest credit scoring activity</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/score-requests">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <div 
                key={request.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {request.applicant.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{request.applicant}</p>
                    <p className="text-sm text-muted-foreground">{request.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="font-semibold">{request.score}</p>
                    <p className="text-xs text-muted-foreground">{request.time}</p>
                  </div>
                  <Badge variant="outline" className={getRiskColor(request.risk)}>
                    {getRiskLabel(request.risk)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeleton for the dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
