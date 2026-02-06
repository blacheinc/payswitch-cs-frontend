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
  Lock
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

// ... (Keep existing mockApiKeys or move them here)
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
  {
    id: 'key_3',
    name: 'Old Integration',
    prefix: 'pk_test_...',
    environment: 'sandbox',
    status: 'revoked',
    lastUsed: '2 weeks ago',
    created: '2024-11-05',
  },
];

const mockWebhooks = [
  { id: 'wh_1', url: 'https://api.acme.com/webhooks/score', event: 'score.completed', status: 'active', failures: 0 },
  { id: 'wh_2', url: 'https://api.acme.com/webhooks/alerts', event: 'system.alert', status: 'inactive', failures: 2 },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(mockApiKeys);
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [ipWhitelist, setIpWhitelist] = useState(['192.168.1.5', '10.0.0.12']);
  const [newIp, setNewIp] = useState('');
  
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState('sandbox');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateKey = () => {
    const prefix = newKeyEnv === 'production' ? 'pk_live_' : 'pk_test_';
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const fullKey = `${prefix}${randomString}`;
    
    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      prefix: `${prefix}...`,
      environment: newKeyEnv,
      status: 'active',
      lastUsed: 'Never',
      created: new Date().toISOString().split('T')[0],
    };
    
    setKeys([newKey, ...keys]);
    setGeneratedKey(fullKey);
    toast.success('API Key generated successfully');
  };

  const closeGenerateDialog = () => {
    setIsGenerateOpen(false);
    setGeneratedKey(null);
    setNewKeyName('');
    setNewKeyEnv('sandbox');
    setShowKey(false);
  };

  const handleRevokeKey = (id: string) => {
    setKeys(keys.map(key => 
      key.id === id ? { ...key, status: 'revoked' } : key
    ));
    toast.success('API Key revoked');
  };

  const handleAddIp = () => {
    if (newIp && !ipWhitelist.includes(newIp)) {
      setIpWhitelist([...ipWhitelist, newIp]);
      setNewIp('');
      toast.success('IP Address whitelisted');
    }
  };

  const removeIp = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter(i => i !== ip));
    toast.success('IP Address removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Developer Settings</h1>
          <p className="text-muted-foreground">
            Manage API keys, webhooks, and security configurations
          </p>
        </div>
      </div>

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-4">
          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-3">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{keys.filter(k => k.status === 'active').length}</div>
                <p className="text-xs text-muted-foreground">Across all environments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-muted-foreground">+12.5% from yesterday</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Good</div>
                <p className="text-xs text-muted-foreground">No suspicious activity</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your API Keys</CardTitle>
                <CardDescription>Manage access credentials</CardDescription>
              </div>
              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setGeneratedKey(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate New Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                   {!generatedKey ? (
                    <>
                      <DialogHeader>
                        <DialogTitle>Generate New API Key</DialogTitle>
                        <DialogDescription>
                          Create a new API key for your application.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="keyName">Key Name</Label>
                          <Input
                            id="keyName"
                            placeholder="e.g. Mobile App"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="environment">Environment</Label>
                          <Select value={newKeyEnv} onValueChange={setNewKeyEnv}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandbox">Sandbox</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                        <Button onClick={handleGenerateKey} disabled={!newKeyName}>Generate Key</Button>
                      </DialogFooter>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center justify-center pt-6 pb-2">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                          <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <DialogTitle className="text-center mb-2">API Key Generated</DialogTitle>
                        <DialogDescription className="text-center">
                          Copy this key now. You won't see it again!
                        </DialogDescription>
                      </div>
                      <div className="space-y-4 py-4">
                        <div className="relative">
                          <Input
                            readOnly
                            value={generatedKey}
                            type={showKey ? 'text' : 'password'}
                            className="pr-20 font-mono"
                          />
                          <div className="absolute right-1 top-1 flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowKey(!showKey)}>
                              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(generatedKey, 'new-key')}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                         <Button onClick={closeGenerateDialog} className="w-full">Done</Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{key.prefix}</TableCell>
                      <TableCell>
                        <Badge variant={key.environment === 'production' ? 'default' : 'secondary'}>
                          {key.environment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${key.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="capitalize">{key.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{key.created}</TableCell>
                      <TableCell className="text-right">
                        {key.status === 'active' && (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(key.prefix, key.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRevokeKey(key.id)} className="bg-destructive">Revoke</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Endpoints</CardTitle>
              <CardDescription>
                Configure where we should send real-time events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                 <div className="flex items-end gap-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex-1 space-y-2">
                      <Label>Endpoint URL</Label>
                      <Input placeholder="https://api.yoursite.com/webhooks" />
                    </div>
                    <div className="space-y-2 w-48">
                      <Label>Event Type</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Events</SelectItem>
                          <SelectItem value="score">Score Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button>Add Endpoint</Button>
                 </div>

                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Failures (24h)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((wh) => (
                      <TableRow key={wh.id}>
                        <TableCell className="font-mono">{wh.url}</TableCell>
                        <TableCell>{wh.event}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <Switch checked={wh.status === 'active'} />
                             <span className="text-sm">{wh.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>{wh.failures}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security / IP Whitelist Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IP Whitelisting</CardTitle>
              <CardDescription>
                Restrict API access to specific IP addresses. Leave empty to allow all IPs (not recommended for production).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Input 
                    placeholder="e.g. 192.168.1.5" 
                    className="max-w-xs" 
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                  />
                  <Button onClick={handleAddIp}>Add IP Address</Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Added By</TableHead>
                         <TableHead>Date Added</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ipWhitelist.map((ip, i) => (
                        <TableRow key={i}>
                           <TableCell className="font-mono">{ip}</TableCell>
                           <TableCell>Admin User</TableCell>
                           <TableCell>2025-01-15</TableCell>
                           <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => removeIp(ip)}>
                              Remove
                            </Button>
                           </TableCell>
                        </TableRow>
                      ))}
                      {ipWhitelist.length === 0 && (
                         <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            <Globe className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            No IP restrictions enabled. API is accessible from anywhere.
                          </TableCell>
                         </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
