'use client';

import { useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function BulkUploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  
  // Mock history data
  const [history, setHistory] = useState([
    { id: 'job_123', name: 'loans_sept_2025.csv', date: '2025-02-03 14:20', records: 450, status: 'completed' },
    { id: 'job_122', name: 'batch_upload_v2.xlsx', date: '2025-02-01 09:15', records: 120, status: 'completed' },
    { id: 'job_121', name: 'failed_import.csv', date: '2025-01-28 16:45', records: 0, status: 'failed' },
  ]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setUploadStatus('uploading');
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus('processing');
          
          // Simulate processing delay
          setTimeout(() => {
            setUploadStatus('completed');
            toast.success('Batch processing completed successfully');
            setHistory([
              { 
                id: `job_${Date.now()}`, 
                name: file.name, 
                date: new Date().toISOString().slice(0, 16).replace('T', ' '), 
                records: Math.floor(Math.random() * 500) + 50, 
                status: 'completed' 
              },
              ...history
            ]);
          }, 2000);
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Score Requests</h1>
        <p className="text-muted-foreground">
          Upload CSV or Excel files to process multiple credit score requests at once.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Supported formats: .csv, .xlsx, .xls (Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 rounded-full bg-muted">
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Drag & drop your file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ensure your file matches the <span className="text-primary cursor-pointer hover:underline">template format</span>
                  </p>
                </div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                />
                <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  Select File
                </Button>
              </div>
            </div>

            {file && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  {uploadStatus === 'idle' && (
                    <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {uploadStatus === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>

                {uploadStatus !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                       <span>
                        {uploadStatus === 'uploading' && 'Uploading...'}
                        {uploadStatus === 'processing' && 'Processing records...'}
                        {uploadStatus === 'completed' && 'Completed'}
                       </span>
                       <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={handleUpload} 
                  disabled={uploadStatus !== 'idle'}
                >
                  {uploadStatus === 'idle' ? 'Start Processing' : 'Processing...'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions / Validation */}
        <Card>
          <CardHeader>
            <CardTitle>Guidelines</CardTitle>
            <CardDescription>Follow these rules to ensure successful processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Required Columns</p>
                  <p className="text-xs text-muted-foreground">
                    First Name, Last Name, Date of Birth, ID Number, ID Type, Phone Number
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Date Format</p>
                  <p className="text-xs text-muted-foreground">
                    Use YYYY-MM-DD for all date fields (e.g. 1990-01-31)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Record Limit</p>
                  <p className="text-xs text-muted-foreground">
                    Maximum 1,000 records per batch. For larger datasets, please split into multiple files.
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                 <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                 </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Batch History</CardTitle>
          <CardDescription>Recent bulk processing jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Records Processed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      {job.name}
                    </div>
                  </TableCell>
                  <TableCell>{job.date}</TableCell>
                  <TableCell>{job.records}</TableCell>
                  <TableCell>
                    {job.status === 'completed' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                       Download Results
                    </Button>
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
