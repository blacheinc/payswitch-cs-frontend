# Product Requirements Document (PRD)
# PaySwitch Credit Scoring Platform

**Document Version**: 1.0  
**Last Updated**: February 2025  
**Product Owner**: PaySwitch Ltd  
**Technical Partner**: Blache Ltd

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Objectives](#2-product-vision--objectives)
3. [User Personas](#3-user-personas)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [User Journeys](#5-user-journeys)
6. [Feature Requirements](#6-feature-requirements)
7. [Data Models](#7-data-models)
8. [API Specifications](#8-api-specifications)
9. [Agentic AI Framework](#9-agentic-ai-framework)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Success Metrics](#11-success-metrics)
12. [Compliance & Regulatory](#12-compliance--regulatory)
13. [Rollout Strategy](#13-rollout-strategy)

---

## 1. Executive Summary

### 1.1 What We're Building

A **B2B SaaS Credit Scoring Platform** that enables financial institutions (banks, fintechs, MFIs, SACCOs) across Ghana to obtain AI-powered credit scores for their loan applicants. The platform:

- **Ingests** applicant data via API or web forms
- **Scores** applicants using ensemble ML models (Logistic Regression, Random Forest, LightGBM)
- **Returns** credit scores with explainability (risk factors, confidence levels)
- **Does NOT** make final loan decisions—that remains with the consuming organization

### 1.2 What We're NOT Building

| In Scope | Out of Scope |
|----------|--------------|
| Credit score generation | Loan approval/rejection decisions |
| Risk factor explanations | Loan disbursement |
| API & web portal access | Collections management |
| Organization management | Core banking integration beyond scoring |
| Model training pipeline | End-borrower facing interfaces |
| Audit trails & compliance reports | Loan portfolio management |

### 1.3 Business Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     PaySwitch (Platform Admin)                   │
│  - Owns & operates the platform                                  │
│  - Manages ML model training                                     │
│  - Onboards organizations                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API / Web Portal Access
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Organizations (B2B Customers)                 │
│  - Banks, Fintechs, MFIs, SACCOs                                │
│  - Consume scoring via API or Web Portal                        │
│  - Make their own loan decisions based on scores                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Organization's own loan process
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    End Borrowers (Loan Applicants)               │
│  - Never interact with PaySwitch platform directly              │
│  - Apply for loans through their bank/fintech                   │
│  - Organization submits their data for scoring                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Product Vision & Objectives

### 2.1 Vision Statement

To become Ghana's national credit intelligence backbone, enabling any financial institution—regardless of size or technical capability—to make data-driven lending decisions through accessible, explainable, and compliant AI-powered credit scoring.

### 2.2 Strategic Objectives

| Objective | Metric | Target (Year 1) |
|-----------|--------|-----------------|
| Financial Inclusion | Organizations onboarded | 50+ |
| Transaction Volume | Credit checks per month | 100,000+ |
| Model Performance | Average AUC across org segments | ≥ 0.75 |
| Platform Reliability | System uptime | 99.9% |
| Customer Satisfaction | Org NPS | ≥ 40 |

### 2.3 Key Differentiators

1. **Alternative Data Integration**: Beyond traditional bureau data—incorporates telco, utility, and transaction data
2. **Agentic AI Operations**: Self-monitoring, self-healing ML pipeline with autonomous agents
3. **Explainability First**: Every score comes with human-readable explanations (regulatory requirement)
4. **Progressive Model Training**: Models improve continuously with organization-contributed data
5. **Ghana-Specific**: Tuned for local market dynamics, regulatory requirements, and data availability

---

## 3. User Personas

### 3.1 Platform Admin (PaySwitch)

#### 3.1.1 Super Admin
**Profile**: PaySwitch technical leadership  
**Goals**: 
- Full platform oversight and configuration
- Model governance and approval
- Organization management
- Usage analytics

**Key Tasks**:
- Approve/reject model promotions from staging to production
- Configure platform-wide settings (scoring thresholds, API rate limits)
- Manage admin user access
- View cross-organization analytics

#### 3.1.2 Data Science Admin
**Profile**: PaySwitch ML/Data Science team  
**Goals**:
- Train and improve scoring models
- Monitor model performance and drift
- Process training data from various sources
- Ensure model fairness and compliance

**Key Tasks**:
- Upload and transform training data from partners (banks, telcos)
- Trigger model retraining workflows
- Review model performance dashboards
- Generate fairness/bias reports
- Manage feature engineering pipelines

#### 3.1.3 Operations Admin
**Profile**: PaySwitch operations team  
**Goals**:
- Onboard new organizations
- Handle support escalations
- Monitor platform health

**Key Tasks**:
- Create organization accounts
- Review API usage
- Respond to organization support requests

---

### 3.2 Organization Users (B2B Customers)

#### 3.2.1 Org Admin
**Profile**: IT Manager or Head of Credit at a bank/fintech  
**Goals**:
- Manage their organization's access to the platform
- Invite and manage team members
- Monitor usage

**Key Tasks**:
- Manage API keys
- Invite team members and assign role labels
- Set up webhooks for async scoring
- View usage dashboards

#### 3.2.2 Credit Officer
**Profile**: Loan officer, underwriter, or credit analyst  
**Goals**:
- Get credit scores for loan applicants
- Understand why an applicant got a particular score
- Make informed lending decisions
- Track scoring history

**Key Tasks**:
- Submit individual credit score requests via web form
- Review score results and explanations
- Export scoring reports
- Search historical score requests

#### 3.2.3 Developer/Integration Engineer
**Profile**: Technical staff at organization  
**Goals**:
- Integrate scoring API into organization's systems
- Ensure reliable data flow
- Debug integration issues

**Key Tasks**:
- Access API documentation
- Generate and manage API keys
- Test API endpoints in sandbox
- Monitor API logs and error rates

---

## 4. System Architecture Overview

### 4.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                               │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │   Admin Portal  │  │   Org Portal    │  │   Public API    │               │
│  │   (PaySwitch)   │  │  (Customers)    │  │  (REST/GraphQL) │               │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘               │
└───────────┼─────────────────────┼─────────────────────┼──────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY (Azure APIM)                         │
│  - Authentication (API Keys, JWT)                                            │
│  - Rate Limiting                                                              │
│  - Request Routing                                                            │
│  - Usage Metering                                                             │
└──────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              SERVICE LAYER (AKS)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Org Management │  │ Score Request   │  │  Training Data  │               │
│  │     Service     │  │    Service      │  │    Service      │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │   Usage         │  │   Webhook       │  │   Notification  │               │
│  │   Metering      │  │   Service       │  │   Service       │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
└──────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CREDIT SCORING ENGINE                               │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │ Feature Store   │  │  Model Serving  │  │  Explainability │               │
│  │   (Feast)       │  │  (FastAPI/ML)   │  │  (SHAP/LIME)    │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Rules Engine   │  │ Model Registry  │  │  Decision       │               │
│  │   (Drools)      │  │   (MLflow)      │  │  Orchestrator   │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
└──────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           AGENTIC AI LAYER                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│  │ Data Quality│ │  Feature    │ │   Model     │ │    Risk     │             │
│  │   Agent     │ │ Engineering │ │  Training   │ │ Monitoring  │             │
│  │             │ │   Agent     │ │   Agent     │ │   Agent     │             │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────┐             │
│  │ Compliance  │ │  Customer   │ │     Agent Orchestrator      │             │
│  │   Agent     │ │  Service    │ │   (LangChain/Event Grid)    │             │
│  │             │ │   Agent     │ │                             │             │
│  └─────────────┘ └─────────────┘ └─────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │   PostgreSQL    │  │   MongoDB       │  │  Azure Data     │               │
│  │  (Transactional)│  │  (Documents)    │  │  Lake (Raw)     │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │  Redis          │  │  Azure Blob     │  │  Event Hub/     │               │
│  │  (Cache)        │  │  (Files)        │  │  Service Bus    │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Multi-Tenancy Model

The platform uses a **shared infrastructure, isolated data** multi-tenancy model:

- **Shared**: Scoring models, compute infrastructure, API gateway
- **Isolated**: Organization data, API keys, usage metrics, audit logs

```
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Scoring Models                         │
│  (Base models trained on aggregated, anonymized data)           │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Org A Data  │     │   Org B Data  │     │   Org C Data  │
│   (Isolated)  │     │   (Isolated)  │     │   (Isolated)  │
│               │     │               │     │               │
│ - Requests    │     │ - Requests    │     │ - Requests    │
│ - API Keys    │     │ - API Keys    │     │ - API Keys    │
│ - Users       │     │ - Users       │     │ - Users       │
│ - Audit Logs  │     │ - Audit Logs  │     │ - Audit Logs  │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## 5. User Journeys

### 5.1 Platform Admin Journeys

#### Journey A1: Onboard New Organization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOURNEY: Onboard New Organization                                            │
│ Actor: Operations Admin                                                      │
│ Trigger: New organization requests access                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: Create Organization
├── Admin logs into Admin Portal
├── Navigates to Organizations → Add New
├── Enters organization details:
│   ├── Organization Name: "Fidelity Bank Ghana"
│   ├── Short Name: "fidelity"
│   ├── Industry Type: Bank / Fintech / MFI / SACCO / Other
│   ├── Primary Contact: Name, Email, Phone
│   └── Address (optional)
└── System generates Organization ID (org_fidelity_xxxxx)

Step 2: Provision Access
├── System auto-generates:
│   ├── Org Admin Account (email sent with temp password)
│   ├── Sandbox API Key (for testing)
│   └── Production API Key
└── System sends welcome email to Org Admin with:
    ├── Login credentials
    ├── API documentation link
    └── Sandbox environment details

Step 3: Org Admin Activates Account
├── Org Admin clicks link in welcome email
├── Sets password
├── Verifies email
└── Organization status → ACTIVE (full access)

                         ┌─────────────────┐
                         │   SUCCESS!      │
                         │ Org can now:    │
                         │ - Generate keys │
                         │ - Submit scores │
                         │ - Invite team   │
                         └─────────────────┘
```

#### Journey A2: Train/Retrain Scoring Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOURNEY: Progressive Model Training                                          │
│ Actor: Data Science Admin                                                    │
│ Trigger: New training data available OR Model drift detected                │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: Acquire Training Data
├── Data arrives from partner (bank, telco, bureau)
├── Format varies: CSV, JSON, Excel, API dump
├── Data Science Admin uploads to Training Data Portal
│   ├── Select Data Source: "Bank of Ghana Historical Defaults"
│   ├── Upload file or connect to source
│   ├── Specify data period: "2020-2024"
│   └── Indicate outcome variable: "default_90_days"
└── System queues for processing

Step 2: Agentic Data Transformation (Automated)
├── Data Quality Agent activates:
│   ├── Schema validation
│   ├── Missing value analysis
│   ├── Anomaly detection
│   ├── PII identification & masking
│   └── Quality score assignment
├── If quality score < threshold:
│   ├── Agent flags issues
│   ├── Notifies Data Science Admin
│   └── Requires manual review
├── Feature Engineering Agent activates:
│   ├── Maps source fields to standard schema
│   ├── Creates derived features
│   ├── Handles categorical encoding
│   └── Generates feature lineage documentation
└── Transformed data stored in Feature Store

Step 3: Review Transformation Results
├── Data Science Admin reviews:
│   ├── Field mapping report
│   ├── Data quality report
│   ├── Feature distributions
│   └── Sample transformed records
├── Admin can:
│   ├── Approve transformation
│   ├── Adjust mappings manually
│   └── Reject and request re-upload
└── Approved data marked ready for training

Step 4: Trigger Model Training
├── Model Training Agent activates:
│   ├── Splits data (train/validation/test)
│   ├── Trains baseline models (LR, RF)
│   ├── Trains production model (LightGBM)
│   ├── Performs hyperparameter optimization (Optuna)
│   └── Generates model artifacts
├── Agent produces:
│   ├── Model performance metrics (AUC, KS, Gini)
│   ├── Feature importance rankings
│   ├── Confusion matrix at various thresholds
│   └── Model card documentation
└── New model version registered in MLflow

Step 5: Champion-Challenger Evaluation
├── System runs challenger (new) vs champion (current):
│   ├── Score same holdout population
│   ├── Compare performance metrics
│   ├── Run fairness tests (demographic parity, equalized odds)
│   └── Generate comparison report
├── Compliance Agent validates:
│   ├── No degradation in protected groups
│   ├── Explainability requirements met
│   └── Regulatory thresholds satisfied
└── Report sent to Data Science Admin

Step 6: Approve and Promote
├── Data Science Admin reviews results
├── If approved:
│   ├── Marks model for promotion
│   ├── Super Admin receives approval request
│   ├── Super Admin approves (or requests changes)
│   └── Model promoted to production
├── Rollout options:
│   ├── Immediate (100% traffic)
│   ├── Gradual (10% → 50% → 100%)
│   └── Scheduled (specific date/time)
└── Old model archived, new model active

                         ┌─────────────────┐
                         │   SUCCESS!      │
                         │ New model live  │
                         │ Performance:    │
                         │ AUC: 0.78→0.82  │
                         └─────────────────┘
```

---

### 5.2 Organization User Journeys

#### Journey O1: Submit Credit Score Request (Web Portal)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOURNEY: Submit Credit Score Request via Web                                 │
│ Actor: Credit Officer at Bank                                                │
│ Trigger: Loan applicant walks into branch                                   │
└─────────────────────────────────────────────────────────────────────────────┘

PRECONDITION: Customer has applied for a loan. Credit Officer needs score.

Step 1: Login to Org Portal
├── Credit Officer navigates to portal.creditscoring.payswitch.com.gh
├── Enters credentials (email + password)
├── Completes 2FA (SMS or authenticator)
└── Lands on Organization Dashboard

Step 2: Initiate New Score Request
├── Clicks "New Credit Score Request"
├── System displays structured input form
└── Form organized in sections (see Section 7 for full schema)

Step 3: Enter Applicant Information
├── Section: Personal Information
│   ├── Full Name*: "Kwame Asante"
│   ├── Date of Birth*: "1985-03-15"
│   ├── National ID Type*: Ghana Card / Voter ID / Passport
│   ├── National ID Number*: "GHA-123456789-0"
│   ├── Gender: Male / Female / Other
│   ├── Marital Status: Single / Married / Divorced / Widowed
│   ├── Phone Number*: "+233201234567"
│   ├── Email: "kwame.asante@email.com"
│   └── Residential Address*: "123 Independence Ave, Accra"
│
├── Section: Employment & Income
│   ├── Employment Status*: Employed / Self-Employed / Unemployed / Retired
│   ├── Employer Name: "MTN Ghana"
│   ├── Job Title: "Sales Manager"
│   ├── Employment Duration: 5 years
│   ├── Monthly Income*: GHS 8,500
│   ├── Income Verification: Payslip / Bank Statement / Tax Return
│   └── Other Income Sources: GHS 1,200 (rental income)
│
├── Section: Loan Details
│   ├── Requested Amount*: GHS 50,000
│   ├── Loan Purpose*: Business / Personal / Education / Housing / Vehicle
│   ├── Requested Tenure*: 24 months
│   └── Collateral Offered: None / Vehicle / Property / Other
│
├── Section: Financial Profile
│   ├── Existing Loans: Yes/No
│   │   └── If Yes: Outstanding balance, monthly payment
│   ├── Bank Account: Yes/No
│   │   └── If Yes: Account type, bank name, avg balance
│   ├── Mobile Money Active: Yes/No
│   │   └── If Yes: Provider, avg monthly transactions
│   └── Credit Card: Yes/No
│
├── Section: Bureau Consent
│   ├── Applicant Consent Obtained*: Yes (checkbox required)
│   ├── Consent Date*: "2025-02-03"
│   └── Consent Reference: "CONSENT-2025-xxxxx"
│
└── Fields marked * are required

Step 4: Submit Request
├── Credit Officer clicks "Submit for Scoring"
├── System validates all required fields
├── If validation fails:
│   ├── Highlights missing/invalid fields
│   └── Returns to form
├── If validation passes:
│   ├── Generates Tracking ID: "SCR-FID-20250203-00142"
│   ├── Queues request for scoring
│   └── Shows confirmation: "Request submitted. Scoring in progress..."
└── Request status: PENDING

Step 5: Receive Score (Real-time or Async)
├── For real-time (typical):
│   ├── Scoring completes in < 5 seconds
│   ├── Screen auto-updates with results
│   └── Status: COMPLETED
├── For async (complex cases):
│   ├── Screen shows "Processing... Check back shortly"
│   ├── Webhook notification sent when complete
│   └── Email notification to Credit Officer
└── Results displayed (see Step 6)

Step 6: Review Score Results
├── Credit Score Card displays:
│   ├── Overall Score: 720 / 850
│   ├── Risk Category: LOW / MEDIUM / HIGH / VERY HIGH
│   ├── Risk Category: "Medium Risk"
│   ├── Confidence Level: 87%
│   └── Score Percentile: "Top 35% of applicants"
│
├── Risk Factors (Top 5):
│   ├── 🔴 High debt-to-income ratio (0.45)
│   ├── 🟡 Short employment history (2 years)
│   ├── 🟢 Good payment history on existing loans
│   ├── 🟢 Stable residential address (5+ years)
│   └── 🟡 Limited credit history
│
├── Score Breakdown:
│   ├── Payment History: 185/200
│   ├── Credit Utilization: 120/150
│   ├── Credit Age: 80/150
│   ├── Credit Mix: 90/100
│   └── Recent Inquiries: 45/50
│
├── Recommendations (from Decision Agent):
│   ├── "Consider requiring guarantor for amounts > GHS 30,000"
│   ├── "Verify income with 3 months bank statements"
│   └── "Flag for manual review due to thin file"
│
└── Actions available:
    ├── Download PDF Report
    ├── Request Additional Data Enrichment (premium)
    ├── Add Internal Notes
    └── Mark Decision (Approved/Declined/Referred)

Step 7: Record Lending Decision
├── Credit Officer selects: "Mark Decision"
├── Options:
│   ├── Approved
│   │   ├── Approved Amount: GHS 35,000
│   │   ├── Approved Tenure: 18 months
│   │   └── Interest Rate: 28%
│   ├── Declined
│   │   └── Decline Reason: Required
│   └── Referred for Manual Review
│       └── Referral Notes: Required
├── System logs decision (for future model training)
└── Request status: DECISION_RECORDED

                         ┌─────────────────────────────┐
                         │   COMPLETE                  │
                         │                             │
                         │   Score: 720/850            │
                         │   Risk: Medium              │
                         │   Decision: Approved        │
                         │   Amount: GHS 35,000        │
                         │                             │
                         │   Tracking: SCR-FID-xxx     │
                         └─────────────────────────────┘
```

#### Journey O2: Submit Credit Score Request (API)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOURNEY: Submit Credit Score Request via API                                 │
│ Actor: Organization's Core Banking System (automated)                        │
│ Trigger: Loan application received in organization's system                 │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: API Authentication
├── Organization's system initiates request
├── Includes API Key in header: X-API-Key: sk_live_xxxxxxxx
├── API Gateway validates:
│   ├── Key exists and is active
│   ├── Organization is active
│   ├── Rate limit not exceeded
│   └── IP whitelist (if configured)
└── Request proceeds or returns 401/429

Step 2: Submit Score Request
├── POST /v1/score-requests
├── Request Body:
│   {
│     "reference_id": "LOAN-APP-2025-00456",  // Org's internal reference
│     "applicant": {
│       "full_name": "Kwame Asante",
│       "date_of_birth": "1985-03-15",
│       "national_id_type": "ghana_card",
│       "national_id_number": "GHA-123456789-0",
│       "phone": "+233201234567",
│       "email": "kwame@email.com",
│       "address": {
│         "street": "123 Independence Ave",
│         "city": "Accra",
│         "region": "Greater Accra"
│       }
│     },
│     "employment": {
│       "status": "employed",
│       "employer": "MTN Ghana",
│       "job_title": "Sales Manager",
│       "duration_months": 60,
│       "monthly_income": 8500,
│       "income_currency": "GHS"
│     },
│     "loan_request": {
│       "amount": 50000,
│       "currency": "GHS",
│       "purpose": "business",
│       "tenure_months": 24
│     },
│     "financial_profile": {
│       "existing_loans": [
│         {
│           "lender": "Access Bank",
│           "outstanding_balance": 12000,
│           "monthly_payment": 800
│         }
│       ],
│       "bank_accounts": true,
│       "mobile_money_active": true
│     },
│     "consent": {
│       "bureau_check_authorized": true,
│       "consent_date": "2025-02-03",
│       "consent_reference": "CONSENT-2025-00456"
│     },
│     "callback_url": "https://api.fidelitybank.com.gh/webhooks/credit-score"
│   }
└── System validates schema, enqueues for scoring

Step 3: Receive Response
├── Synchronous Response (< 200ms):
│   {
│     "request_id": "scr_FID_20250203_00142",
│     "status": "completed",  // or "processing" for async
│     "reference_id": "LOAN-APP-2025-00456",
│     "score": {
│       "value": 720,
│       "max_value": 850,
│       "percentile": 65,
│       "risk_category": "medium",
│       "confidence": 0.87
│     },
│     "risk_factors": [
│       {
│         "code": "RF001",
│         "description": "High debt-to-income ratio",
│         "impact": "negative",
│         "severity": "high",
│         "value": "0.45"
│       },
│       ...
│     ],
│     "score_components": {
│       "payment_history": {"score": 185, "max": 200},
│       "credit_utilization": {"score": 120, "max": 150},
│       "credit_age": {"score": 80, "max": 150},
│       "credit_mix": {"score": 90, "max": 100},
│       "recent_inquiries": {"score": 45, "max": 50}
│     },
│     "recommendations": [
│       "Consider requiring guarantor for amounts > GHS 30,000",
│       "Verify income with bank statements"
│     ],
│     "model_version": "lgbm_v2.3.1",
│     "scored_at": "2025-02-03T14:32:15Z",
│     "valid_until": "2025-02-17T14:32:15Z"
│   }
│
├── If async (status: "processing"):
│   {
│     "request_id": "scr_FID_20250203_00142",
│     "status": "processing",
│     "estimated_completion": "2025-02-03T14:32:30Z",
│     "callback_url": "https://api.fidelitybank.com.gh/webhooks/credit-score"
│   }
│   └── Webhook POSTed when complete
│
└── Organization's system processes response

Step 4: (Optional) Report Outcome
├── After loan decision made, org reports back:
├── POST /v1/score-requests/{request_id}/outcome
│   {
│     "decision": "approved",
│     "approved_amount": 35000,
│     "approved_tenure_months": 18,
│     "interest_rate": 0.28,
│     "decision_date": "2025-02-04",
│     "decision_notes": "Approved with reduced amount"
│   }
├── (Later) Report loan performance:
├── POST /v1/score-requests/{request_id}/performance
│   {
│     "status": "default",  // or "current", "paid_off", "write_off"
│     "days_past_due": 95,
│     "outstanding_balance": 28500,
│     "as_of_date": "2025-08-15"
│   }
└── This data feeds back into model training (anonymized, aggregated)
```

#### Journey O3: Bulk Credit Scoring

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOURNEY: Bulk Credit Scoring for Portfolio Review                            │
│ Actor: Risk Manager at Bank                                                  │
│ Trigger: Quarterly portfolio risk assessment                                │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: Prepare Bulk File
├── Risk Manager exports customer data from core banking
├── Formats as CSV/Excel matching bulk upload template
├── Template includes same fields as individual request
└── File: "q4_2024_portfolio_rescore.csv" (5,000 records)

Step 2: Upload via Portal
├── Navigates to Bulk Operations → New Bulk Score
├── Uploads file
├── System validates:
│   ├── File format correct
│   ├── Required columns present
│   ├── Data types valid
│   └── Record count within limit
├── Shows validation summary:
│   ├── Total records: 5,000
│   ├── Valid records: 4,892
│   ├── Invalid records: 108 (with reasons)
│   └── Estimated completion: 45 minutes
└── Risk Manager confirms submission

Step 3: Process Batch
├── System queues batch job
├── Progress shown in portal:
│   ├── Status: Processing
│   ├── Progress: 2,500 / 4,892 (51%)
│   ├── Estimated remaining: 22 minutes
│   └── Errors: 12
├── Scoring happens in parallel workers
└── Completion webhook sent when done

Step 4: Download Results
├── Results available for download:
│   ├── Full results: CSV with all scores + risk factors
│   ├── Summary report: PDF with portfolio analysis
│   └── Error report: CSV with failed records + reasons
├── Summary includes:
│   ├── Score distribution histogram
│   ├── Risk category breakdown (Low/Med/High/Very High)
│   ├── Comparison to previous quarter
│   └── Flagged accounts requiring review
└── Risk Manager downloads and analyzes
```

---

### 5.3 Integration Developer Journey

#### Journey D1: API Integration Setup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOURNEY: Set Up API Integration                                              │
│ Actor: Developer at Bank's IT Department                                     │
│ Trigger: Organization onboarded, ready to integrate                         │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: Access Developer Portal
├── Developer receives invite from Org Admin
├── Creates account or logs in
├── Lands on Developer Dashboard
└── Sees: API Docs, Sandbox, Keys, Logs

Step 2: Review Documentation
├── OpenAPI/Swagger documentation available
├── Endpoints documented:
│   ├── POST /v1/score-requests (create score request)
│   ├── GET /v1/score-requests/{id} (get score result)
│   ├── POST /v1/score-requests/{id}/outcome (report decision)
│   ├── GET /v1/score-requests (list requests with filters)
│   └── GET /v1/usage (get usage statistics)
├── SDKs available: Python, Node.js, Java, PHP, Go
├── Code examples for common scenarios
└── Webhook integration guide

Step 3: Test in Sandbox
├── Sandbox API Key auto-generated: sk_test_xxxxxxxx
├── Sandbox environment:
│   ├── Base URL: https://sandbox.api.creditscoring.payswitch.com.gh
│   ├── Synthetic test data available
│   ├── No rate limits
│   └── Scores are simulated (not real model)
├── Developer tests:
│   ├── Authentication
│   ├── Request submission
│   ├── Response parsing
│   ├── Error handling
│   └── Webhook receipt
└── All sandbox calls logged in Developer Dashboard

Step 4: Request Production Access
├── Developer clicks "Request Production Access"
├── Checklist:
│   ├── [x] Completed sandbox testing
│   ├── [x] Implemented error handling
│   ├── [x] Webhook endpoint configured
│   ├── [x] Security review passed (IP whitelist, etc.)
│   └── [x] Org Admin approval
├── Org Admin reviews and approves
└── Production API Key generated: sk_live_xxxxxxxx

Step 5: Go Live
├── Developer updates configuration:
│   ├── API Key: sk_live_xxxxxxxx
│   ├── Base URL: https://api.creditscoring.payswitch.com.gh
│   └── Webhook URL: https://api.bank.com/webhooks/credit-score
├── Conducts final validation with real (limited) traffic
└── Full production traffic enabled
```

---

## 6. Feature Requirements

### 6.1 Admin Portal Features

#### 6.1.1 Dashboard
| Feature | Description | Priority |
|---------|-------------|----------|
| Platform Overview | Total orgs, requests today/week/month, usage trends | P0 |
| Model Health | Current model version, AUC, drift indicators | P0 |
| System Status | Service health, latency p50/p95/p99, error rates | P0 |
| Alerts | Active incidents, model drift warnings, system alerts | P0 |

#### 6.1.2 Organization Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Create Organization | Create new org and send invite to admin | P0 |
| Edit Organization | Update details, contacts | P0 |
| Suspend/Activate Org | Temporary suspension with reason | P0 |
| View Org Activity | Requests, usage for specific org | P0 |
| Org API Keys | View (masked), revoke org keys | P0 |

#### 6.1.3 Model Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Training Data Upload | Upload, validate, transform training data | P0 |
| Data Quality Dashboard | Quality scores, anomalies, PII detection | P0 |
| Model Training Trigger | Initiate training with parameters | P0 |
| Model Registry | View all model versions, metadata, lineage | P0 |
| Champion-Challenger | Compare models, view A/B results | P0 |
| Model Promotion | Approve/reject model for production | P0 |
| Model Rollback | Revert to previous model version | P0 |
| Fairness Reports | Bias detection across demographics | P0 |

#### 6.1.4 Compliance & Audit
| Feature | Description | Priority |
|---------|-------------|----------|
| Audit Log | All admin actions, searchable | P0 |
| Compliance Reports | Generate reports for regulators | P0 |
| Data Retention | Configure retention policies | P0 |
| GDPR/Data Requests | Handle data subject requests | P1 |

---

### 6.2 Organization Portal Features

#### 6.2.1 Dashboard
| Feature | Description | Priority |
|---------|-------------|----------|
| Score Request Summary | Today, this week, this month counts | P0 |
| Score Distribution | Histogram of recent scores | P0 |
| API Health | Success rate, latency for this org | P0 |
| Quick Actions | New request, view recent, API keys | P0 |

#### 6.2.2 Credit Score Requests
| Feature | Description | Priority |
|---------|-------------|----------|
| New Request (Form) | Structured form for manual entry | P0 |
| Request History | List all requests with filters/search | P0 |
| Request Detail | Full score card, risk factors, PDF | P0 |
| Record Decision | Mark approved/declined/referred | P0 |
| Bulk Upload | Upload CSV for batch scoring | P1 |
| Bulk Results | Download batch results | P1 |

#### 6.2.3 API Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Generate API Key | Create new keys (sandbox/production) | P0 |
| Revoke API Key | Deactivate compromised keys | P0 |
| API Key List | View all keys (masked), last used | P0 |
| Webhook Config | Set callback URLs, test webhooks | P0 |
| IP Whitelist | Restrict API access by IP | P1 |

#### 6.2.4 User Management
| Feature | Description | Priority |
|---------|-------------|----------|
| Invite User | Send invite to new team member | P0 |
| Assign Role Label | Admin, Credit Officer, Developer, Viewer (labels only, no access restrictions) | P0 |
| Remove User | Remove user from organization | P0 |
| Activity Log | User actions within org | P0 |

#### 6.2.5 Reports & Analytics
| Feature | Description | Priority |
|---------|-------------|----------|
| Usage Report | Requests over time, by user | P0 |
| Score Analytics | Distribution, trends, comparison | P1 |
| Export Data | Download request history | P0 |
| Scheduled Reports | Auto-email weekly/monthly reports | P2 |

---

### 6.3 API Features

| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/v1/score-requests` | POST | Create new score request | P0 |
| `/v1/score-requests/{id}` | GET | Get score request result | P0 |
| `/v1/score-requests` | GET | List requests (with filters) | P0 |
| `/v1/score-requests/{id}/outcome` | POST | Report lending decision | P0 |
| `/v1/score-requests/{id}/performance` | POST | Report loan performance | P1 |
| `/v1/bulk-requests` | POST | Create bulk score job | P1 |
| `/v1/bulk-requests/{id}` | GET | Get bulk job status/results | P1 |
| `/v1/usage` | GET | Get usage statistics | P0 |
| `/v1/health` | GET | API health check | P0 |

---

## 7. Data Models

### 7.1 Credit Score Request Schema

This is the standardized input schema for credit scoring. All data sources (web form, API, bulk upload) normalize to this structure.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CreditScoreRequest",
  "type": "object",
  "required": ["applicant", "loan_request", "consent"],
  "properties": {
    
    "reference_id": {
      "type": "string",
      "description": "Organization's internal reference for this application",
      "maxLength": 100
    },
    
    "applicant": {
      "type": "object",
      "required": ["full_name", "date_of_birth", "national_id_type", "national_id_number", "phone"],
      "properties": {
        "full_name": {
          "type": "string",
          "minLength": 2,
          "maxLength": 200
        },
        "date_of_birth": {
          "type": "string",
          "format": "date",
          "description": "YYYY-MM-DD format"
        },
        "national_id_type": {
          "type": "string",
          "enum": ["ghana_card", "voter_id", "passport", "drivers_license", "nhis"]
        },
        "national_id_number": {
          "type": "string",
          "maxLength": 50
        },
        "gender": {
          "type": "string",
          "enum": ["male", "female", "other"]
        },
        "marital_status": {
          "type": "string",
          "enum": ["single", "married", "divorced", "widowed", "separated"]
        },
        "phone": {
          "type": "string",
          "pattern": "^\\+?[0-9]{10,15}$"
        },
        "email": {
          "type": "string",
          "format": "email"
        },
        "address": {
          "type": "object",
          "properties": {
            "street": { "type": "string" },
            "city": { "type": "string" },
            "region": { 
              "type": "string",
              "enum": ["greater_accra", "ashanti", "western", "eastern", "central", 
                       "northern", "upper_east", "upper_west", "volta", "bono", 
                       "bono_east", "ahafo", "western_north", "oti", "north_east", 
                       "savannah"]
            },
            "digital_address": {
              "type": "string",
              "description": "Ghana Post GPS address"
            }
          }
        },
        "dependents": {
          "type": "integer",
          "minimum": 0,
          "maximum": 20
        },
        "education_level": {
          "type": "string",
          "enum": ["none", "primary", "jhs", "shs", "vocational", "diploma", 
                   "bachelors", "masters", "doctorate"]
        }
      }
    },
    
    "employment": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": ["employed", "self_employed", "unemployed", "retired", "student"]
        },
        "employer_name": { "type": "string" },
        "employer_industry": {
          "type": "string",
          "enum": ["agriculture", "banking_finance", "construction", "education",
                   "government", "healthcare", "hospitality", "manufacturing",
                   "mining", "oil_gas", "retail", "technology", "telecom",
                   "transportation", "utilities", "other"]
        },
        "job_title": { "type": "string" },
        "duration_months": { 
          "type": "integer",
          "minimum": 0,
          "description": "Months at current employer"
        },
        "total_work_experience_months": {
          "type": "integer",
          "minimum": 0
        },
        "monthly_income": {
          "type": "number",
          "minimum": 0
        },
        "income_currency": {
          "type": "string",
          "default": "GHS"
        },
        "income_verification_type": {
          "type": "string",
          "enum": ["payslip", "bank_statement", "tax_return", "employer_letter", "none"]
        },
        "other_income": {
          "type": "number",
          "minimum": 0,
          "description": "Additional monthly income from other sources"
        },
        "other_income_source": {
          "type": "string"
        }
      }
    },
    
    "loan_request": {
      "type": "object",
      "required": ["amount", "purpose", "tenure_months"],
      "properties": {
        "amount": {
          "type": "number",
          "minimum": 0
        },
        "currency": {
          "type": "string",
          "default": "GHS"
        },
        "purpose": {
          "type": "string",
          "enum": ["personal", "business", "education", "housing", "vehicle", 
                   "medical", "agriculture", "debt_consolidation", "other"]
        },
        "purpose_description": {
          "type": "string",
          "maxLength": 500
        },
        "tenure_months": {
          "type": "integer",
          "minimum": 1,
          "maximum": 360
        },
        "collateral_type": {
          "type": "string",
          "enum": ["none", "vehicle", "property", "equipment", "inventory", 
                   "cash_deposit", "guarantor", "other"]
        },
        "collateral_value": {
          "type": "number",
          "minimum": 0
        }
      }
    },
    
    "financial_profile": {
      "type": "object",
      "properties": {
        "existing_loans": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "lender_name": { "type": "string" },
              "loan_type": { 
                "type": "string",
                "enum": ["personal", "mortgage", "auto", "business", "credit_card", "other"]
              },
              "original_amount": { "type": "number" },
              "outstanding_balance": { "type": "number" },
              "monthly_payment": { "type": "number" },
              "status": {
                "type": "string",
                "enum": ["current", "past_due", "default", "paid_off"]
              },
              "days_past_due": { "type": "integer" }
            }
          }
        },
        "has_bank_account": { "type": "boolean" },
        "bank_accounts": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "bank_name": { "type": "string" },
              "account_type": {
                "type": "string",
                "enum": ["savings", "current", "fixed_deposit"]
              },
              "average_balance_3m": { "type": "number" },
              "account_age_months": { "type": "integer" }
            }
          }
        },
        "mobile_money": {
          "type": "object",
          "properties": {
            "active": { "type": "boolean" },
            "providers": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["mtn_momo", "vodafone_cash", "airteltigo_money"]
              }
            },
            "avg_monthly_inflow": { "type": "number" },
            "avg_monthly_outflow": { "type": "number" },
            "account_age_months": { "type": "integer" }
          }
        },
        "has_credit_card": { "type": "boolean" },
        "credit_card_utilization": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Current balance / credit limit"
        },
        "monthly_expenses": { "type": "number" },
        "assets": {
          "type": "object",
          "properties": {
            "owns_property": { "type": "boolean" },
            "property_value": { "type": "number" },
            "owns_vehicle": { "type": "boolean" },
            "vehicle_value": { "type": "number" },
            "savings_investments": { "type": "number" }
          }
        }
      }
    },
    
    "bureau_data": {
      "type": "object",
      "description": "Pre-fetched bureau data if organization has direct bureau access",
      "properties": {
        "bureau_score": { "type": "integer" },
        "bureau_provider": { 
          "type": "string",
          "enum": ["xds", "hudson_price", "dun_bradstreet", "other"]
        },
        "total_accounts": { "type": "integer" },
        "delinquent_accounts": { "type": "integer" },
        "oldest_account_months": { "type": "integer" },
        "recent_inquiries_6m": { "type": "integer" },
        "public_records": { "type": "integer" }
      }
    },
    
    "alternative_data": {
      "type": "object",
      "description": "Alternative/non-traditional data signals",
      "properties": {
        "utility_payment_history": {
          "type": "string",
          "enum": ["excellent", "good", "fair", "poor", "no_data"]
        },
        "rent_payment_history": {
          "type": "string",
          "enum": ["excellent", "good", "fair", "poor", "no_data"]
        },
        "telco_data": {
          "type": "object",
          "properties": {
            "account_age_months": { "type": "integer" },
            "avg_monthly_spend": { "type": "number" },
            "payment_regularity": {
              "type": "string",
              "enum": ["always_on_time", "mostly_on_time", "sometimes_late", "often_late"]
            }
          }
        },
        "social_signals": {
          "type": "object",
          "properties": {
            "linkedin_profile": { "type": "boolean" },
            "professional_associations": { "type": "integer" }
          }
        }
      }
    },
    
    "consent": {
      "type": "object",
      "required": ["bureau_check_authorized", "consent_date"],
      "properties": {
        "bureau_check_authorized": { 
          "type": "boolean",
          "const": true
        },
        "consent_date": { 
          "type": "string",
          "format": "date"
        },
        "consent_reference": { 
          "type": "string",
          "description": "Organization's consent record reference"
        },
        "data_sharing_authorized": {
          "type": "boolean",
          "description": "Consent to share anonymized data for model improvement"
        }
      }
    },
    
    "metadata": {
      "type": "object",
      "properties": {
        "channel": {
          "type": "string",
          "enum": ["branch", "online", "mobile_app", "agent", "call_center"]
        },
        "product_type": {
          "type": "string",
          "description": "Organization's internal product code"
        },
        "branch_code": { "type": "string" },
        "officer_id": { "type": "string" },
        "callback_url": {
          "type": "string",
          "format": "uri",
          "description": "Webhook URL for async results"
        }
      }
    }
  }
}
```

### 7.2 Credit Score Response Schema

```json
{
  "title": "CreditScoreResponse",
  "type": "object",
  "properties": {
    
    "request_id": {
      "type": "string",
      "description": "Unique identifier for this score request",
      "example": "scr_FID_20250203_00142"
    },
    
    "reference_id": {
      "type": "string",
      "description": "Organization's reference (echoed back)"
    },
    
    "status": {
      "type": "string",
      "enum": ["pending", "processing", "completed", "failed"],
      "description": "Current status of the score request"
    },
    
    "score": {
      "type": "object",
      "properties": {
        "value": {
          "type": "integer",
          "minimum": 300,
          "maximum": 850,
          "description": "Credit score value"
        },
        "max_value": {
          "type": "integer",
          "const": 850
        },
        "min_value": {
          "type": "integer",
          "const": 300
        },
        "percentile": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "Applicant's percentile rank (higher is better)"
        },
        "risk_category": {
          "type": "string",
          "enum": ["very_low", "low", "medium", "high", "very_high"]
        },
        "risk_category_description": {
          "type": "string",
          "example": "Medium Risk - Proceed with standard verification"
        },
        "confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "Model confidence in this score (0-1)"
        },
        "data_quality_flag": {
          "type": "string",
          "enum": ["sufficient", "limited", "thin_file"],
          "description": "Indicates data completeness"
        }
      }
    },
    
    "score_components": {
      "type": "object",
      "description": "Breakdown of score by category",
      "properties": {
        "payment_history": {
          "type": "object",
          "properties": {
            "score": { "type": "integer" },
            "max_score": { "type": "integer" },
            "weight": { "type": "number" },
            "grade": { "type": "string", "enum": ["A", "B", "C", "D", "F"] }
          }
        },
        "credit_utilization": {
          "type": "object",
          "properties": {
            "score": { "type": "integer" },
            "max_score": { "type": "integer" },
            "weight": { "type": "number" },
            "grade": { "type": "string" }
          }
        },
        "credit_history_length": {
          "type": "object",
          "properties": {
            "score": { "type": "integer" },
            "max_score": { "type": "integer" },
            "weight": { "type": "number" },
            "grade": { "type": "string" }
          }
        },
        "credit_mix": {
          "type": "object",
          "properties": {
            "score": { "type": "integer" },
            "max_score": { "type": "integer" },
            "weight": { "type": "number" },
            "grade": { "type": "string" }
          }
        },
        "new_credit": {
          "type": "object",
          "properties": {
            "score": { "type": "integer" },
            "max_score": { "type": "integer" },
            "weight": { "type": "number" },
            "grade": { "type": "string" }
          }
        },
        "income_stability": {
          "type": "object",
          "properties": {
            "score": { "type": "integer" },
            "max_score": { "type": "integer" },
            "weight": { "type": "number" },
            "grade": { "type": "string" }
          }
        },
        "debt_burden": {
          "type": "object",
          "properties": {
            "score": { "type": "integer" },
            "max_score": { "type": "integer" },
            "weight": { "type": "number" },
            "grade": { "type": "string" }
          }
        }
      }
    },
    
    "risk_factors": {
      "type": "array",
      "description": "Factors contributing to the score (for adverse action notices)",
      "items": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "example": "RF001"
          },
          "category": {
            "type": "string",
            "enum": ["payment_history", "credit_utilization", "credit_age", 
                     "credit_mix", "new_credit", "income", "debt", "other"]
          },
          "description": {
            "type": "string",
            "example": "High debt-to-income ratio"
          },
          "impact": {
            "type": "string",
            "enum": ["positive", "negative", "neutral"]
          },
          "severity": {
            "type": "string",
            "enum": ["high", "medium", "low"]
          },
          "detail": {
            "type": "string",
            "example": "Debt-to-income ratio is 0.52, which exceeds the recommended 0.40"
          }
        }
      }
    },
    
    "recommendations": {
      "type": "array",
      "description": "Suggested actions for the lending decision",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["approve", "verify", "condition", "decline", "refer"]
          },
          "message": {
            "type": "string"
          },
          "priority": {
            "type": "string",
            "enum": ["required", "recommended", "optional"]
          }
        }
      }
    },
    
    "affordability": {
      "type": "object",
      "description": "Affordability assessment based on provided data",
      "properties": {
        "estimated_monthly_payment": {
          "type": "number",
          "description": "Estimated loan payment at typical market rates"
        },
        "debt_to_income_current": {
          "type": "number",
          "description": "Current DTI ratio"
        },
        "debt_to_income_projected": {
          "type": "number",
          "description": "DTI ratio if loan is approved"
        },
        "disposable_income": {
          "type": "number",
          "description": "Estimated remaining income after expenses and debt"
        },
        "affordability_assessment": {
          "type": "string",
          "enum": ["comfortable", "manageable", "stretched", "unaffordable"]
        },
        "max_recommended_amount": {
          "type": "number",
          "description": "Maximum loan amount recommended based on affordability"
        }
      }
    },
    
    "model_info": {
      "type": "object",
      "properties": {
        "model_version": {
          "type": "string",
          "example": "lgbm_v2.3.1"
        },
        "model_type": {
          "type": "string",
          "example": "LightGBM Ensemble"
        },
        "features_used": {
          "type": "integer",
          "description": "Number of features used in scoring"
        },
        "data_sources": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "example": ["application", "bureau", "mobile_money"]
        }
      }
    },
    
    "timestamps": {
      "type": "object",
      "properties": {
        "requested_at": {
          "type": "string",
          "format": "date-time"
        },
        "scored_at": {
          "type": "string",
          "format": "date-time"
        },
        "valid_until": {
          "type": "string",
          "format": "date-time",
          "description": "Score validity period (typically 14-30 days)"
        }
      }
    },
    
    "error": {
      "type": "object",
      "description": "Present only if status is 'failed'",
      "properties": {
        "code": { "type": "string" },
        "message": { "type": "string" },
        "details": { "type": "object" }
      }
    }
  }
}
```

### 7.3 Core Database Entities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ORGANIZATION                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              UUID                                                   │
│ name                 VARCHAR(200)                                           │
│ short_name           VARCHAR(50) UNIQUE                                     │
│ industry_type        ENUM(bank, fintech, mfi, sacco, other)                │
│ address              TEXT                                                   │
│ status               ENUM(pending, active, suspended)                       │
│ created_at           TIMESTAMP                                              │
│ updated_at           TIMESTAMP                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ORG_USER                                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              UUID                                                   │
│ organization_id      FK → Organization                                      │
│ email                VARCHAR(255) UNIQUE                                    │
│ name                 VARCHAR(200)                                           │
│ role_label           VARCHAR(50) -- Label only: admin, credit_officer, etc. │
│ status               ENUM(pending, active, removed)                         │
│ last_login_at        TIMESTAMP                                              │
│ created_at           TIMESTAMP                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ API_KEY                                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              UUID                                                   │
│ organization_id      FK → Organization                                      │
│ key_hash             VARCHAR(64) -- SHA256 of actual key                    │
│ key_prefix           VARCHAR(12) -- First 12 chars for identification       │
│ name                 VARCHAR(100)                                           │
│ environment          ENUM(sandbox, production)                              │
│ status               ENUM(active, revoked)                                  │
│ last_used_at         TIMESTAMP                                              │
│ created_by           FK → OrgUser                                           │
│ created_at           TIMESTAMP                                              │
│ revoked_at           TIMESTAMP                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCORE_REQUEST                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              UUID                                                   │
│ tracking_id          VARCHAR(50) UNIQUE -- Human readable: SCR-ORG-DATE-SEQ│
│ organization_id      FK → Organization                                      │
│ reference_id         VARCHAR(100) -- Org's internal reference               │
│ status               ENUM(pending, processing, completed, failed)           │
│ request_source       ENUM(api, web_portal, bulk)                            │
│ request_payload      JSONB -- Full input (encrypted at rest)                │
│ applicant_hash       VARCHAR(64) -- For deduplication                       │
│ score_result         JSONB -- Full response                                 │
│ score_value          INTEGER -- Denormalized for queries                    │
│ risk_category        VARCHAR(20) -- Denormalized                            │
│ model_version        VARCHAR(50)                                            │
│ processing_time_ms   INTEGER                                                │
│ api_key_id           FK → ApiKey (null if web portal)                       │
│ created_by_user_id   FK → OrgUser (null if API)                             │
│ created_at           TIMESTAMP                                              │
│ scored_at            TIMESTAMP                                              │
│ valid_until          TIMESTAMP                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCORE_DECISION                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              UUID                                                   │
│ score_request_id     FK → ScoreRequest                                      │
│ decision             ENUM(approved, declined, referred, pending)            │
│ approved_amount      DECIMAL(15,2)                                          │
│ approved_tenure      INTEGER                                                │
│ interest_rate        DECIMAL(5,4)                                           │
│ decision_notes       TEXT                                                   │
│ decided_by_user_id   FK → OrgUser                                           │
│ decided_at           TIMESTAMP                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ LOAN_PERFORMANCE                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              UUID                                                   │
│ score_request_id     FK → ScoreRequest                                      │
│ status               ENUM(current, past_due_30, past_due_60, past_due_90,  │
│                           default, paid_off, write_off)                     │
│ days_past_due        INTEGER                                                │
│ outstanding_balance  DECIMAL(15,2)                                          │
│ as_of_date           DATE                                                   │
│ reported_at          TIMESTAMP                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ MODEL_VERSION                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              UUID                                                   │
│ version              VARCHAR(50) UNIQUE                                     │
│ model_type           VARCHAR(50)                                            │
│ status               ENUM(training, validation, staging, production,        │
│                           deprecated, archived)                             │
│ metrics              JSONB -- AUC, KS, Gini, etc.                           │
│ feature_count        INTEGER                                                │
│ training_data_ref    VARCHAR(200)                                           │
│ artifact_path        VARCHAR(500)                                           │
│ promoted_at          TIMESTAMP                                              │
│ promoted_by          FK → AdminUser                                         │
│ created_at           TIMESTAMP                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TRAINING_DATA_SOURCE                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)              UUID                                                   │
│ name                 VARCHAR(200)                                           │
│ source_type          ENUM(bank, bureau, telco, utility, other)              │
│ provider             VARCHAR(200)                                           │
│ data_period_start    DATE                                                   │
│ data_period_end      DATE                                                   │
│ record_count         INTEGER                                                │
│ quality_score        DECIMAL(3,2)                                           │
│ transformation_status ENUM(pending, processing, completed, failed)          │
│ raw_file_path        VARCHAR(500)                                           │
│ transformed_path     VARCHAR(500)                                           │
│ uploaded_by          FK → AdminUser                                         │
│ created_at           TIMESTAMP                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. API Specifications

### 8.1 Authentication

All API requests must include authentication via API key:

```
Header: X-API-Key: sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys are prefixed:
- `sk_test_` - Sandbox environment
- `sk_live_` - Production environment

### 8.2 Base URLs

| Environment | Base URL |
|-------------|----------|
| Sandbox | `https://sandbox.api.creditscoring.payswitch.com.gh` |
| Production | `https://api.creditscoring.payswitch.com.gh` |

### 8.3 Endpoints

#### POST /v1/score-requests

Create a new credit score request.

**Request:**
```http
POST /v1/score-requests HTTP/1.1
Host: api.creditscoring.payswitch.com.gh
X-API-Key: sk_live_xxxxxxxx
Content-Type: application/json
Idempotency-Key: unique-request-id-12345

{
  "reference_id": "LOAN-2025-00456",
  "applicant": { ... },
  "employment": { ... },
  "loan_request": { ... },
  "financial_profile": { ... },
  "consent": { ... },
  "metadata": {
    "callback_url": "https://api.yourbank.com/webhooks/score"
  }
}
```

**Response (200 OK):**
```json
{
  "request_id": "scr_FID_20250203_00142",
  "status": "completed",
  "reference_id": "LOAN-2025-00456",
  "score": { ... },
  "risk_factors": [ ... ],
  "recommendations": [ ... ],
  "timestamps": {
    "requested_at": "2025-02-03T14:32:10Z",
    "scored_at": "2025-02-03T14:32:15Z",
    "valid_until": "2025-02-17T14:32:15Z"
  }
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 | Validation error (missing fields, invalid data) |
| 401 | Invalid or missing API key |
| 403 | Organization suspended or key revoked |
| 409 | Duplicate request (same Idempotency-Key) |
| 422 | Consent not provided or invalid |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

#### GET /v1/score-requests/{request_id}

Retrieve a score request by ID.

#### GET /v1/score-requests

List score requests with filters.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20, max: 100)
- `status` (string): Filter by status
- `risk_category` (string): Filter by risk category
- `from_date` (date): Filter by created date (start)
- `to_date` (date): Filter by created date (end)
- `reference_id` (string): Search by org reference

#### POST /v1/score-requests/{request_id}/outcome

Report the lending decision made.

#### POST /v1/score-requests/{request_id}/performance

Report loan performance data (for model improvement).

### 8.4 Webhooks

When a `callback_url` is provided, the system will POST results:

```http
POST https://api.yourbank.com/webhooks/score HTTP/1.1
Content-Type: application/json
X-PaySwitch-Signature: sha256=xxxxxxxx

{
  "event": "score.completed",
  "request_id": "scr_FID_20250203_00142",
  "timestamp": "2025-02-03T14:32:15Z",
  "data": {
    "status": "completed",
    "score": { ... },
    "risk_factors": [ ... ]
  }
}
```

Webhook signature verification:
```python
import hmac
import hashlib

def verify_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(), 
        payload.encode(), 
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

### 8.5 Rate Limits

All organizations have the same rate limits:

| Metric | Limit |
|--------|-------|
| Requests per minute | 100 |
| Requests per day | 50,000 |
| Burst limit | 200 |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1675432800
```

---

## 9. Agentic AI Framework

### 9.1 Agent Overview

| Agent | Trigger | Actions | Outputs |
|-------|---------|---------|---------|
| **Data Quality Agent** | New training data uploaded | Schema validation, anomaly detection, PII masking, quality scoring | Quality report, cleaned data, alerts |
| **Feature Engineering Agent** | Data Quality approved | Field mapping, feature creation, encoding, lineage tracking | Feature store entries, mapping report |
| **Model Training Agent** | Training triggered (manual or drift) | Data split, model training, hyperparameter tuning, evaluation | Model artifacts, metrics, model card |
| **Decision Agent** | Score request received | Feature retrieval, model inference, ensembling, explanation generation | Score response |
| **Risk Monitoring Agent** | Scheduled (hourly/daily) | PSI calculation, AUC monitoring, drift detection | Alerts, drift reports |
| **Compliance Agent** | Model promotion, scheduled | Fairness testing, bias detection, audit report generation | Compliance reports |
| **Customer Service Agent** | Explanation requested | Natural language generation from SHAP values | Human-readable explanations |

### 9.2 Agent Communication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Agent Orchestrator                                    │
│                   (Azure Event Grid / Service Bus)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────┐    Event: data.uploaded    ┌───────────────┐               │
│   │  Admin    │ ─────────────────────────▶ │  Data Quality │               │
│   │  Portal   │                            │     Agent     │               │
│   └───────────┘                            └───────┬───────┘               │
│                                                    │                        │
│                        Event: quality.approved     │                        │
│                                                    ▼                        │
│                                            ┌───────────────┐               │
│                                            │   Feature     │               │
│                                            │  Engineering  │               │
│                                            │    Agent      │               │
│                                            └───────┬───────┘               │
│                                                    │                        │
│                        Event: features.ready       │                        │
│                                                    ▼                        │
│   ┌───────────┐    Event: train.trigger    ┌───────────────┐               │
│   │   Admin   │ ─────────────────────────▶ │    Model      │               │
│   │  / Risk   │                            │   Training    │               │
│   │ Monitoring│                            │    Agent      │               │
│   └───────────┘                            └───────┬───────┘               │
│                                                    │                        │
│                        Event: model.ready          │                        │
│                                                    ▼                        │
│                                            ┌───────────────┐               │
│                                            │  Compliance   │               │
│                                            │    Agent      │               │
│                                            └───────┬───────┘               │
│                                                    │                        │
│                        Event: compliance.passed    │                        │
│                                                    ▼                        │
│                                            ┌───────────────┐               │
│                                            │  Model Ready  │               │
│                                            │ for Promotion │               │
│                                            └───────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Data Transformation Pipeline (Agentic)

The Data Quality and Feature Engineering Agents work together to transform diverse source data into the standard training format:

```
Source Data (Bank CSV)                     Standard Training Format
┌─────────────────────────┐               ┌─────────────────────────┐
│ customer_name           │               │ full_name               │
│ dob                     │ ──────────▶   │ date_of_birth           │
│ mobile                  │   Agent       │ phone                   │
│ salary_monthly          │   Mapping     │ monthly_income          │
│ loan_amount_requested   │               │ requested_amount        │
│ defaulted (Y/N)         │               │ target_default_90d      │
└─────────────────────────┘               └─────────────────────────┘

Source Data (Telco JSON)                   Standard Training Format
┌─────────────────────────┐               ┌─────────────────────────┐
│ msisdn                  │               │ phone                   │
│ account_tenure_days     │ ──────────▶   │ telco_account_age_months│
│ avg_arpu                │   Agent       │ telco_avg_monthly_spend │
│ payment_behavior        │   Mapping     │ telco_payment_regularity│
└─────────────────────────┘               └─────────────────────────┘
```

The agents use LLM-assisted mapping for unfamiliar schemas, with human review for edge cases.

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p50) | ≤ 200ms | Real-time scoring |
| API Response Time (p95) | ≤ 500ms | Real-time scoring |
| API Response Time (p99) | ≤ 1000ms | Real-time scoring |
| Throughput | 500 requests/second | Peak load |
| Bulk Processing | 10,000 records/hour | Batch scoring |

### 10.2 Availability

| Metric | Target |
|--------|--------|
| Uptime | 99.9% (8.76 hours downtime/year) |
| Planned Maintenance Window | Sundays 02:00-04:00 GMT |
| Recovery Time Objective (RTO) | 1 hour |
| Recovery Point Objective (RPO) | 15 minutes |

### 10.3 Scalability

| Dimension | Requirement |
|-----------|-------------|
| Organizations | Support 500+ concurrent organizations |
| Daily Requests | Handle 1M+ score requests per day |
| Data Storage | 5+ years of score history retention |
| Model Size | Support models up to 2GB |

### 10.4 Security

| Requirement | Implementation |
|-------------|----------------|
| Data Encryption (transit) | TLS 1.3 |
| Data Encryption (rest) | AES-256 |
| API Authentication | API Keys + IP whitelist (optional) |
| User Authentication | Email/password + 2FA (TOTP) |
| PII Protection | Field-level encryption, masking in logs |
| Audit Logging | All data access and changes logged |
| Secrets Management | Azure Key Vault |

### 10.5 Compliance

| Regulation | Requirements |
|------------|--------------|
| Ghana Data Protection Act | Consent management, data subject rights |
| Bank of Ghana Guidelines | Audit trails, reporting, model governance |
| PCI DSS (if handling cards) | Scope minimization, encryption |
| GDPR (if EU data subjects) | Data portability, right to erasure |

---

## 11. Success Metrics

### 11.1 Business Metrics

| Metric | Definition | Target (Year 1) |
|--------|------------|-----------------|
| Organizations Onboarded | Active organizations | 50 |
| Monthly Active Organizations | Orgs with ≥1 request/month | 40 |
| Monthly Score Requests | Total requests across all orgs | 100,000 |
| Net Promoter Score | Org satisfaction | ≥ 40 |

### 11.2 Product Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Time to First Score | Org onboard → first production score | < 7 days |
| API Adoption Rate | % of requests via API vs. web | > 70% |
| Decision Recording Rate | % of scores with outcome recorded | > 60% |
| Feature Utilization | % using bulk, webhooks, etc. | > 30% |

### 11.3 Technical Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| API Availability | Uptime percentage | 99.9% |
| API Latency (p50) | Median response time | < 200ms |
| Error Rate | % of requests returning errors | < 0.1% |
| Model AUC | Production model performance | > 0.75 |
| Drift Detection | Time to detect significant drift | < 24 hours |

---

## 12. Compliance & Regulatory

### 12.1 Ghana-Specific Requirements

**Bank of Ghana Guidelines on Credit Reporting:**
- Must register as a Credit Bureau or operate under licensed bureau
- Score methodology must be documented and auditable
- Consumers have right to dispute and correct information
- Data retention limits apply

**Data Protection Act 2012:**
- Explicit consent required for credit checks
- Purpose limitation on data use
- Right to access and correct personal data
- Cross-border transfer restrictions

### 12.2 Fair Lending Requirements

The Compliance Agent enforces:

| Check | Description | Threshold |
|-------|-------------|-----------|
| Demographic Parity | Score distribution across groups | < 10% variance |
| Equalized Odds | FPR/FNR across protected groups | < 5% variance |
| Disparate Impact | Approval rate ratio | > 0.8 (four-fifths rule) |

Protected characteristics in Ghana context:
- Gender
- Region/Ethnicity
- Religion
- Age (within legal bounds)

### 12.3 Explainability Requirements

Every score must include:
1. Top 5 risk factors affecting the score
2. Score component breakdown
3. Plain-language explanation available on request
4. Model version used

This enables organizations to:
- Provide adverse action notices to declined applicants
- Explain decisions to regulators
- Support consumer disputes

---

## 13. Rollout Strategy

### 13.1 Phase 1: MVP (Weeks 1-12)

**Scope:**
- Core scoring engine with LightGBM model
- Organization portal (basic)
- API with essential endpoints
- Admin portal (org management, basic model management)
- Single base model for all organizations

**Target:** 5 pilot organizations

### 13.2 Phase 2: Enhancement (Weeks 13-20)

**Scope:**
- Bulk scoring
- Advanced analytics dashboards
- Webhook reliability improvements
- Agentic data transformation pipeline
- Model retraining automation

**Target:** 20 organizations

### 13.3 Phase 3: Scale (Weeks 21-30)

**Scope:**
- Advanced compliance reporting
- Multi-model support (segment-specific)
- Performance optimization
- Full agentic AI framework operational

**Target:** 50+ organizations

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| AUC | Area Under the ROC Curve - model performance metric |
| DTI | Debt-to-Income ratio |
| KS | Kolmogorov-Smirnov statistic - model discrimination metric |
| PSI | Population Stability Index - drift detection metric |
| SHAP | SHapley Additive exPlanations - explainability method |
| Thin File | Applicant with limited credit history |

---

## Appendix B: Reference - Loan Request Mapping

The provided Golang `LoanRequest` struct maps to our schema as follows (relevant fields only):

| LoanRequest Field | CreditScoreRequest Field |
|-------------------|--------------------------|
| `Fullname` | `applicant.full_name` |
| `Amount` | `loan_request.amount` |
| `Purpose` | `loan_request.purpose` |
| `Tenure` | `loan_request.tenure_months` |
| `TenuredIn` | (converted to months) |
| `ProductType` | `metadata.product_type` |
| `BusinessName` | `employment.employer_name` (if self-employed) |
| `Status` | Not used in scoring (organization's internal state) |
| `CreditScoreCheckDone` | Tracked in our `ScoreRequest.status` |

Note: Many fields in the original struct relate to loan lifecycle management (disbursement, approvals, collections) which are **out of scope** for the credit scoring engine.

---

*End of PRD*
