# Master Frontend Implementation Plan

> **Date**: 2026-01-21
> **Status**: Ready for Development
> **Backend**: Fully Implemented & API Ready

This document serves as the central hub for the frontend implementation of the **Airport Management System** major enhancements. It links to the detailed technical guides for each module.

---

## 🏗️ Execution Roadmap (Recommended Order)

We recommend building the modules in this specific order to manage dependencies effectively:

### Phase 1: Core Structure (Departments)

_Why?_: Almost every other module (Roster, Access Permits, Users) depends on the Department Hierarchy.

1.  **Department Tree UI**: Visualize the 3-level structure.
2.  **Breadcrumb Selectors**: "Select Department > Unit > Station" component.

### Phase 2: Stakeholder Portal (External)

_Why?_: This is a standalone app (different login) that populates the system with external data.

1.  **Registration Wizard**: Allow Airlines/Vendors to sign up.
2.  **Portal Login**: Dedicated login screen for stakeholders.
3.  **Dashboard**: Basic landing page for them.

### Phase 3: Admin Stakeholder Management

_Why?_: Now that Stakeholders can sign up (Phase 2), Admins need to verify them.

1.  **Verification Queue**: Approve/Reject the pending registrations.
2.  **Permit Management**: Process the permits they submitted.

### Phase 4: Roster & Attendance

_Why?_: This sits on top of the Department structure (Phase 1).

1.  **Roster Planner**: The complex admin grid.
2.  **Employee "My Schedule"**: Simple view for staff.

---

## 📚 Detailed Implementation Guides

We have prepared deep-dive technical documents for each module. These contain **API endpoints**, **TypeScript interfaces**, **Mockups**, and **Logic flows**.

### 1. Hierarchy & Departments

**Guide**: [`docs/FRONTEND_HIERARCHY_CHANGES.md`](./FRONTEND_HIERARCHY_CHANGES.md)

- **Key Task**: Building the `DepartmentTree` and `DepartmentSelector` components.
- **API**: `/api/departments/tree`

### 2. Stakeholder Management

**Guide**: [`docs/FRONTEND_STAKEHOLDER_IMP_GUIDE.md`](./FRONTEND_STAKEHOLDER_IMP_GUIDE.md)

- **Key Task**: Building the separate **External Portal** and the **Internal Verification Dashboard**.
- **API**: `/api/stakeholder-orgs`

### 3. Roster & Attendance Sync

**Guide**: [`docs/FRONTEND_ROSTER_CHANGES.md`](./FRONTEND_ROSTER_CHANGES.md)

- **Key Task**: Implementing the **Planner Grid** (Admin) and **Auto-Sync Display** (Attendance).
- **API**: `/api/roster`

---

## 🛠️ Global Shared Components Needed

Before diving into modules, consider building these shared UI elements first:

1.  **`DepartmentSelector.tsx`**: A dropdown that handles the 3-level hierarchy logic.
2.  **`StatusBadge.tsx`**: Unified styling for statuses (Pending, Verified, Rejected, Active, Suspended).
3.  **`DocumentViewer.tsx`**: A modal side-by-side view for reviewing PDF/Image uploads.
4.  **`UserPicker.tsx`**: Async select component to find users by name/department.

---

## 🚀 Getting Started

1.  **Review the API**: All backend routes are live. Use Postman or Swagger (`/api-docs`) to test endpoints.
2.  **Types**: Generate frontend types from the backend schemas (or copy from the guides).
3.  **Start Phase 1**: Build the Department Tree.
