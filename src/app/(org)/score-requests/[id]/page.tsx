'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  User,
  Briefcase,
  CreditCard,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Mock data for score request detail
const scoreRequest = {
  id: 'SCR-FID-20250204-001',
  referenceId: 'LOAN-2025-00456',
  status: 'completed',
  applicant: {
    fullName: 'Kwame Asante',
    dateOfBirth: '1985-03-15',
    nationalIdType: 'Ghana Card',
    nationalIdNumber: 'GHA-123456789-0',
    phone: '+233 20 123 4567',
    email: 'kwame.asante@email.com',
    address: '123 Independence Ave, Accra',
  },
  employment: {
    status: 'Employed',
    employer: 'MTN Ghana',
    jobTitle: 'Sales Manager',
    duration: '5 years',
    monthlyIncome: 8500,
  },
  loanRequest: {
    amount: 50000,
    tenure: 24,
    purpose: 'Business',
  },
  score: {
    value: 720,
    maxValue: 850,
    minValue: 300,
    percentile: 65,
    riskCategory: 'low',
    confidence: 0.87,
    dataQualityFlag: 'sufficient',
  },
  scoreComponents: {
    paymentHistory: { score: 185, maxScore: 200, grade: 'A' },
    creditUtilization: { score: 120, maxScore: 150, grade: 'B' },
    creditHistoryLength: { score: 80, maxScore: 150, grade: 'C' },
    creditMix: { score: 90, maxScore: 100, grade: 'A' },
    newCredit: { score: 45, maxScore: 50, grade: 'A' },
    incomeStability: { score: 110, maxScore: 120, grade: 'A' },
    debtBurden: { score: 90, maxScore: 130, grade: 'B' },
  },
  riskFactors: [
    {
      code: 'RF001',
      category: 'debt',
      description: 'High debt-to-income ratio',
      impact: 'negative',
      severity: 'high',
      detail: 'DTI ratio is 0.45, exceeding the recommended 0.40 threshold',
    },
    {
      code: 'RF002',
      category: 'credit_age',
      description: 'Limited credit history length',
      impact: 'negative',
      severity: 'medium',
      detail: 'Credit file age is 3 years, below optimal 5+ years',
    },
    {
      code: 'RF003',
      category: 'payment_history',
      description: 'Consistent payment record',
      impact: 'positive',
      severity: 'low',
      detail: 'No late payments recorded in the past 24 months',
    },
    {
      code: 'RF004',
      category: 'income',
      description: 'Stable employment history',
      impact: 'positive',
      severity: 'low',
      detail: 'Employed at current company for 5+ years',
    },
  ],
  recommendations: [
    {
      type: 'verify',
      message: 'Verify income with 3 months bank statements',
      priority: 'required',
    },
    {
      type: 'condition',
      message: 'Consider requiring guarantor for amounts > GHS 30,000',
      priority: 'recommended',
    },
    {
      type: 'approve',
      message: 'Applicant qualifies for standard terms',
      priority: 'optional',
    },
  ],
  affordability: {
    estimatedMonthlyPayment: 2450,
    debtToIncomeCurrent: 0.35,
    debtToIncomeProjected: 0.45,
    disposableIncome: 3200,
    assessment: 'manageable',
    maxRecommendedAmount: 45000,
  },
  timestamps: {
    requestedAt: '2025-02-04T14:32:10Z',
    scoredAt: '2025-02-04T14:32:15Z',
    validUntil: '2025-02-18T14:32:15Z',
  },
  modelInfo: {
    modelVersion: 'lgbm_v2.3.1',
    modelType: 'LightGBM Ensemble',
    featuresUsed: 127,
  },
  decision: null,
};

const getRiskColor = (risk: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    very_low: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500' },
    low: { bg: 'bg-lime-500', text: 'text-lime-600', border: 'border-lime-500' },
    medium: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500' },
    high: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500' },
    very_high: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500' },
  };
  return colors[risk] || colors.medium;
};

const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    A: 'text-green-600 bg-green-100',
    B: 'text-lime-600 bg-lime-100',
    C: 'text-yellow-600 bg-yellow-100',
    D: 'text-orange-600 bg-orange-100',
    F: 'text-red-600 bg-red-100',
  };
  return colors[grade] || colors.C;
};

const getImpactIcon = (impact: string) => {
  if (impact === 'positive') return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (impact === 'negative') return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const getSeverityBadge = (severity: string, impact: string) => {
  const isPositive = impact === 'positive';
  const colors: Record<string, string> = {
    high: isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
    medium: isPositive ? 'bg-lime-100 text-lime-700' : 'bg-orange-100 text-orange-700',
    low: 'bg-gray-100 text-gray-700',
  };
  return (
    <Badge variant="outline" className={colors[severity]}>
      {severity}
    </Badge>
  );
};

export default function ScoreRequestDetailPage() {
  const params = useParams();
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [decision, setDecision] = useState<string>('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');

  const riskColors = getRiskColor(scoreRequest.score.riskCategory);
  const scorePercentage = ((scoreRequest.score.value - scoreRequest.score.minValue) / 
    (scoreRequest.score.maxValue - scoreRequest.score.minValue)) * 100;

  const handleRecordDecision = () => {
    // Handle decision submission
    console.log({ decision, approvedAmount, decisionNotes });
    setDecisionDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/score-requests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{scoreRequest.id}</h1>
              <Badge variant="default" className="capitalize">
                <CheckCircle className="w-3 h-3 mr-1" />
                {scoreRequest.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Ref: {scoreRequest.referenceId}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
            <DialogTrigger asChild>
              <Button>Record Decision</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Lending Decision</DialogTitle>
                <DialogDescription>
                  Record your lending decision for this credit score request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Decision</Label>
                  <Select value={decision} onValueChange={setDecision}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="referred">Referred for Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {decision === 'approved' && (
                  <div className="space-y-2">
                    <Label>Approved Amount (GHS)</Label>
                    <Input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDecisionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRecordDecision}>
                  Save Decision
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - Score card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score display card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Score gauge */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 min-w-[200px]">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-muted/20"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${scorePercentage * 4.4} 440`}
                        strokeLinecap="round"
                        className={riskColors.text}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{scoreRequest.score.value}</span>
                      <span className="text-sm text-muted-foreground">/ {scoreRequest.score.maxValue}</span>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn('mt-4 text-sm capitalize', riskColors.text, riskColors.border)}
                  >
                    {scoreRequest.score.riskCategory.replace('_', ' ')} Risk
                  </Badge>
                </div>

                {/* Score summary */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Percentile Rank</p>
                      <p className="text-2xl font-semibold">Top {100 - scoreRequest.score.percentile}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className="text-2xl font-semibold">{Math.round(scoreRequest.score.confidence * 100)}%</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Data Quality</p>
                      <Badge variant="outline" className="capitalize mt-1">
                        {scoreRequest.score.dataQualityFlag.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Model Version</p>
                      <p className="font-medium mt-1">{scoreRequest.modelInfo.modelVersion}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valid Until</p>
                      <p className="font-medium mt-1">
                        {new Date(scoreRequest.timestamps.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Features Used</p>
                      <p className="font-medium mt-1">{scoreRequest.modelInfo.featuresUsed}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score components */}
          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
              <CardDescription>How the score is calculated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(scoreRequest.scoreComponents).map(([key, component]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {component.score}/{component.maxScore}
                      </span>
                      <Badge className={cn('w-6 h-6 justify-center', getGradeColor(component.grade))}>
                        {component.grade}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={(component.score / component.maxScore) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Risk factors */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Factors</CardTitle>
              <CardDescription>Factors affecting the credit score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoreRequest.riskFactors.map((factor) => (
                <div 
                  key={factor.code} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="mt-0.5">
                    {getImpactIcon(factor.impact)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{factor.description}</span>
                      {getSeverityBadge(factor.severity, factor.impact)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {factor.detail}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Suggested actions for the lending decision</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scoreRequest.recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  {rec.type === 'approve' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                  {rec.type === 'verify' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                  {rec.type === 'condition' && <Clock className="h-5 w-5 text-blue-600 mt-0.5" />}
                  {rec.type === 'decline' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-medium">{rec.message}</p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Affordability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Affordability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Est. Monthly Payment</span>
                <span className="font-semibold">GHS {scoreRequest.affordability.estimatedMonthlyPayment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current DTI</span>
                <span className="font-semibold">{Math.round(scoreRequest.affordability.debtToIncomeCurrent * 100)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Projected DTI</span>
                <span className="font-semibold">{Math.round(scoreRequest.affordability.debtToIncomeProjected * 100)}%</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Disposable Income</span>
                <span className="font-semibold text-green-600">GHS {scoreRequest.affordability.disposableIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Max Recommended</span>
                <span className="font-semibold">GHS {scoreRequest.affordability.maxRecommendedAmount.toLocaleString()}</span>
              </div>
              <Badge 
                variant="outline" 
                className="w-full justify-center capitalize py-2"
              >
                {scoreRequest.affordability.assessment}
              </Badge>
            </CardContent>
          </Card>

          {/* Applicant info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Applicant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{scoreRequest.applicant.fullName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ID Number</p>
                <p className="font-medium">{scoreRequest.applicant.nationalIdNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{scoreRequest.applicant.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Employment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Employment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{scoreRequest.employment.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Employer</p>
                <p className="font-medium">{scoreRequest.employment.employer}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly Income</p>
                <p className="font-medium">GHS {scoreRequest.employment.monthlyIncome.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Loan request */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Loan Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium">GHS {scoreRequest.loanRequest.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tenure</p>
                <p className="font-medium">{scoreRequest.loanRequest.tenure} months</p>
              </div>
              <div>
                <p className="text-muted-foreground">Purpose</p>
                <p className="font-medium">{scoreRequest.loanRequest.purpose}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Requested</p>
                <p className="font-medium">
                  {new Date(scoreRequest.timestamps.requestedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Scored</p>
                <p className="font-medium">
                  {new Date(scoreRequest.timestamps.scoredAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Processing Time</p>
                <p className="font-medium">5 seconds</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
