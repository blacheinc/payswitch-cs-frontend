# Frontend Integration Guide — Monitoring & Dashboard APIs

> **Version**: 1.0 · **Date**: April 14, 2026 · **Backend**: PaySwitch Credit Scoring API

---

## Authentication

All monitoring endpoints require **Admin JWT authentication**.

```http
Authorization: Bearer <admin-jwt-token>
```

The admin token is obtained via `POST /auth/admin/login`. The same token used for the existing admin panel works here.

> [!IMPORTANT]
> `POST /v1/rules/evaluate` also supports **API Key** authentication (`Authorization: Bearer sk_live_xxx`), but all `/v1/monitoring/*` endpoints are **admin-only**.

---

## Error Format

All errors follow the existing API envelope:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Champion metadata not available yet. No training run has completed.",
    "details": {}
  }
}
```

HTTP status codes: `401` (no token), `403` (invalid/expired token), `422` (invalid params), `500` (server error).

---

## Endpoints

### 1. GET `/v1/models/current` — Champion Model Metadata

Returns the active champion models registered in Azure ML. **Will return 404 until the first training pipeline completes.**

**Response `200`:**
```json
{
  "updated_at": "2026-04-10T14:30:00Z",
  "models": [
    {
      "model_type": "credit_risk",
      "registry_name": "credit-risk-champion",
      "version": "3",
      "status": "REGISTERED",
      "created_at": "2026-04-10T14:30:00Z",
      "metrics": {
        "auc": 0.847,
        "f1": 0.782,
        "accuracy": 0.815
      },
      "tags": {
        "training_run": "run-abc123"
      }
    },
    {
      "model_type": "fraud_detection",
      "registry_name": "fraud-detection-champion",
      "version": "2",
      "status": "REGISTERED",
      "metrics": { "auc": 0.912 }
    }
  ]
}
```

**Response `404`:** (expected initially)
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Champion metadata not available yet. No training run has completed.",
    "details": {}
  }
}
```

---

### 2. POST `/v1/rules/evaluate` — Sandbox Rule Evaluation

Forwards a scoring scenario to the orchestrator for rule evaluation. Used for "what-if" scenarios on the dashboard.

**Request Body:**
```json
{
  "probability_of_default": 0.35,
  "score_grade": "C",
  "data_engineer_decision_label": "APPROVE",
  "fraud_risk_flag": "LOW",
  "recommended_loan_amount_ghs": 5000.0,
  "features": { "applicant_age": 35 },
  "metadata": {}
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `probability_of_default` | `float` | ✅ | 0.0 – 1.0 |
| `score_grade` | `string` | ✅ | One of: A, B, C, D, E, F |
| `data_engineer_decision_label` | `string` | ❌ | |
| `fraud_risk_flag` | `string` | ❌ | |
| `recommended_loan_amount_ghs` | `float` | ❌ | |
| `features` | `object` | ❌ | Key-value feature overrides |
| `metadata` | `object` | ❌ | Arbitrary metadata |

**Response `200`:** (proxied from orchestrator)
```json
{
  "decision": "CONDITIONAL_APPROVE",
  "conditions": ["Reduce loan amount to 3000 GHS"],
  "risk_tier": "MEDIUM",
  "rules_applied": [
    { "rule": "max_pd_by_grade", "result": "pass" },
    { "rule": "fraud_check", "result": "pass" }
  ]
}
```

**Error `422`:** (client validation)
```json
{
  "detail": [
    {
      "loc": ["body", "probability_of_default"],
      "msg": "Input should be less than or equal to 1",
      "type": "less_than_equal"
    }
  ]
}
```

**Error `502`:** (orchestrator unavailable)
```json
{
  "error": "upstream_error",
  "detail": "Orchestrator service unavailable"
}
```

---

### 3. GET `/v1/monitoring/infrastructure` — Infrastructure Dashboard

**Query Parameters:**

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `period` | string | `24h` | `1h`, `6h`, `24h`, `7d`, `30d` |
| `endpoint` | string | — | Filter to a specific API path (e.g. `/v1/score-requests`) |

**Response `200`:**
```json
{
  "period": "24h",
  "generated_at": "2026-04-14T15:30:00Z",
  "request_volume": {
    "total": 1247,
    "by_endpoint": [
      { "endpoint": "/v1/score-requests", "method": "POST", "count": 523 },
      { "endpoint": "/v1/score-requests/{id}", "method": "GET", "count": 312 }
    ]
  },
  "latency": {
    "p50_ms": 45.0,
    "p95_ms": 230.0,
    "p99_ms": 890.0,
    "by_endpoint": [
      { "endpoint": "/v1/score-requests", "p50_ms": 120.0, "p95_ms": 450.0, "p99_ms": 980.0 }
    ]
  },
  "error_rates": {
    "overall_pct": 0.8,
    "by_status": [
      { "status_code": 400, "count": 5, "pct": 0.4 },
      { "status_code": 500, "count": 3, "pct": 0.2 }
    ]
  },
  "timeseries": [
    { "bucket": "2026-04-14T14:00:00Z", "requests": 85, "errors": 1, "p99_ms": 320.0 },
    { "bucket": "2026-04-14T14:15:00Z", "requests": 92, "errors": 0, "p99_ms": 280.0 }
  ],
  "alerts": [
    {
      "metric": "api_latency_p99",
      "current_value": 890.0,
      "threshold": 1000,
      "status": "ok"
    },
    {
      "metric": "api_error_rate",
      "current_value": 0.8,
      "threshold": 1.0,
      "status": "ok"
    }
  ]
}
```

---

### 4. GET `/v1/monitoring/risk` — Risk Dashboard

**Query Parameters:**

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `period` | string | `7d` | `24h`, `7d`, `30d`, `90d` |
| `segment` | string | — | Filter by score grade: `A`, `B`, `C`, `D`, `E`, `F` |

**Response `200`:**
```json
{
  "period": "7d",
  "generated_at": "2026-04-14T15:30:00Z",
  "approval_rates": {
    "overall": {
      "total_decisions": 342,
      "approve": 156,
      "conditional_approve": 45,
      "decline": 120,
      "refer": 15,
      "error": 6,
      "approve_rate_pct": 45.6,
      "conditional_approve_rate_pct": 13.2,
      "decline_rate_pct": 35.1
    },
    "by_grade": [
      { "grade": "A", "total": 80, "approve_rate_pct": 92.5, "decline_rate_pct": 2.5 },
      { "grade": "B", "total": 65, "approve_rate_pct": 73.8, "decline_rate_pct": 10.8 },
      { "grade": "C", "total": 72, "approve_rate_pct": 41.7, "decline_rate_pct": 36.1 },
      { "grade": "D", "total": 55, "approve_rate_pct": 12.7, "decline_rate_pct": 67.3 },
      { "grade": "E", "total": 40, "approve_rate_pct": 5.0, "decline_rate_pct": 85.0 },
      { "grade": "F", "total": 30, "approve_rate_pct": 0.0, "decline_rate_pct": 100.0 }
    ]
  },
  "score_distribution": {
    "buckets": [
      { "range": "300-400", "count": 15 },
      { "range": "400-500", "count": 42 },
      { "range": "500-600", "count": 98 },
      { "range": "600-700", "count": 112 },
      { "range": "700-800", "count": 55 },
      { "range": "800-900", "count": 20 }
    ],
    "mean": 587.0,
    "median": 605.0,
    "std_dev": 115.0
  },
  "risk_tier_breakdown": [
    { "tier": "LOW", "count": 120, "pct": 35.1 },
    { "tier": "MEDIUM", "count": 142, "pct": 41.5 },
    { "tier": "HIGH", "count": 80, "pct": 23.4 }
  ],
  "timeseries": [
    {
      "bucket": "2026-04-08",
      "total_decisions": 48,
      "approve_rate_pct": 45.8,
      "decline_rate_pct": 33.3,
      "mean_credit_score": 592.0
    }
  ],
  "alerts": [
    {
      "metric": "approval_rate_7d_shift",
      "current_value": 3.2,
      "threshold": 10.0,
      "status": "ok"
    }
  ]
}
```

---

### 5. GET `/v1/monitoring/model-ops` — ModelOps Dashboard

**Query Parameters:**

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `model_type` | string | — | `credit_risk`, `fraud_detection`, `loan_amount`, `income_verification` |
| `period` | string | `30d` | `7d`, `30d`, `90d` |

**Response `200`:**
```json
{
  "period": "30d",
  "generated_at": "2026-04-14T15:30:00Z",
  "champions": [
    {
      "model_type": "credit_risk",
      "registry_name": "credit-risk-champion",
      "version": "3",
      "status": "REGISTERED",
      "created_at": "2026-04-10T14:30:00Z",
      "current_metrics": { "auc": 0.847, "f1": 0.782 },
      "live_auc": 0.847,
      "auc_change_pct": 0.0,
      "auc_alert": false
    }
  ],
  "feature_drift": [
    { "feature": "applicant_age", "psi": 0.05, "status": "ok" },
    { "feature": "total_outstanding_debt", "psi": 0.32, "status": "alert" }
  ],
  "retraining_history": [
    {
      "training_id": "run-abc123",
      "completed_at": "2026-04-10T14:30:00Z",
      "model_type": "credit_risk",
      "result": "success",
      "metrics_before": { "auc": 0.831 },
      "metrics_after": { "auc": 0.847 }
    }
  ],
  "score_distribution_psi": [
    { "model_type": "credit_risk", "psi": 0.08, "status": "ok" }
  ],
  "alerts": [
    {
      "metric": "feature_drift_psi",
      "feature": "total_outstanding_debt",
      "current_value": 0.32,
      "threshold": 0.25,
      "status": "firing"
    }
  ]
}
```

---

### 6. GET `/v1/monitoring/compliance` — Compliance Dashboard

**Query Parameters:**

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `period` | string | `30d` | `7d`, `30d`, `90d` |

**Response `200`:**
```json
{
  "period": "30d",
  "generated_at": "2026-04-14T15:30:00Z",
  "fairness_metrics": {
    "demographic_parity": {
      "approval_rate_by_age_group": [
        { "group": "18-25", "approval_rate_pct": 32.5, "count": 40 },
        { "group": "26-35", "approval_rate_pct": 48.2, "count": 85 },
        { "group": "36-45", "approval_rate_pct": 55.1, "count": 98 },
        { "group": "46-55", "approval_rate_pct": 51.0, "count": 49 },
        { "group": "56+", "approval_rate_pct": 40.0, "count": 15 }
      ],
      "max_disparity_pct": 22.6
    }
  },
  "audit_log": {
    "total_decisions_logged": 342,
    "decisions_with_full_explainability": 318,
    "coverage_pct": 93.0,
    "error_decisions": 6,
    "avg_data_quality_score": 0.82,
    "dqs_p25": 0.71
  },
  "data_subject_requests": {
    "total": 0,
    "pending": 0,
    "completed": 0,
    "avg_resolution_days": 0.0
  },
  "regulation_alerts": [],
  "alerts": [
    {
      "metric": "data_quality_score_p25",
      "current_value": 0.71,
      "threshold": 0.60,
      "status": "ok"
    },
    {
      "metric": "fairness_max_disparity",
      "current_value": 22.6,
      "threshold": 25.0,
      "status": "ok"
    }
  ]
}
```

---

### 7. GET `/v1/monitoring/alerts` — Unified Alert Feed

**Query Parameters:**

| Param | Type | Default | Values |
|-------|------|---------|--------|
| `status` | string | — | `firing`, `resolved`, `ok` |
| `severity` | string | — | `warning`, `critical` |
| `limit` | integer | `50` | 1 – 200 |

**Response `200`:**
```json
{
  "generated_at": "2026-04-14T15:30:00Z",
  "alerts": [
    {
      "id": "ALT-20260414-A3F2B1",
      "metric": "feature_drift_psi",
      "dashboard": "model_ops",
      "severity": "warning",
      "status": "firing",
      "current_value": 0.32,
      "threshold": 0.25,
      "detail": "Feature drift PSI exceeds 0.25",
      "feature": "total_outstanding_debt",
      "model_type": null,
      "recommended_action": "Review feature engineering pipeline",
      "created_at": "2026-04-14T10:00:00Z",
      "resolved_at": null
    }
  ],
  "summary": {
    "total_firing": 1,
    "critical_firing": 0,
    "warning_firing": 1
  }
}
```

---

## TypeScript Interfaces

```typescript
// ── Shared ──────────────────────────────────────────────────────────

interface AlertItem {
  metric: string;
  current_value: number;
  threshold: number;
  status: "ok" | "firing" | "resolved";
  feature?: string;
  model_type?: string;
}

// ── Infrastructure ──────────────────────────────────────────────────

interface InfrastructureResponse {
  period: string;
  generated_at: string;
  request_volume: {
    total: number;
    by_endpoint: Array<{ endpoint: string; method: string; count: number }>;
  };
  latency: {
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
    by_endpoint: Array<{
      endpoint: string;
      p50_ms: number;
      p95_ms: number;
      p99_ms: number;
    }>;
  };
  error_rates: {
    overall_pct: number;
    by_status: Array<{ status_code: number; count: number; pct: number }>;
  };
  timeseries: Array<{
    bucket: string;
    requests: number;
    errors: number;
    p99_ms: number;
  }>;
  alerts: AlertItem[];
}

// ── Risk ────────────────────────────────────────────────────────────

interface RiskResponse {
  period: string;
  generated_at: string;
  approval_rates: {
    overall: {
      total_decisions: number;
      approve: number;
      conditional_approve: number;
      decline: number;
      refer: number;
      error: number;
      approve_rate_pct: number;
      conditional_approve_rate_pct: number;
      decline_rate_pct: number;
    };
    by_grade: Array<{
      grade: string;
      total: number;
      approve_rate_pct: number;
      decline_rate_pct: number;
    }>;
  };
  score_distribution: {
    buckets: Array<{ range: string; count: number }>;
    mean: number;
    median: number;
    std_dev: number;
  };
  risk_tier_breakdown: Array<{ tier: string; count: number; pct: number }>;
  timeseries: Array<{
    bucket: string;
    total_decisions: number;
    approve_rate_pct: number;
    decline_rate_pct: number;
    mean_credit_score: number;
  }>;
  alerts: AlertItem[];
}

// ── ModelOps ────────────────────────────────────────────────────────

interface ModelOpsResponse {
  period: string;
  generated_at: string;
  champions: Array<{
    model_type: string;
    registry_name: string;
    version: string;
    status: string;
    created_at?: string;
    current_metrics: Record<string, number>;
    live_auc?: number;
    auc_change_pct?: number;
    auc_alert?: boolean;
  }>;
  feature_drift: Array<{
    feature: string;
    psi: number;
    status: "ok" | "alert";
  }>;
  retraining_history: Array<{
    training_id: string;
    completed_at: string;
    model_type: string;
    result: string;
    metrics_before: Record<string, number>;
    metrics_after: Record<string, number>;
  }>;
  score_distribution_psi: Array<{
    model_type: string;
    psi: number;
    status: "ok" | "alert";
  }>;
  alerts: AlertItem[];
}

// ── Compliance ──────────────────────────────────────────────────────

interface ComplianceResponse {
  period: string;
  generated_at: string;
  fairness_metrics: {
    demographic_parity: {
      approval_rate_by_age_group: Array<{
        group: string;
        approval_rate_pct: number;
        count: number;
      }>;
      max_disparity_pct: number;
    };
  };
  audit_log: {
    total_decisions_logged: number;
    decisions_with_full_explainability: number;
    coverage_pct: number;
    error_decisions: number;
    avg_data_quality_score: number;
    dqs_p25: number;
  };
  data_subject_requests: {
    total: number;
    pending: number;
    completed: number;
    avg_resolution_days: number;
  };
  regulation_alerts: any[];
  alerts: AlertItem[];
}

// ── Alerts ──────────────────────────────────────────────────────────

interface AlertDetail {
  id: string;
  metric: string;
  dashboard: "infrastructure" | "risk" | "model_ops" | "compliance";
  severity: "warning" | "critical";
  status: "firing" | "resolved" | "ok";
  current_value: number;
  threshold: number;
  detail?: string;
  feature?: string;
  model_type?: string;
  recommended_action?: string;
  created_at: string;
  resolved_at?: string;
}

interface AlertsResponse {
  generated_at: string;
  alerts: AlertDetail[];
  summary: {
    total_firing: number;
    critical_firing: number;
    warning_firing: number;
  };
}

// ── Rules Evaluate ──────────────────────────────────────────────────

interface RuleEvaluateRequest {
  probability_of_default: number; // 0.0 – 1.0
  score_grade: "A" | "B" | "C" | "D" | "E" | "F";
  data_engineer_decision_label?: string;
  fraud_risk_flag?: string;
  recommended_loan_amount_ghs?: number;
  features?: Record<string, number>;
  metadata?: Record<string, any>;
}

// ── Champions ───────────────────────────────────────────────────────

interface ChampionModelResponse {
  updated_at: string;
  models: Array<{
    model_type: string;
    registry_name: string;
    version: string;
    status: string;
    created_at?: string;
    metrics: Record<string, number>;
    tags?: Record<string, string>;
    error?: string;
  }>;
}
```

---

## Recommended Polling Strategy

| Dashboard | Poll Interval | Notes |
|-----------|--------------|-------|
| Infrastructure | 30 seconds | Real-time latency/error monitoring |
| Risk | 5 minutes | Decision data updates on each scoring |
| ModelOps | 10 minutes | Champion/drift data changes slowly |
| Compliance | 10 minutes | Fairness metrics change slowly |
| Alerts (banner) | 60 seconds | Global alert banner in nav bar |
| Models/current | On demand | Only on page load / manual refresh |

### Example: React Query Hook

```tsx
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useInfrastructureMetrics(period = "24h") {
  return useQuery({
    queryKey: ["monitoring", "infrastructure", period],
    queryFn: () => api.get(`/v1/monitoring/infrastructure?period=${period}`).then(r => r.data),
    refetchInterval: 30_000, // 30 seconds
    staleTime: 15_000,
  });
}

export function useAlertsBanner() {
  return useQuery({
    queryKey: ["monitoring", "alerts", "firing"],
    queryFn: () => api.get("/v1/monitoring/alerts?status=firing&limit=5").then(r => r.data),
    refetchInterval: 60_000, // 1 minute
    staleTime: 30_000,
  });
}
```

---

## Alert Thresholds Reference

These are the backend-configured thresholds. The FE should use them to render severity badges:

| Metric | Threshold | Op | Severity | Dashboard |
|--------|-----------|----|----------|-----------|
| `api_latency_p99` | 1000ms | > | critical | Infrastructure |
| `api_error_rate` | 1.0% | > | critical | Infrastructure |
| `score_distribution_psi` | 0.20 | > | critical | ModelOps |
| `feature_drift_psi` | 0.25 | > | warning | ModelOps |
| `champion_auc_drop` | 2.0% | > | critical | ModelOps |
| `approval_rate_7d_shift` | 10.0% | > | critical | Risk |
| `data_quality_score_p25` | 0.60 | < | warning | Compliance |
| `fairness_max_disparity` | 25.0% | > | critical | Compliance |

> **Note**: Alert `status` can be `"ok"`, `"firing"`, or `"resolved"`. Use `"firing"` to show red badges, `"ok"` for green.
