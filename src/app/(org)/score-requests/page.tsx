'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  UploadCloud, 
  MoreHorizontal,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Mock data
const scoreRequests = [
  {
    id: 'SCR-FID-20250204-001',
    referenceId: 'LOAN-2025-00456',
    applicantName: 'Kwame Asante',
    status: 'completed',
    score: 720,
    riskCategory: 'low',
    decision: 'approved',
    createdAt: '2025-02-04T14:32:00Z',
  },
  {
    id: 'SCR-FID-20250204-002',
    referenceId: 'LOAN-2025-00457',
    applicantName: 'Ama Serwaa',
    status: 'completed',
    score: 645,
    riskCategory: 'medium',
    decision: 'pending',
    createdAt: '2025-02-04T13:15:00Z',
  },
  {
    id: 'SCR-FID-20250204-003',
    referenceId: 'LOAN-2025-00458',
    applicantName: 'Kofi Mensah',
    status: 'completed',
    score: 780,
    riskCategory: 'very_low',
    decision: 'approved',
    createdAt: '2025-02-04T11:45:00Z',
  },
  {
    id: 'SCR-FID-20250204-004',
    referenceId: 'LOAN-2025-00459',
    applicantName: 'Akua Boateng',
    status: 'completed',
    score: 520,
    riskCategory: 'high',
    decision: 'declined',
    createdAt: '2025-02-04T10:30:00Z',
  },
  {
    id: 'SCR-FID-20250204-005',
    referenceId: 'LOAN-2025-00460',
    applicantName: 'Yaw Owusu',
    status: 'processing',
    score: null,
    riskCategory: null,
    decision: null,
    createdAt: '2025-02-04T09:20:00Z',
  },
  {
    id: 'SCR-FID-20250203-001',
    referenceId: 'LOAN-2025-00455',
    applicantName: 'Abena Darko',
    status: 'completed',
    score: 695,
    riskCategory: 'low',
    decision: 'approved',
    createdAt: '2025-02-03T16:45:00Z',
  },
  {
    id: 'SCR-FID-20250203-002',
    referenceId: 'LOAN-2025-00454',
    applicantName: 'Kwesi Appiah',
    status: 'failed',
    score: null,
    riskCategory: null,
    decision: null,
    createdAt: '2025-02-03T15:30:00Z',
  },
  {
    id: 'SCR-FID-20250203-003',
    referenceId: 'LOAN-2025-00453',
    applicantName: 'Efua Mensah',
    status: 'completed',
    score: 710,
    riskCategory: 'low',
    decision: 'pending',
    createdAt: '2025-02-03T14:15:00Z',
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    completed: { variant: 'default', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    processing: { variant: 'secondary', icon: <Clock className="w-3 h-3 mr-1 animate-spin" /> },
    pending: { variant: 'outline', icon: <Clock className="w-3 h-3 mr-1" /> },
    failed: { variant: 'destructive', icon: <XCircle className="w-3 h-3 mr-1" /> },
  };
  const config = variants[status] || variants.pending;
  return (
    <Badge variant={config.variant} className="capitalize">
      {config.icon}
      {status}
    </Badge>
  );
};

const getRiskBadge = (risk: string | null) => {
  if (!risk) return <span className="text-muted-foreground">—</span>;
  
  const colors: Record<string, string> = {
    very_low: 'bg-green-500/10 text-green-600 border-green-200',
    low: 'bg-lime-500/10 text-lime-600 border-lime-200',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    high: 'bg-orange-500/10 text-orange-600 border-orange-200',
    very_high: 'bg-red-500/10 text-red-600 border-red-200',
  };
  
  const label = risk.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <Badge variant="outline" className={colors[risk]}>
      {label}
    </Badge>
  );
};

const getDecisionBadge = (decision: string | null) => {
  if (!decision) return <span className="text-muted-foreground">—</span>;
  
  const styles: Record<string, string> = {
    approved: 'text-green-600',
    declined: 'text-red-600',
    referred: 'text-yellow-600',
    pending: 'text-muted-foreground',
  };
  
  return (
    <span className={`font-medium capitalize ${styles[decision] || styles.pending}`}>
      {decision}
    </span>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function ScoreRequestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const filteredRequests = scoreRequests.filter((request) => {
    const matchesSearch = 
      request.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.referenceId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || request.riskCategory === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredRequests.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredRequests.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((r) => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Score Requests</h1>
          <p className="text-muted-foreground">
            View and manage credit score requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <Link href="/score-requests/bulk">
              <UploadCloud className="mr-2 h-4 w-4" />
              Bulk Request
            </Link>
          </Button>
          <Button asChild>
            <Link href="/score-requests/new">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="very_low">Very Low</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="very_high">Very High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Results</CardTitle>
              <CardDescription>
                {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRows.length} selected
                </span>
                <Button variant="outline" size="sm">
                  Export Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRows.length === filteredRequests.length && filteredRequests.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(request.id)}
                        onCheckedChange={() => toggleSelectRow(request.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/score-requests/${request.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {request.id}
                      </Link>
                      <p className="text-xs text-muted-foreground">{request.referenceId}</p>
                    </TableCell>
                    <TableCell className="font-medium">{request.applicantName}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-center">
                      {request.score ? (
                        <span className="font-semibold">{request.score}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getRiskBadge(request.riskCategory)}</TableCell>
                    <TableCell>{getDecisionBadge(request.decision)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/score-requests/${request.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No score requests found</p>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/score-requests/new">
                            Create New Request
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredRequests.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing 1 to {filteredRequests.length} of {filteredRequests.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
