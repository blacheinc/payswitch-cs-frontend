"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Mock data
const usageData = [
  { date: "Jan 01", requests: 45, approvals: 32 },
  { date: "Jan 05", requests: 52, approvals: 38 },
  { date: "Jan 10", requests: 48, approvals: 35 },
  { date: "Jan 15", requests: 61, approvals: 45 },
  { date: "Jan 20", requests: 55, approvals: 40 },
  { date: "Jan 25", requests: 67, approvals: 52 },
  { date: "Jan 30", requests: 72, approvals: 58 },
];

const riskDistributionData = [
  { name: "Very Low", value: 30 },
  { name: "Low", value: 35 },
  { name: "Medium", value: 20 },
  { name: "High", value: 10 },
  { name: "Very High", value: 5 },
];

const performanceMetrics = {
  totalRequests: { value: 2450, change: 12.5, trend: "up" },
  approvalRate: { value: 78.5, change: 2.1, trend: "up" },
  avgScore: { value: 685, change: -1.2, trend: "down" },
  avgProcessingTime: { value: 450, change: -15.3, trend: "down" }, // ms, down is good
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("30d");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Insights into your credit scoring performance and usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Report Data</DialogTitle>
                <DialogDescription>
                  Download analytics data for external analysis.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2 border p-3 rounded-md w-full cursor-pointer hover:bg-muted/50">
                      <input
                        type="radio"
                        name="format"
                        id="csv"
                        className="accent-primary"
                        defaultChecked
                      />
                      <Label htmlFor="csv" className="cursor-pointer flex-1">
                        CSV (Raw Data)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md w-full cursor-pointer hover:bg-muted/50">
                      <input
                        type="radio"
                        name="format"
                        id="pdf"
                        className="accent-primary"
                      />
                      <Label htmlFor="pdf" className="cursor-pointer flex-1">
                        PDF Report
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select defaultValue={period}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 3 months</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("close-dialog")?.click()
                  }
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Report generated and download started");
                    // Mock download delay
                    setTimeout(() => {}, 1000);
                  }}
                >
                  Download File
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.totalRequests.value.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              {performanceMetrics.totalRequests.trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  performanceMetrics.totalRequests.trend === "up"
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {performanceMetrics.totalRequests.change}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.approvalRate.value}%
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">
                {performanceMetrics.approvalRate.change}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.avgScore.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-500">
                {Math.abs(performanceMetrics.avgScore.change)}%
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Processing Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.avgProcessingTime.value}ms
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">
                {Math.abs(performanceMetrics.avgProcessingTime.change)}%
              </span>
              <span className="ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="volume" className="space-y-4">
        <TabsList>
          <TabsTrigger value="volume">
            <BarChart3 className="mr-2 h-4 w-4" /> Request Volume
          </TabsTrigger>
          <TabsTrigger value="risk">
            <Users className="mr-2 h-4 w-4" /> Risk Profile
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="mr-2 h-4 w-4" /> Model Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="volume" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request & Approval Trends</CardTitle>
              <CardDescription>
                Daily volume of credit score requests and approved applications
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={usageData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRequests"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--primary)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorApprovals"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#22c55e"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      name="Total Requests"
                      stroke="var(--primary)"
                      fillOpacity={1}
                      fill="url(#colorRequests)"
                    />
                    <Area
                      type="monotone"
                      dataKey="approvals"
                      name="Approvals"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorApprovals)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Category Distribution</CardTitle>
              <CardDescription>
                Breakdown of applicants by assessed risk level
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskDistributionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "var(--primary)", opacity: 0.2 }}
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      name="Percentage"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
              <CardDescription>
                Detailed analytics on scoring model stability and accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[350px] text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 opacity-20" />
                  <p className="mt-2 font-medium">
                    No performance anomalies detected
                  </p>
                  <p className="text-sm">
                    Model version lgbm_v2.3.1 operating within expected
                    parameters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
