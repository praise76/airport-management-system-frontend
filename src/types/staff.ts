export interface Role {
  value: string;
  label: string;
  description: string;
}

export interface StaffMember {
  id: string;
  organizationId: string;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  /** Grade level 1-15; sets annual leave (1-7: 21 days, 8-15: 30 days). */
  gradeLevel?: number | null;
  photoUrl?: string;
  role: string;
  reportsToUserId?: string;
  isActive: boolean;
  canAssignDocuments: boolean;
  canRegisterDocuments: boolean;
  canManageStakeholders: boolean;
  assignedTerminals?: string;
  airportCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffInput {
  organizationId: string;
  departmentId?: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  gradeLevel?: number;
  password: string;
  role: string;
  reportsToUserId?: string;
  canAssignDocuments?: boolean;
  canRegisterDocuments?: boolean;
  canManageStakeholders?: boolean;
  assignedTerminals?: string;
  airportCode?: string;
}

export interface UpdateStaffInput {
  departmentId?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  gradeLevel?: number | null;
  role?: string;
  reportsToUserId?: string;
  isActive?: boolean;
  canAssignDocuments?: boolean;
  canRegisterDocuments?: boolean;
  canManageStakeholders?: boolean;
  assignedTerminals?: string;
  airportCode?: string;
}

export interface StaffImportPreviewRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  role: string;
  departmentCode?: string;
  departmentName?: string;
  terminalCodes: string[];
  password: "Provided" | "Will be generated";
  errors: string[];
}

export interface StaffImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  canImport: boolean;
  rows: StaffImportPreviewRow[];
}

export interface StaffImportResult {
  imported: number;
  credentials: Array<{
    email: string;
    initialPassword: string;
  }>;
}
