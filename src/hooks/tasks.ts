import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as TasksApi from "@/api/tasks";
import type { TaskInput, TaskUpdate, TaskAssignInput, TaskCommentInput, TaskListParams } from "@/types/task";
import { toast } from "sonner";

export function useTasks(params?: TaskListParams) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => TasksApi.getTasks(params),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => TasksApi.getTask(id),
    enabled: !!id,
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: ["tasks", "my"],
    queryFn: () => TasksApi.getMyTasks(),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => TasksApi.createTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create task"),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskUpdate }) => TasksApi.updateTask(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update task"),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TasksApi.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete task"),
  });
}

export function useAssignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: TaskAssignInput }) => TasksApi.assignTask(taskId, input),
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["tasks", taskId, "assignments"] });
      toast.success("User assigned to task");
    },
    onError: (err: any) => toast.error(err.message || "Failed to assign task"),
  });
}

export function useTaskAssignments(taskId: string) {
  return useQuery({
    queryKey: ["tasks", taskId, "assignments"],
    queryFn: () => TasksApi.getTaskAssignments(taskId),
    enabled: !!taskId,
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ["tasks", taskId, "comments"],
    queryFn: () => TasksApi.getTaskComments(taskId),
    enabled: !!taskId,
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: TaskCommentInput }) => TasksApi.addTaskComment(taskId, input),
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["tasks", taskId, "comments"] });
      toast.success("Comment added");
    },
    onError: (err: any) => toast.error(err.message || "Failed to add comment"),
  });
}
