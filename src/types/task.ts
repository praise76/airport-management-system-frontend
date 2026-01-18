// Task Types based on OpenAPI spec

export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TaskStatus = "open" | "in_progress" | "blocked" | "done";

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string | null;
  terminalCode?: string;
  departmentId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueAt?: string;
  terminalCode?: string;
  departmentId?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueAt?: string;
}

export interface TaskAssignInput {
  userId: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  createdAt: string;
}

export interface TaskCommentInput {
  content: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TaskListParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

export interface TaskListResponse {
  data: Task[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
