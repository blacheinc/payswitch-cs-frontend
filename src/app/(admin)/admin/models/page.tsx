'use client';

import { useState } from 'react';
import { 
  Bot, 
  UploadCloud, 
  GitBranch, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  Activity,
  History,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data
const models = [
  {
    id: 'mdl_v2.3.1',
    name: 'Credit Risk XGBoost',
    version: 'v2.3.1',
    status: 'production',
    isChampion: true,
    accuracy: 94.2,
    latency: '145ms',
    deployed: '2025-01-15',
    author: 'Data Science Team',
  },
  {
    id: 'mdl_v2.4.0-beta',
    name: 'Credit Risk XGBoost',
    version: 'v2.4.0-beta',
    status: 'staging',
    isChampion: false,
    accuracy: 95.8,
    latency: '152ms',
    deployed: '2025-02-01',
    author: 'Data Science Team',
  },
  {
    id: 'mdl_v1.0.0',
    name: 'Legacy Logistic Regression',
    version: 'v1.0.0',
    status: 'archived',
    isChampion: false,
    accuracy: 88.5,
    latency: '98ms',
    deployed: '2024-06-10',
    author: 'Legacy Team',
  },
];

export default function ModelsPage() {
  const [activeTab, setActiveTab] = useState('registry');

  const handlePromote = (id: string, version: string) => {
    toast.success(`Promoted ${version} to Production. All traffic redirected.`);
  };

  const handleRollback = (id: string, version: string) => {
    toast.warning(`Rolling back to ${version}. Previous production model archived.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'production':
        return <Badge className="bg-green-500 hover:bg-green-600">Production</Badge>;
      case 'staging':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Staging</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Model Management</h1>
          <p className="text-muted-foreground">
            Manage, deploy, and monitor credit scoring models
          </p>
        </div>
        <Button>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload New Model
        </Button>
      </div>

      <Tabs defaultValue="registry" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registry">Model Registry</TabsTrigger>
          <TabsTrigger value="monitoring">Performance Monitoring</TabsTrigger>
          <TabsTrigger value="comparison">Comparison & Fairness</TabsTrigger>
          <TabsTrigger value="training">Training Jobs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Models</CardTitle>
              <CardDescription>
                Version history and deployment status of all models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Accuracy (AUC)</TableHead>
                    <TableHead>Avg Latency</TableHead>
                    <TableHead>Deployed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 font-medium">
                            <Bot className="h-4 w-4 text-muted-foreground" />
                            {model.name}
                          </div>
                          {model.isChampion && (
                            <Badge variant="outline" className="w-fit text-[10px] bg-yellow-50 text-yellow-700 border-yellow-200">
                              <CheckCircle className="w-3 h-3 mr-1" /> CHAMPION
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{model.version}</TableCell>
                      <TableCell>{getStatusBadge(model.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={model.accuracy > 90 ? 'text-green-600 font-medium' : ''}>
                            {model.accuracy}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{model.latency}</TableCell>
                      <TableCell>{model.deployed}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Metrics</DropdownMenuItem>
                            {model.status !== 'production' && (
                              <DropdownMenuItem onClick={() => handlePromote(model.id, model.version)}>
                                <GitBranch className="mr-2 h-4 w-4" />
                                Promote to Production
                              </DropdownMenuItem>
                            )}
                            {model.status === 'production' && (
                              <DropdownMenuItem onClick={() => handleRollback(model.id, 'v2.2.0')} className="text-destructive font-semibold">
                                <History className="mr-2 h-4 w-4" />
                                EMERGENCY ROLLBACK
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>Download Artifact</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monitoring">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Champion Model Performance</CardTitle>
                <CardDescription>Real-time metrics for v2.3.1</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>KS Statistic</span>
                    <span className="font-medium">0.45</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Gini Coefficient</span>
                    <span className="font-medium">0.68</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Population Stability Index (PSI)</span>
                    <span className="font-medium text-green-600">0.08</span>
                  </div>
                  <Progress value={8} className="h-2 bg-green-100" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Data Drift Alerts</CardTitle>
                <CardDescription>Feature distribution shifts detecting in last 24h</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-700">
                        Significant increase in high-income applicants detected. PSI = 0.28 (&gt;0.25 threshold).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center p-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    No other critical alerts
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
         <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Champion vs Challenger Analysis</CardTitle>
              <CardDescription>
                Compare performance metrics of the current production model against candidates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 border rounded-lg bg-green-50/50 border-green-100">
                      <div className="flex items-center gap-2 mb-4">
                         <Badge className="bg-green-600">Champion</Badge>
                         <span className="font-semibold">v2.3.1</span>
                      </div>
                      <div className="space-y-2 text-sm">
                         <div className="flex justify-between"><span>AUC</span><span className="font-medium">0.942</span></div>
                         <div className="flex justify-between"><span>Gini</span><span className="font-medium">0.680</span></div>
                         <div className="flex justify-between"><span>KS</span><span className="font-medium">0.450</span></div>
                         <div className="flex justify-between text-muted-foreground"><span>Latency</span><span>145ms</span></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center text-muted-foreground">
                       <span className="text-sm px-3 py-1 bg-muted rounded-full">vs</span>
                    </div>

                    <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-100">
                      <div className="flex items-center gap-2 mb-4">
                         <Badge className="bg-blue-600">Challenger</Badge>
                         <span className="font-semibold">v2.4.0-beta</span>
                      </div>
                      <div className="space-y-2 text-sm">
                         <div className="flex justify-between"><span>AUC</span><span className="font-medium text-green-600">0.958 (+1.6%)</span></div>
                         <div className="flex justify-between"><span>Gini</span><span className="font-medium text-green-600">0.710 (+3.0%)</span></div>
                         <div className="flex justify-between"><span>KS</span><span className="font-medium text-green-600">0.485 (+3.5%)</span></div>
                         <div className="flex justify-between text-muted-foreground"><span>Latency</span><span>152ms (+4.8%)</span></div>
                      </div>
                    </div>
                 </div>

                 <div className="rounded-lg border p-4">
                    <h4 className="font-medium mb-4">Fairness Assessment</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                          <p className="text-muted-foreground mb-1">Demographic Parity</p>
                          <div className="flex items-center gap-2">
                             <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[95%]"></div>
                             </div>
                             <span>0.95</span>
                          </div>
                       </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Equal Opportunity</p>
                          <div className="flex items-center gap-2">
                             <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[98%]"></div>
                             </div>
                             <span>0.98</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex justify-end gap-2">
                    <Button variant="outline">View Detailed Report</Button>
                    <Button>Promote Challenger</Button>
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>Recent Training Jobs</CardTitle>
              <CardDescription>
                History of automated retraining pipelines
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <History className="h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-foreground">No active jobs</h3>
                <p className="max-w-sm mt-2">
                  Scheduled retraining will run in 3 days. You can manually trigger a new training run.
                </p>
                <Button variant="outline" className="mt-4">
                  <Play className="mr-2 h-4 w-4" />
                  Start Training
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
