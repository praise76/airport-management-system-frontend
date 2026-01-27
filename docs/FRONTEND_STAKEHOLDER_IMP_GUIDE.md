# Frontend Implementation Guide: Stakeholder Portal & Admin Dashboard

This document serves as the comprehensive guide for implementing the frontend interfaces for the Stakeholder Management System. It is based on the fully implemented backend modules (`src/modules/stakeholder-orgs`).

## 1. System Overview

The system consists of two distinct interfaces:

1.  **Admin Dashboard (Internal)**: For airport staff (FAAN) to verify organizations, approve permits, and oversee operations.
2.  **Stakeholder Portal (External)**: For external partners (Airlines, Contractors, Vendors) to register, submit applications, and manage their operations.

---

## 2. Admin Dashboard (Internal Staff)

**Target Audience:** RGM, HODs, Commercial Dept, Security Dept.

### 2.1. Stakeholder Directory & Verification

**Route:** `/admin/stakeholders`
**API Endpoint:** `GET /api/stakeholder-orgs`

- **UI Components:**
  - **Data Grid:** Columns for Org Name, Type, Contact Person, Status (Verified/Pending), Payment Status.
  - **Filters:** Filter by Type (Airline, Vendor, etc.), Status, and Verification Level.
  - **Quick Actions:** "View Details", "Suspend", "Blacklist".

### 2.2. Organization Verification Queue

**Route:** `/admin/stakeholders/verification`
**API Endpoint:** `GET /api/stakeholder-orgs?status=pending_verification`

- **Workflow:**
  1.  List organizations waiting for verification.
  2.  Click to view **Organization Detail View**.
  3.  **Document Viewer:** Preview uploaded documents (CAC, Tax Clearance, etc.) side-by-side with data.
  4.  **Action Buttons:**
      - **Verify:** Calls `POST /api/stakeholder-orgs/:id/verify`. Prompt for "Verified By" notes.
      - **Reject:** Calls `POST /api/stakeholder-orgs/:id/reject`. Require a "Rejection Reason" (mandatory).

### 2.3. Organization Detail View

**Route:** `/admin/stakeholders/:id`
**API Endpoint:** `GET /api/stakeholder-orgs/:id`

- **Tabs:**
  - **Overview:** Basic info, contact details, verification status.
  - **Documents:** List of all uploaded compliance docs with expiry dates.
  - **Personnel:** List of registered users (`GET /:orgId/users`) and permit holders.
  - **Activities:** Log of all requests/submissions (`GET /:orgId/activities`).
  - **Finance:** Invoices and payment history (`GET /:orgId/invoices`).

### 2.4. Access Permit Management (Global Admin Queue)

**Route:** `/admin/permits`
**API Endpoint:** `GET /api/stakeholder-orgs/permits` ✅ **(NEW - Global)**

This endpoint returns ALL permits across ALL stakeholder organizations for the admin queue.

**Query Parameters:**

| Parameter    | Type   | Values                                                       | Description                                       |
| ------------ | ------ | ------------------------------------------------------------ | ------------------------------------------------- |
| `status`     | string | `pending`, `approved`, `rejected`, `expired`                 | Filter by status                                  |
| `permitType` | string | `permanent_staff`, `temporary`, `visitor`, `vehicle`, `crew` | Filter by type                                    |
| `search`     | string | any                                                          | Search personnel name, permit number, or org name |
| `page`       | number | default: 1                                                   | Pagination                                        |
| `limit`      | number | default: 20                                                  | Items per page                                    |

**Response:**

```json
{
  "items": [
    {
      "id": "uuid",
      "permitNumber": "PER-2026-00001",
      "permitType": "permanent_staff",
      "personnelName": "John Doe",
      "status": "pending",
      "validFrom": "2026-01-01",
      "validUntil": "2026-12-31",
      "organizationName": "Air Peace",
      "stakeholderType": "airline",
      "createdAt": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

- **Features:**
  - View all permit applications (Personnel & Vehicle) across all orgs.
  - **Approval Workflow:** Review applicant details → Check security clearance → `POST /permits/:permitId/approve` or `/reject`.
  - **Print Badge:** Generate a printable pass layout for approved permits.

---

## 3. Stakeholder Portal (External App)

**Target Audience:** Airlines, Ground Handlers, Concessionaires, Contractors.

### 3.1. Registration Wizard (Public)

**Route:** `/register`
**API Endpoint:** `POST /api/stakeholder-orgs`

- **Step 1: Organization Type**
  - Select Category: Airline, Contractor, Vendor, Government Agency, etc.
  - _Dynamic Fields based on selection:_
    - **Airline:** Show IATA Code, AOC Number fields.
    - **Contractor:** Show Project Reference, Category (Civil/Electrical).
    - **Tenant:** Show Lease Agreement Number, Shop Location.

- **Step 2: Basic Information**
  - Organization Name, Registration Number (RC/CAC), TIN.
  - Contact Person, Email, Phone, Address.

- **Step 3: Document Upload**
  - Upload required files (PDF/JPG):
    - CAC Certificate
    - Tax Clearance
    - Insurance Policy
    - (Conditional) AOC for Airlines, Trade License for Vendors.

- **Step 4: Admin User Creation**
  - Create the first user (Owner/Admin) for the portal account.

### 3.2. Dashboard (Home)

**Route:** `/dashboard`
**API Endpoint:** `GET /api/stakeholder-orgs/stats`

- **Widgets:**
  - **Compliance Status:** "Verified", "Pending", "Documents Expiring Soon".
  - **Quick Links:** "Apply for Permit", "Submit Flight Schedule", "View Invoices".
  - **Notifications:** Recent approvals or requests for information.

### 3.3. Module: Access Control

**Route:** `/permits`

- **Personnel Permits:**
  - Form to register staff: Name, ID Number, Designation, Photo Upload.
  - Request specific zones (Airside, Terminal, Landside).
- **Vehicle Permits:**
  - Register vehicles: Plate Number, Model, Color.

### 3.4. Module: Flight Operations (Airlines Only)

**Route:** `/flights`
**API Endpoint:** `POST /api/stakeholder-orgs/:orgId/flights`

- **Schedule Submission:**
  - Form to submit daily/weekly flight schedules.
  - Fields: Flight No, Aircraft Type, Origin/Dest, ETA/ETD.
- **Live Status:** View current status of submitted flights (assigned gates, delays).

### 3.5. Module: Finance & Billing

**Route:** `/finance`
**API Endpoint:** `GET /api/stakeholder-orgs/:orgId/invoices`

- **Invoices:**
  - List of all invoices generated by FAAN.
  - Status indicators (Unpaid, Paid, Overdue).
  - "Download Invoice" button (PDF generation).
- **Payment Integration:** (Future scope) "Pay Now" button via Remita/Interswitch.

### 3.6. Authentication (Portal Login)

**Route:** `/login`
**API Endpoint:** `POST /api/stakeholder-orgs/auth/login` ✅ **(Ready)**

- **Credentials:** Email & Password.
- **Backend Logic:** Authenticates against `stakeholder_users` (NOT `users` table).
- **Session:** Returns JWT Access Token + Refresh Token (Manage tokens in `StakeholderUserContext`).

---

## 4. Technical Implementation Details

### 4.1. Authentication & Routing

- **Login Separation:**
  - Internal Staff use `UserContext` and Standard Login.
  - Stakeholders use `StakeholderUserContext` and a dedicated Portal Login page.
- **Route Guards:**
  - `<PrivateRoute roles={['org_admin', 'super_admin']} />` for Admin Dashboard.
  - `<StakeholderRoute />` for Portal pages.

### 4.2. API Integration Pattern

Use the existing Service/Controller pattern. Create a frontend api client service:

```typescript
// services/stakeholderApi.ts

// Fetch Org Details
export const getOrgDetails = async (id: string) => {
  return axios.get(\`/api/stakeholder-orgs/\${id}\`);
};

// Application Submission
export const submitPermitApplication = async (orgId: string, data: PermitData) => {
  return axios.post(\`/api/stakeholder-orgs/\${orgId}/permits\`, data);
};
```

### 4.3. Form Handling (Dynamic Types)

The registration form must be polymorphic. Example state structure:

```typescript
const [orgType, setOrgType] = useState('airline');

// Render conditional fields
{orgType === 'airline' && (
  <AirlineFields register={register} errors={errors} />
)}
{orgType === 'contractor' && (
  <ContractorFields register={register} errors={errors} />
)}
```

## 5. Next Steps

1.  **Build the Registration Wizard:** This is the entry point for all data.
2.  **Build the Admin Verification Queue:** To process the registrations.
3.  **Build the Portal Dashboard:** To give feedback to the users.
