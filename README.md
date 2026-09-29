# Mock GST Registration Portal (SIH26130 Prototype)

> **IMPORTANT DISCLAIMER**
> This is a **simulated prototype** for the **SIH26130** hackathon. It is **NOT** the real GST Portal and does **NOT** claim to be an official Government of India system. All integrations, OTP codes, references, and filings are simulated within a secure sandbox environment.

---

## 1. System Architecture

```text
       MAIN SIH PORTAL / BACKEND
                   │
                   ▼ (Authenticated REST API with X-API-Key)
      MOCK GST REGISTRATION BACKEND (FastAPI :8002)
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 SQLite / PostgreSQL     Uploads Storage (Local Filesystem)
        ▲                     ▲
        │                     │
  GST APPLICANT PORTAL    GST OFFICER SCRUTINY PORTAL
 (React + Vite + Tailwind :5173)
```

---

## 2. Seed Demo Credentials

| Role | Name | Email | Password | Pre-seeded Context |
| :--- | :--- | :--- | :--- | :--- |
| **Applicant** | Rahul Kumar | `rahul@example.com` | `Applicant@123` | Pre-seeded with ABC Foods Pvt Ltd applications (Query & Approved) |
| **Officer** | Officer Priya | `officer.priya@gstmock.in` | `Officer@123` | Reviewing officer for Tamil Nadu / Salem district |
| **Admin** | Administrator | `admin@gstmock.in` | `Admin@123` | Officer management, Audit logs, Integration request logs |

- **Default Mock OTP**: `123456`
- **Integration API Key (`MOCK_GST_API_KEY`)**: `gst_sih26130_secret_api_key_mock_2026`

---

## 3. Quick Run Instructions

### A. Run Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8002
```
* Backend API & Swagger: [http://localhost:8002/docs](http://localhost:8002/docs)
* Health Check: [http://localhost:8002/api/health](http://localhost:8002/api/health)

### B. Run Frontend (React + Vite + Tailwind)
```bash
cd frontend
npm install
npm run dev
```
* Web Portal: [http://localhost:5173](http://localhost:5173)

---

## 4. Main SIH Portal Integration Workflow

### 1. Prefill Application via REST API
```http
POST /api/integrations/v1/applications/prefill
X-API-Key: gst_sih26130_secret_api_key_mock_2026
Content-Type: application/json

{
  "external_reference_id": "SIH-APP-1001",
  "source_system": "SIH26130",
  "applicant": {
    "name": "Rahul Kumar",
    "mobile": "9876543210",
    "email": "rahul@example.com"
  },
  "business": {
    "legal_name": "ABC Foods Private Limited",
    "trade_name": "ABC Foods",
    "pan": "ABCDE1234F",
    "constitution": "PRIVATE_LIMITED",
    "business_activity": "MANUFACTURER",
    "state": "Tamil Nadu",
    "district": "Salem",
    "pincode": "636001"
  },
  "principal_place": {
    "premise_name": "ABC Food Processing Complex",
    "locality": "SIDCO Industrial Estate",
    "state": "Tamil Nadu",
    "district": "Salem",
    "pincode": "636001",
    "nature_of_possession": "RENTED"
  },
  "goods_services": [
    {
      "type": "GOODS",
      "description": "Packaged Snacks (Prototype Example)",
      "hsn_sac_code": "2106"
    }
  ]
}
```

**Response (`201 Created` or `200 OK` Idempotent):**
```json
{
  "success": true,
  "application_number": "GST-MOCK-2026-000123",
  "external_reference_id": "SIH-APP-1001",
  "status": "DRAFT",
  "prefilled_fields": 15,
  "missing_fields": ["Required document is missing: Pan Card", "Required document is missing: Aadhaar Card"],
  "message": "GST registration application prefilled successfully from SIH Portal."
}
```

### 2. Check Application Status
```http
GET /api/integrations/v1/applications/GST-MOCK-2026-000123/status
X-API-Key: gst_sih26130_secret_api_key_mock_2026
```

**Response:**
```json
{
  "application_number": "GST-MOCK-2026-000123",
  "external_reference_id": "SIH-APP-1001",
  "status": "DOCUMENT_QUERY",
  "last_updated_at": "2026-09-26T12:00:00Z",
  "mock_registration_ref": null,
  "pending_actions": [
    {
      "type": "DOCUMENT_QUERY",
      "query_id": 1,
      "subject": "Address Proof Clarification",
      "message": "Please upload a clearer principal place premises document."
    }
  ]
}
```

---

## 5. Key Capabilities Implemented

- **11-Step Application Stepper**: Complete business, promoter, signatory, dynamic possession premises, goods/services classifications, and document checklist.
- **Officer Scrutiny Console**: Search & filter, 11 scrutiny tabs, inline document review with mandatory rejection comments, query raising & resolution, and approval with simulated GST Reference generation (`GST-REG-MOCK-2026-XXXXXX`).
- **Simulated OTP Flow**: 6-digit mock OTP (`123456`) with countdown, resend, and verification checks.
- **Audit Logs & Notifications**: Automatic activity tracking for logins, draft edits, uploads, queries, and status changes.
- **SIH Integration Sandbox**: Interactive UI tool to test the SIH prefill, status sync, and application retrieval APIs.
