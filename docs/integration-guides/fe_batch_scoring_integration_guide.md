# Batch Scoring Integration Guide — Frontend Engineer

## Overview

Batch scoring lets the org submit up to **100 applicants in one request** and have
the backend perform bureau lookup + scoring for each one independently.

Submission is asynchronous: the API returns a `job_id` immediately and you poll
for progress. Results stream in as items finish — you don't have to wait for the
whole job to complete before showing data.

```
POST   /v1/score/batch                   — submit a batch
GET    /v1/score/batch                   — list batch jobs for the org
GET    /v1/score/batch/{job_id}          — progress + per-status counts
GET    /v1/score/batch/{job_id}/results  — paginated per-item results
POST   /v1/score/batch/{job_id}/cancel   — cancel a queued/processing job
```

All endpoints require an authenticated org user (JWT) or org API key with the
appropriate `batch_scoring.*` permission — see the
[RBAC Integration Guide](./fe_rbac_integration_guide.md).

| Endpoint | Required permission |
|---|---|
| `POST   /v1/score/batch` | `batch_scoring.create` |
| `GET    /v1/score/batch` | `batch_scoring.list` |
| `GET    /v1/score/batch/{job_id}` | `batch_scoring.read` |
| `GET    /v1/score/batch/{job_id}/results` | `batch_scoring.read` |
| `POST   /v1/score/batch/{job_id}/cancel` | `batch_scoring.cancel` |

---

## Lifecycle

```
            ┌──────────┐ submit
            │ (client) │────────► POST /v1/score/batch
            └──────────┘                │
                                        ▼
                                  ┌──────────┐
                                  │  queued  │  ← returned immediately (HTTP 202)
                                  └──────────┘
                                        │ worker picks first item
                                        ▼
                                  ┌────────────┐
                                  │ processing │  ← items move pending→processing→(completed|failed)
                                  └────────────┘
                                        │ all items terminal
                                        ▼
                       ┌─────────────┬─────────────┬─────────────┐
                       │  completed  │   failed    │  cancelled  │
                       └─────────────┴─────────────┴─────────────┘
```

Job-level statuses: `queued`, `processing`, `completed`, `failed`, `cancelled`.
Item-level statuses: `pending`, `processing`, `completed`, `failed`, `cancelled`.

> **Note:** A `completed` item is **not the same as an approved applicant**.
> Hard-stop declines (underage, court judgement, etc.) also produce `completed`
> items — the scoring pipeline ran to completion and produced a `DECLINE`
> decision. Only items that errored mid-pipeline are `failed`.

---

## 1. Submit a batch

**`POST /v1/score/batch`**

Each item is essentially a bureau-lookup payload — the worker performs the XDS
lookup itself, so you don't need to call `/v1/bureau-lookup` first.

### Request body

```json
{
  "items": [
    {
      "full_name": "John Doe",
      "date_of_birth": "1990-05-15",
      "identification": "3611003033",
      "phone_number": "0244123456",
      "account_number": null,
      "enquiry_reason": "Application for credit by a borrower"
    }
  ]
}
```

### Item field rules

| Field | Type | Required | Notes |
|---|---|---|---|
| `full_name` | string | optional | 2–200 chars. Optional if `identification` is provided. |
| `date_of_birth` | `YYYY-MM-DD` | **required** | ISO date. |
| `identification` | string | optional | National ID / Ghana Card. Up to 50 chars. |
| `phone_number` | string | optional | Pattern `^\+?[0-9]{10,15}$`. Used for Product 49 lookup. |
| `account_number` | string | optional | Up to 50 chars. |
| `enquiry_reason` | string | optional | Defaults to `"Application for credit by a borrower"`. |

**Constraints**

- Array length: **1–100**.
- At least one of `full_name`, `identification`, or `phone_number` must be
  populated for the bureau to find a match. Items missing all three will run
  through the pipeline and almost certainly hit a hard-stop decline.

### Response — `202 Accepted`

```json
{
  "job_id": "BATCH-20260418-9F3A1C7B",
  "status": "queued",
  "total": 3,
  "requested_at": "2026-04-18T10:14:22Z"
}
```

Persist the `job_id` — you'll need it for every subsequent call. The format is
`BATCH-YYYYMMDD-<8-hex>` and is suitable for display.

### Error responses

| Status | When |
|---|---|
| `400` | Validation error in any item (bad date format, empty array, > 100 items). |
| `401` / `403` | Missing/invalid auth, or no `batch_scoring.create` permission. |
| `503` | Internal queue (Redis) was unreachable. Show a "please retry" toast — nothing was persisted. |

---

## 2. Poll job progress

**`GET /v1/score/batch/{job_id}`**

Cheap to call — aggregates status counts directly from the DB.

### Response — `200 OK`

```json
{
  "job_id": "BATCH-20260418-9F3A1C7B",
  "status": "processing",
  "total": 3,
  "progress_pct": 33,
  "items": {
    "pending": 1,
    "processing": 1,
    "completed": 1,
    "failed": 0,
    "cancelled": 0
  },
  "requested_at": "2026-04-18T10:14:22Z",
  "started_at": "2026-04-18T10:14:25Z",
  "completed_at": null
}
```

### Polling recommendation

- Poll every **3–5 seconds** while the job is `queued` or `processing`.
- Stop polling as soon as `status` is one of `completed`, `failed`, or
  `cancelled` — those are terminal.
- `progress_pct` is `(completed + failed + cancelled) / total * 100`, rounded.
  Use it to drive a progress bar.

---

## 3. Fetch per-item results

**`GET /v1/score/batch/{job_id}/results?status=&page=&page_size=`**

Items become available as soon as they finish — you don't need to wait for the
whole job. Useful patterns:

- **Live results table**: poll with no filter, page 1 — newly-completed rows
  appear with each refresh. Items are ordered by their original `index`.
- **Errors-only view**: `?status=failed` — show the user only the rows that
  need attention.
- **Successes-only view**: `?status=completed`.

### Query parameters

| Param | Default | Notes |
|---|---|---|
| `status` | (all) | One of `pending`, `processing`, `completed`, `failed`, `cancelled`. |
| `page` | `1` | 1-indexed. |
| `page_size` | `50` | Max `100`. |

### Response — `200 OK`

```json
{
  "job_id": "BATCH-20260418-9F3A1C7B",
  "items": [
    {
      "index": 0,
      "status": "completed",
      "score_request_id": "8c9b2c1e-1d2f-4f9a-8c7b-22e2c4a3a1f0",
      "score_tracking_id": "SCR-E82BE69DEED0",
      "error_code": null,
      "error_message": null,
      "payload": { "full_name": "John Doe", "date_of_birth": "1990-05-15", "...": "..." },
      "completed_at": "2026-04-18T10:14:31Z"
    },
    {
      "index": 1,
      "status": "failed",
      "score_request_id": null,
      "score_tracking_id": null,
      "error_code": "bureau_failed",
      "error_message": "Invalid isoformat string: 'not-a-real-date'",
      "payload": { "full_name": "Jane Doe", "date_of_birth": "not-a-real-date", "...": "..." },
      "completed_at": "2026-04-18T10:14:28Z"
    }
  ],
  "total": 2,
  "page": 1,
  "page_size": 50
}
```

### Field semantics

| Field | When populated |
|---|---|
| `score_request_id` | `completed` items — the internal UUID of the created `ScoreRequest`. Use this for any internal API call that takes a request id. |
| `score_tracking_id` | `completed` items — the human-readable tracking id (`SCR-XXXX`). **Use this in the UI** and as the deep-link target. |
| `error_code` | `failed` items only. Currently `bureau_failed` or `scoring_error`. |
| `error_message` | `failed` items only. Truncated to 1000 chars, safe to display. |
| `payload` | Always — the original payload for that item, so you can identify the applicant in your table without keeping a parallel client-side map. |
| `completed_at` | All terminal statuses (`completed`, `failed`, `cancelled`). |

### Error code reference

| `error_code` | Meaning | Recoverable? |
|---|---|---|
| `bureau_failed` | The bureau lookup raised an unrecoverable error (login failed, malformed payload, etc.). | Re-submit the applicant individually after fixing input data. |
| `scoring_error` | Bureau succeeded but the scoring pipeline failed (e.g., DE inference call rejected). The corresponding `ScoreRequest` exists with `status=failed` and an error `ScoringResult` row — you can deep-link to it for diagnostics. | Usually a re-submit will work. |

### Deep-linking into a single result

For each `completed` item, the FE can navigate to the existing single-score
detail screens using `score_tracking_id`:

```
GET /v1/score-requests/{tracking_id}
GET /v1/score-requests/{tracking_id}/scoring-result
```

Same for `failed` items where `score_tracking_id` is set (i.e. `scoring_error`
failures — the score request was created before the failure). For
`bureau_failed` items, both id fields are `null` and there's nothing to deep-link to.

---

## 4. List previous batch jobs

**`GET /v1/score/batch?status=&page=&page_size=`**

Org-scoped — only returns jobs owned by the authenticated org.

### Response — `200 OK`

```json
{
  "items": [
    {
      "job_id": "BATCH-20260418-9F3A1C7B",
      "status": "completed",
      "total": 100,
      "completed": 97,
      "failed": 3,
      "requested_at": "2026-04-18T10:14:22Z",
      "completed_at": "2026-04-18T10:18:51Z"
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20
}
```

`page_size` defaults to `20`, max `100`. Filter by `status` exactly as in the
results endpoint.

---

## 5. Cancel a batch

**`POST /v1/score/batch/{job_id}/cancel`**

Marks all `pending` items as `cancelled` and flips the job status to
`cancelled`. Items that are mid-flight (`processing`) finish naturally — the
worker checks status before starting each item.

### Allowed states

Only jobs with status `queued` or `processing` can be cancelled. Calling cancel
on a terminal job returns `409 Conflict`.

### Response — `200 OK`

```json
{
  "job_id": "BATCH-20260418-9F3A1C7B",
  "status": "cancelled",
  "cancelled_items": 47
}
```

`cancelled_items` is the count of pending items that were just transitioned —
it does **not** include items that had already completed or failed.

---

## End-to-end example

```ts
// 1. Submit
const submit = await fetch("/v1/score/batch", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ items: applicants }),
});
const { job_id, total } = await submit.json();

// 2. Poll until terminal
while (true) {
  await new Promise((r) => setTimeout(r, 3000));
  const status = await fetch(`/v1/score/batch/${job_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  setProgress(status.progress_pct);
  setCounts(status.items);

  if (["completed", "failed", "cancelled"].includes(status.status)) break;
}

// 3. Pull all results (paginate if total > 100)
const results = await fetch(`/v1/score/batch/${job_id}/results?page_size=100`, {
  headers: { Authorization: `Bearer ${token}` },
}).then((r) => r.json());

renderTable(results.items);
```

---

## UX recommendations

- **Show the `job_id` to the user** so they can reference a batch later or share
  it with support.
- **Don't block the UI on completion** — render rows incrementally as items
  finish. A 100-item batch can take a few minutes if the bureau is slow.
- **Error rows shouldn't break the table** — render them inline with a distinct
  badge plus the `error_message` in a tooltip. The original `payload` is echoed
  back so the user can see which applicant failed.
- **Cancel is destructive** — confirm before calling, and disable the button
  once the job is terminal.
- **Re-submitting failed items**: the failed item's `payload` field gives you
  everything needed to construct a single-applicant retry through either
  `/v1/score-requests` or a 1-item batch.
