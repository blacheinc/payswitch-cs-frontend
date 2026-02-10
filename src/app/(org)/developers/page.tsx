'use client';

import { useState } from 'react';
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Zap,
  Lock,
  Terminal,
  BookOpen,
  History,
  Workflow,
  ExternalLink,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data
const mockApiKeys = [
  {
    id: 'key_1',
    name: 'Production Server A',
    prefix: 'pk_live_...',
    environment: 'production',
    status: 'active',
    lastUsed: '2 mins ago',
    created: '2024-12-15',
  },
  {
    id: 'key_2',
    name: 'Development Local',
    prefix: 'pk_test_...',
    environment: 'sandbox',
    status: 'active',
    lastUsed: '1 hour ago',
    created: '2025-01-10',
  },
];

const sandboxLogs = [
  { id: 'log_1', method: 'POST', endpoint: '/v1/score-requests', status: 200, latency: '450ms', time: '5 mins ago' },
  { id: 'log_2', method: 'GET', endpoint: '/v1/score-requests/SCR-001', status: 200, latency: '120ms', time: '12 mins ago' },
  { id: 'log_3', method: 'POST', endpoint: '/v1/score-requests', status: 400, latency: '85ms', time: '1 hour ago', error: 'Missing field: nationalId' },
  { id: 'log_4', method: 'GET', endpoint: '/v1/models', status: 200, latency: '54ms', time: '2 hours ago' },
];

const apiEndpoints = [
  {
    method: 'POST',
    path: '/v1/score-requests',
    description: 'Submit an applicant for credit scoring.',
    params: [
      { name: 'applicant', type: 'object', required: true, description: 'Personal details of the applicant.' },
      { name: 'loanRequest', type: 'object', required: true, description: 'Loan amount and tenure.' },
      { name: 'alternativeData', type: 'object', required: false, description: 'Optional Telco/Utility signals.' }
    ]
  },
  {
    method: 'GET',
    path: '/v1/score-requests/{id}',
    description: 'Retrieve the result of a scoring request.',
    params: [
      { name: 'id', type: 'string', required: true, description: 'The unique request ID (SCR-...).' }
    ]
  }
];

export default function DevelopersPage() {
  const [keys, setKeys] = useState(mockApiKeys);
  const [ipWhitelist, setIpWhitelist] = useState(['192.168.1.5']);
  const [newIp, setNewIp] = useState('');
  
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState('sandbox');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleGenerateKey = () => {
    const prefix = newKeyEnv === 'production' ? 'pk_live_' : 'pk_test_';
    const randomString = Math.random().toString(36).substring(2, 15);
    const fullKey = `${prefix}${randomString}`;
    
    setKeys([{
      id: `key_${Date.now()}`,
      name: newKeyName,
      prefix: `${prefix}...`,
      environment: newKeyEnv,
      status: 'active',
      lastUsed: 'Never',
      created: new Date().toISOString().split('T')[0],
    }, ...keys]);
    
    setGeneratedKey(fullKey);
    toast.success('API Key generated');
  };

  const handleAddIp = () => {
    if (newIp && !ipWhitelist.includes(newIp)) {
      setIpWhitelist([...ipWhitelist, newIp]);
      setNewIp('');
      toast.success('IP whitelisted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            Developer Portal
          </h1>
          <p className="text-muted-foreground">
            API integration tools, documentation, and sandbox environment
          </p>
        </div>
      </div>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys" className="gap-2">
            <Key className="h-4 w-4" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <BookOpen className="h-4 w-4" /> Documentation
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" /> Sandbox Logs
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Workflow className="h-4 w-4" /> Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Authentication Keys</CardTitle>
                <CardDescription>Secret keys used to authenticate your requests</CardDescription>
              </div>
              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setGeneratedKey(null)}>
                    <Plus className="mr-2 h-4 w-4" /> Generate New Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {!generatedKey ? (
                    <>
                      <DialogHeader>
                        <DialogTitle>Generate API Key</DialogTitle>
                        <DialogDescription>Create a new key to access the PaySwitch API.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Key Name</Label>
                          <Input placeholder="e.g. ERP Integration" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Environment</Label>
                          <Select value={newKeyEnv} onValueChange={setNewKeyEnv}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                              <SelectItem value="production">Production (Real Data)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleGenerateKey} disabled={!newKeyName}>Generate</Button>
                      </DialogFooter>
                    </>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex gap-2">
                         <AlertTriangle className="h-4 w-4 shrink-0" />
                         Make sure to copy your key now. You won't be able to see it again.
                      </div>
                      <div className="relative">
                        <Input readOnly value={generatedKey} type={showKey ? 'text' : 'password'} className="pr-20 font-mono" />
                        <div className="absolute right-1 top-1 flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowKey(!showKey)}>
                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(generatedKey)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button onClick={() => setIsGenerateOpen(false)} className="w-full">Done</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map(key => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell className="font-mono text-xs">{key.prefix}</TableCell>
                      <TableCell>
                        <Badge variant={key.environment === 'production' ? 'default' : 'secondary'}>{key.environment}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{key.lastUsed}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IP Whitelist</CardTitle>
              <CardDescription>Restrict API calls to specific originating IP addresses (Production only)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 max-w-sm mb-4">
                <Input placeholder="e.g. 154.160.2.1" value={newIp} onChange={e => setNewIp(e.target.value)} />
                <Button variant="outline" onClick={handleAddIp}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ipWhitelist.map(ip => (
                  <Badge key={ip} variant="secondary" className="pl-3 pr-1 py-1 gap-2">
                    {ip}
                    <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full" onClick={() => setIpWhitelist(ipWhitelist.filter(i => i !== ip))}>
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-1 border-r pr-4 space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Introduction</p>
              <Button variant="ghost" className="w-full justify-start text-sm bg-accent">Getting Started</Button>
              <Button variant="ghost" className="w-full justify-start text-sm">Authentication</Button>
              <p className="text-xs font-bold text-muted-foreground uppercase mt-4 mb-2">Endpoints</p>
              {apiEndpoints.map(e => (
                <Button key={e.path} variant="ghost" className="w-full justify-start text-xs font-mono">
                  <span className={`mr-2 ${e.method === 'POST' ? 'text-blue-600' : 'text-green-600'}`}>{e.method}</span>
                  {e.path}
                </Button>
              ))}
            </div>
            <div className="md:col-span-3 space-y-6">
               <div className="space-y-2">
                  <h2 className="text-xl font-bold">Getting Started</h2>
                  <p className="text-sm text-muted-foreground">The PaySwitch Credit Scoring API allows you to programmatically submit credit score requests and receive results in real-time.</p>
               </div>
               
               <div className="p-4 bg-muted rounded-lg font-mono text-xs">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground"># Example Request</span>
                    <Copy className="h-4 w-4 cursor-pointer hover:text-primary" onClick={() => handleCopy('curl -X POST https://api.payswitch.gh/v1/score-requests ...')} />
                  </div>
                  <pre className="overflow-x-auto">
{`curl -X POST https://api.payswitch.gh/v1/score-requests \\
  -H "Authorization: Bearer pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "applicant": {
      "fullName": "John Doe",
      "nationalId": "GHA-78234-1"
    },
    "loanRequest": {
      "amount": 5000,
      "tenureMonths": 12
    }
  }'`}
                  </pre>
               </div>

               <Card>
                 <CardHeader>
                    <CardTitle className="text-sm">Response Sample</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <pre className="text-xs font-mono bg-muted p-3 rounded-md">
{`{
  "requestId": "SCR-FID-20250210-001",
  "status": "completed",
  "score": {
    "value": 724,
    "riskCategory": "low"
  }
}`}
                    </pre>
                 </CardContent>
               </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Sandbox Activity</CardTitle>
              <CardDescription>Recent requests made using test API keys</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sandboxLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell><Badge variant="outline" className={log.method === 'POST' ? 'text-blue-600' : 'text-green-600'}>{log.method}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{log.endpoint}</TableCell>
                      <TableCell>
                         <Badge className={log.status === 200 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {log.status}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.latency}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.time}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
