export type ActingStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'active' | 'completed' | 'cancelled' | 'revoked' | 'expired' | 'terminated';

export interface EffectivePermissions {
  role: string;
  permissions: string[];
  isActing: boolean;
  actingAssignmentId?: string;
}

export interface ActingAssignment {
  id: string;
  organizationId: string;
  originalUserId: string;
  originalRole: string;
  originalJobTitle?: string;
  actingUserId: string;
  actingRole: string;
  actingJobTitle?: string;
  departmentId: string;
  unitId?: string;
  startDate: string;
  endDate: string;
  status: ActingStatus;
  delegatedPermissions: string[];
  reasonCategory?: string;
  reasonDetails?: string;
  handoverStatus: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface CreateActingAssignmentRequest {
  actingUserId: string;
  hodId: string;
  startDate: string;
  endDate: string;
  delegatedPermissions: string[];
}

export interface HandoverItem {
  id: string;
  actingAssignmentId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

export interface AuditAction {
  id: string;
  actingAssignmentId: string;
  actionType: string;
  actionSummary: string;
  performedAt: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}
