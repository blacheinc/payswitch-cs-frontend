// Core type definitions for PaySwitch Credit Scoring Platform

// ==================== ENUMS ====================

export type OrganizationStatus = 'pending' | 'active' | 'suspended';
export type IndustryType = 'bank' | 'fintech' | 'mfi' | 'sacco' | 'other';
export type UserRoleLabel = 'admin' | 'credit_officer' | 'developer' | 'viewer';
export type UserStatus = 'pending' | 'active' | 'removed';
export type ApiKeyEnvironment = 'sandbox' | 'production';
export type ApiKeyStatus = 'active' | 'revoked';
export type ScoreRequestStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ScoreRequestSource = 'api' | 'web_portal' | 'bulk';
export type RiskCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type DataQualityFlag = 'sufficient' | 'limited' | 'thin_file';
export type DecisionType = 'approved' | 'declined' | 'referred' | 'pending';
export type ModelStatus = 'training' | 'validation' | 'staging' | 'production' | 'deprecated' | 'archived';

// ==================== ORGANIZATION ====================

export interface Organization {
  id: string;
  name: string;
  shortName: string;
  industryType: IndustryType;
  address?: string;
  status: OrganizationStatus;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationPayload {
  name: string;
  shortName: string;
  industryType: IndustryType;
  address?: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
}

// ==================== USERS ====================

export interface User {
  id: string;
  email: string;
  name: string;
  roleLabel: UserRoleLabel;
  status: UserStatus;
  organizationId?: string;
  organization?: Organization;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminUser extends User {
  isAdmin: true;
  adminRole: 'super_admin' | 'data_science' | 'operations';
}

export interface OrgUser extends User {
  organizationId: string;
  organization: Organization;
}

// ==================== API KEYS ====================

export interface ApiKey {
  id: string;
  organizationId: string;
  keyPrefix: string;
  name: string;
  environment: ApiKeyEnvironment;
  status: ApiKeyStatus;
  lastUsedAt?: string;
  createdById: string;
  createdAt: string;
  revokedAt?: string;
}

export interface CreateApiKeyPayload {
  name: string;
  environment: ApiKeyEnvironment;
}

export interface ApiKeyWithSecret extends ApiKey {
  key: string; // Only returned once on creation
}

// ==================== CREDIT SCORE REQUEST ====================

export interface ApplicantInfo {
  fullName: string;
  dateOfBirth: string;
  nationalIdType: 'ghana_card' | 'voter_id' | 'passport' | 'drivers_license' | 'nhis';
  nationalIdNumber: string;
  gender?: 'male' | 'female' | 'other';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
  phone: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    digitalAddress?: string;
  };
  dependents?: number;
  educationLevel?: 'none' | 'primary' | 'jhs' | 'shs' | 'vocational' | 'diploma' | 'bachelors' | 'masters' | 'doctorate';
}

export interface EmploymentInfo {
  status: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student';
  employerName?: string;
  employerIndustry?: string;
  jobTitle?: string;
  durationMonths?: number;
  totalWorkExperienceMonths?: number;
  monthlyIncome: number;
  incomeCurrency?: string;
  incomeVerificationType?: 'payslip' | 'bank_statement' | 'tax_return' | 'employer_letter' | 'none';
  otherIncome?: number;
  otherIncomeSource?: string;
}

export interface LoanRequestInfo {
  amount: number;
  currency?: string;
  purpose: 'personal' | 'business' | 'education' | 'housing' | 'vehicle' | 'medical' | 'agriculture' | 'debt_consolidation' | 'other';
  purposeDescription?: string;
  tenureMonths: number;
  collateralType?: 'none' | 'vehicle' | 'property' | 'equipment' | 'inventory' | 'cash_deposit' | 'guarantor' | 'other';
  collateralValue?: number;
}

export interface ExistingLoan {
  lenderName?: string;
  loanType?: 'personal' | 'mortgage' | 'auto' | 'business' | 'credit_card' | 'other';
  originalAmount?: number;
  outstandingBalance?: number;
  monthlyPayment?: number;
  status?: 'current' | 'past_due' | 'default' | 'paid_off';
  daysPastDue?: number;
}

export interface BankAccount {
  bankName?: string;
  accountType?: 'savings' | 'current' | 'fixed_deposit';
  averageBalance3m?: number;
  accountAgeMonths?: number;
}

export interface MobileMoneyInfo {
  active: boolean;
  providers?: ('mtn_momo' | 'vodafone_cash' | 'airteltigo_money')[];
  avgMonthlyInflow?: number;
  avgMonthlyOutflow?: number;
  accountAgeMonths?: number;
}

export interface FinancialProfile {
  existingLoans?: ExistingLoan[];
  hasBankAccount?: boolean;
  bankAccounts?: BankAccount[];
  mobileMoney?: MobileMoneyInfo;
  hasCreditCard?: boolean;
  creditCardUtilization?: number;
  monthlyExpenses?: number;
  assets?: {
    ownsProperty?: boolean;
    propertyValue?: number;
    ownsVehicle?: boolean;
    vehicleValue?: number;
    savingsInvestments?: number;
  };
}

export interface ConsentInfo {
  bureauCheckAuthorized: boolean;
  consentDate: string;
  consentReference?: string;
  dataSharingAuthorized?: boolean;
}

export interface ScoreRequestPayload {
  referenceId?: string;
  applicant: ApplicantInfo;
  employment?: EmploymentInfo;
  loanRequest: LoanRequestInfo;
  financialProfile?: FinancialProfile;
  alternativeData?: AlternativeData;
  consent: ConsentInfo;
  metadata?: {
    channel?: 'branch' | 'online' | 'mobile_app' | 'agent' | 'call_center';
    productType?: string;
    branchCode?: string;
    officerId?: string;
    callbackUrl?: string;
  };
}

// ==================== ALTERNATIVE DATA ====================

export interface UtilityPaymentInfo {
  history: 'excellent' | 'good' | 'fair' | 'poor' | 'no_data';
  lastPaymentDate?: string;
  avgMonthlyBill?: number;
}

export interface RentPaymentInfo {
  history: 'excellent' | 'good' | 'fair' | 'poor' | 'no_data';
  monthlyRent?: number;
  tenureMonths?: number;
}

export interface TelcoDataInfo {
  accountAgeMonths?: number;
  avgMonthlySpend?: number;
  paymentRegularity: 'always_on_time' | 'mostly_on_time' | 'sometimes_late' | 'often_late';
  momoUsageFrequency: 'high' | 'medium' | 'low' | 'none';
}

export interface AlternativeData {
  utilityPaymentHistory?: UtilityPaymentInfo;
  rentPaymentHistory?: RentPaymentInfo;
  telcoData?: TelcoDataInfo;
  socialSignals?: {
    platform: 'linkedin' | 'professional_association';
    verificationStatus: 'verified' | 'unverified';
  }[];
}

// ==================== SCORE RESPONSE ====================

export interface ScoreComponent {
  score: number;
  maxScore: number;
  weight: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface RiskFactor {
  code: string;
  category: 'payment_history' | 'credit_utilization' | 'credit_age' | 'credit_mix' | 'new_credit' | 'income' | 'debt' | 'other';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  severity: 'high' | 'medium' | 'low';
  detail?: string;
}

export interface Recommendation {
  type: 'approve' | 'verify' | 'condition' | 'decline' | 'refer';
  message: string;
  priority: 'required' | 'recommended' | 'optional';
}

export interface AffordabilityAssessment {
  estimatedMonthlyPayment?: number;
  debtToIncomeCurrent?: number;
  debtToIncomeProjected?: number;
  disposableIncome?: number;
  affordabilityAssessment?: 'comfortable' | 'manageable' | 'stretched' | 'unaffordable';
  maxRecommendedAmount?: number;
}

export interface ScoreResult {
  value: number;
  maxValue: number;
  minValue: number;
  percentile: number;
  riskCategory: RiskCategory;
  riskCategoryDescription: string;
  confidence: number;
  dataQualityFlag: DataQualityFlag;
}

export interface ScoreResponse {
  requestId: string;
  referenceId?: string;
  status: ScoreRequestStatus;
  score?: ScoreResult;
  scoreComponents?: {
    paymentHistory?: ScoreComponent;
    creditUtilization?: ScoreComponent;
    creditHistoryLength?: ScoreComponent;
    creditMix?: ScoreComponent;
    newCredit?: ScoreComponent;
    incomeStability?: ScoreComponent;
    debtBurden?: ScoreComponent;
  };
  riskFactors?: RiskFactor[];
  recommendations?: Recommendation[];
  affordability?: AffordabilityAssessment;
  modelInfo?: {
    modelVersion: string;
    modelType: string;
    featuresUsed: number;
    dataSources: string[];
  };
  timestamps: {
    requestedAt: string;
    scoredAt?: string;
    validUntil?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ==================== SCORE REQUEST RECORD ====================

export interface ScoreRequest {
  id: string;
  trackingId: string;
  organizationId: string;
  referenceId?: string;
  status: ScoreRequestStatus;
  requestSource: ScoreRequestSource;
  applicantName: string;
  scoreValue?: number;
  riskCategory?: RiskCategory;
  modelVersion?: string;
  processingTimeMs?: number;
  apiKeyId?: string;
  createdByUserId?: string;
  createdAt: string;
  scoredAt?: string;
  validUntil?: string;
}

export interface ScoreRequestWithDetails extends ScoreRequest {
  requestPayload?: ScoreRequestPayload;
  scoreResult?: ScoreResponse;
  decision?: ScoreDecision;
}

// ==================== SCORE DECISION ====================

export interface ScoreDecision {
  id: string;
  scoreRequestId: string;
  decision: DecisionType;
  approvedAmount?: number;
  approvedTenure?: number;
  interestRate?: number;
  decisionNotes?: string;
  decidedByUserId: string;
  decidedAt: string;
}

export interface RecordDecisionPayload {
  decision: DecisionType;
  approvedAmount?: number;
  approvedTenure?: number;
  interestRate?: number;
  decisionNotes?: string;
}

// ==================== MODEL MANAGEMENT ====================

export interface ModelVersion {
  id: string;
  version: string;
  modelType: string;
  status: ModelStatus;
  isChampion: boolean;
  rollbackVersionId?: string;
  metrics: {
    auc?: number;
    ks?: number;
    gini?: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
  featureCount: number;
  trainingDataRef?: string;
  artifactPath?: string;
  promotedAt?: string;
  promotedById?: string;
  createdAt: string;
}

// ==================== AGENTIC AI ====================

export type AgentStatus = 'idle' | 'running' | 'warning' | 'error' | 'offline';

export interface AIAgent {
  id: string;
  name: string;
  role: 'data_quality' | 'feature_engineering' | 'risk_scoring' | 'retraining' | 'compliance_checker';
  status: AgentStatus;
  lastAction: string;
  lastActionAt: string;
  successRate24h: number;
  autonomousActionsCount: number;
  healthMetrics: {
    cpu: number;
    memory: number;
    latency: number;
  };
}

export interface AgentActionLog {
  id: string;
  agentId: string;
  actionType: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  status: 'success' | 'failure' | 'in_progress';
  timestamp: string;
}

// ==================== USAGE & ANALYTICS ====================

export interface UsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageScoreToday?: number;
  averageResponseTimeMs?: number;
}

export interface DashboardStats {
  usage: UsageStats;
  scoreDistribution: {
    veryLow: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
  };
  recentRequests: ScoreRequest[];
}

// ==================== PAGINATION ====================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

// ==================== API ERROR ====================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}
