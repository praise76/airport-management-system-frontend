// Position Types based on OpenAPI spec

export interface Position {
  id: string;
  organizationId: string;
  departmentId?: string;
  title: string;
  description?: string;
  level: number;
  reportsToId?: string;
  createdAt: string;
}

export interface PositionInput {
  organizationId: string;
  departmentId?: string;
  title: string;
  description?: string;
  level?: number;
  reportsToId?: string;
}

export interface PositionUpdate {
  title?: string;
  description?: string;
  level?: number;
  reportsToId?: string;
  departmentId?: string;
}

export interface PositionHierarchy {
  id: string;
  title: string;
  level: number;
  children: PositionHierarchy[];
}

export interface PositionAssignment {
  id: string;
  positionId: string;
  userId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface PositionAssignInput {
  userId: string;
  startDate?: string;
}
