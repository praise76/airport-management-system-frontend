import { api } from "./client";
import type {
  Task,
  TaskInput,
  TaskUpdate,
  TaskAssignInput,
  TaskAssignment,
  TaskComment,
  TaskCommentInput,
  TaskListParams,
  TaskListResponse,
} from "@/types/task";

// List tasks with optional filters
export async function getTasks(params?: TaskListParams): Promise<TaskListResponse> {
  const res = await api.get("/tasks", { params });
  return res.data.data;
}

// Get single task by ID
export async function getTask(id: string): Promise<Task> {
  const res = await api.get(`/tasks/${id}`);
  return res.data.data;
}

// Create a new task
export async function createTask(input: TaskInput): Promise<Task> {
  const res = await api.post("/tasks", input);
  return res.data.data;
}

// Update a task
export async function updateTask(id: string, input: TaskUpdate): Promise<Task> {
  const res = await api.patch(`/tasks/${id}`, input);
  return res.data.data;
}

// Delete a task
export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

// Assign user to task
export async function assignTask(taskId: string, input: TaskAssignInput): Promise<TaskAssignment> {
  const res = await api.post(`/tasks/${taskId}/assign`, input);
  return res.data.data;
}

// Get task assignments
export async function getTaskAssignments(taskId: string): Promise<TaskAssignment[]> {
  const res = await api.get(`/tasks/${taskId}/assignments`);
  return res.data.data;
}

// Get task comments
export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const res = await api.get(`/tasks/${taskId}/comments`);
  return res.data.data;
}

// Add comment to task
export async function addTaskComment(taskId: string, input: TaskCommentInput): Promise<TaskComment> {
  const res = await api.post(`/tasks/${taskId}/comments`, input);
  return res.data.data;
}

// Get my assigned tasks
export async function getMyTasks(): Promise<Task[]> {
  const res = await api.get("/tasks/my");
  return res.data.data;
}
