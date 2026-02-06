'use client';

import { useState } from 'react';
import { 
  MoreHorizontal, 
  Search, 
  Plus,
  Lock,
  Unlock,
  Building2,
  Mail,
  Phone,
  MapPin,
  User
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Mock data compliant with PRD Organization interface
const mockOrgs = [
  {
    id: 'org_1',
    name: 'MTN Ghana',
    shortName: 'MTN',
    industryType: 'Telecommunications',
    status: 'active',
    address: 'Independence Avenue, Accra',
    primaryContactName: 'Derrick Alabi',
    primaryContactEmail: 'derrick.alabi@mtn.com',
    primaryContactPhone: '+233244000000',
    users: 12,
    requests: '15.2k',
    joined: '2024-05-12',
    logo: '',
  },
  {
    id: 'org_2',
    name: 'Fidelity Bank',
    shortName: 'Fidelity',
    industryType: 'Banking',
    status: 'active',
    address: 'Ridge Towers, Accra',
    primaryContactName: 'Sarah Mensah',
    primaryContactEmail: 's.mensah@fidelity.com.gh',
    primaryContactPhone: '+233200000000',
    users: 45,
    requests: '28.5k',
    joined: '2024-06-01',
    logo: '',
  },
  {
    id: 'org_3',
    name: 'QuickCredit',
    shortName: 'QuickCredit',
    industryType: 'Microfinance',
    status: 'suspended',
    address: 'Circle, Accra',
    primaryContactName: 'John Doe',
    primaryContactEmail: 'admin@quickcredit.com',
    primaryContactPhone: '+233500000000',
    users: 8,
    requests: '5.1k',
    joined: '2024-08-15',
    logo: '',
  },
];

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState(mockOrgs);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // New Org Form State
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgShortName, setNewOrgShortName] = useState('');
  const [newOrgIndustry, setNewOrgIndustry] = useState('fintech');
  const [newOrgAddress, setNewOrgAddress] = useState('');
  const [newOrgContactName, setNewOrgContactName] = useState('');
  const [newOrgContactEmail, setNewOrgContactEmail] = useState('');
  const [newOrgContactPhone, setNewOrgContactPhone] = useState('');

  // Edit Org Form State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editShortName, setEditShortName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  
  const filteredOrgs = orgs.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.industryType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddOrg = () => {
    const newOrg = {
      id: `org_${Date.now()}`,
      name: newOrgName,
      shortName: newOrgShortName,
      industryType: newOrgIndustry,
      status: 'pending',
      address: newOrgAddress,
      primaryContactName: newOrgContactName,
      primaryContactEmail: newOrgContactEmail,
      primaryContactPhone: newOrgContactPhone,
      users: 0,
      requests: '0',
      joined: new Date().toISOString().split('T')[0],
      logo: '',
    };
    
    setOrgs([...orgs, newOrg]);
    setIsAddOpen(false);
    resetForm();
    toast.success('Organization created successfully');
  };

  const resetForm = () => {
    setNewOrgName('');
    setNewOrgShortName('');
    setNewOrgIndustry('fintech');
    setNewOrgAddress('');
    setNewOrgContactName('');
    setNewOrgContactEmail('');
    setNewOrgContactPhone('');
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setOrgs(orgs.map(org => 
      org.id === id ? { ...org, status: newStatus } : org
    ));
    toast.success(`Organization ${newStatus}`);
  };

  const handleEditClick = (org: any) => {
    setEditingOrg(org);
    setEditName(org.name);
    setEditShortName(org.shortName);
    setEditIndustry(org.industryType);
    setIsEditOpen(true);
  };

  const handleUpdateOrg = () => {
    setOrgs(orgs.map(org => 
      org.id === editingOrg.id 
        ? { ...org, name: editName, shortName: editShortName, industryType: editIndustry }
        : org
    ));
    setIsEditOpen(false);
    toast.success('Organization updated successfully');
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage client organizations and their subscription tiers
          </p>
        </div>
        
        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Organization</DialogTitle>
              <DialogDescription>
                Onboard a new client to the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium leading-none text-muted-foreground">Organization Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      placeholder="e.g. Ecobank Ghana Ltd"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shortName">Short Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="shortName"
                      placeholder="e.g. Ecobank"
                      value={newOrgShortName}
                      onChange={(e) => setNewOrgShortName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry Type <span className="text-red-500">*</span></Label>
                    <Select value={newOrgIndustry} onValueChange={setNewOrgIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="fintech">Fintech</SelectItem>
                        <SelectItem value="mfi">Microfinance (MFI)</SelectItem>
                        <SelectItem value="sacco">SACCO</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Physical Address"
                      value={newOrgAddress}
                      onChange={(e) => setNewOrgAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium leading-none text-muted-foreground">Primary Contact</h3>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactName"
                      placeholder="Full Name"
                      className="pl-8"
                      value={newOrgContactName}
                      onChange={(e) => setNewOrgContactName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="email@company.com"
                        className="pl-8"
                        value={newOrgContactEmail}
                        onChange={(e) => setNewOrgContactEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactPhone"
                        placeholder="+233..."
                        className="pl-8"
                        value={newOrgContactPhone}
                        onChange={(e) => setNewOrgContactPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddOrg} disabled={!newOrgName || !newOrgShortName || !newOrgContactName || !newOrgContactEmail}>
                Create Organization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>
                Update details for {editingOrg?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Organization Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="edit-shortname">Short Name</Label>
                 <Input
                   id="edit-shortname"
                   value={editShortName}
                   onChange={(e) => setEditShortName(e.target.value)}
                 />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-industry">Industry Type</Label>
                <Select value={editIndustry} onValueChange={setEditIndustry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="fintech">Fintech</SelectItem>
                    <SelectItem value="mfi">Microfinance (MFI)</SelectItem>
                    <SelectItem value="sacco">SACCO</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateOrg}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Orgs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Organizations</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={org.logo} />
                        <AvatarFallback>{getInitials(org.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{org.name}</span>
                        <span className="text-xs text-muted-foreground">{org.shortName}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{org.industryType}</TableCell>
                  <TableCell>
                    {org.status === 'active' ? (
                      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                    ) : org.status === 'suspended' ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : ( 
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{org.primaryContactName}</span>
                      <span className="text-xs text-muted-foreground">{org.primaryContactEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>{org.requests}</TableCell>
                  <TableCell>{org.users}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Assessment</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(org)}>
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem 
                          onClick={() => toggleStatus(org.id, org.status)}
                          className={org.status === 'active' ? 'text-orange-600' : 'text-green-600'}
                        >
                          {org.status === 'active' ? (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              Suspend Access
                            </>
                          ) : (
                            <>
                              <Unlock className="mr-2 h-4 w-4" />
                              Activate Access
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
