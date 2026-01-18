import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as SelfServiceApi from "@/api/self-service";
import { toast } from "sonner";

export function useMyProfile() {
  return useQuery({
    queryKey: ["self-service", "profile"],
    queryFn: () => SelfServiceApi.getMyProfile(),
  });
}

export function useMyLeaveBalance() {
  return useQuery({
    queryKey: ["self-service", "leave-balance"],
    queryFn: () => SelfServiceApi.getMyLeaveBalance(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof SelfServiceApi.requestProfileUpdate>[0]) => SelfServiceApi.requestProfileUpdate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["self-service", "profile", "requests"] });
      toast.success("Update request sent");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to request update");
    },
  });
}

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof SelfServiceApi.applyForLeave>[0]) => SelfServiceApi.applyForLeave(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["self-service", "leave-balance"] });
      toast.success("Leave application submitted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to apply for leave");
    },
  });
}

export function useRequestDocument() {
  return useMutation({
    mutationFn: (input: Parameters<typeof SelfServiceApi.requestDocument>[0]) => SelfServiceApi.requestDocument(input),
    onSuccess: () => {
      toast.success("Document request submitted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to request document");
    },
  });
}

export function useMyRoster() {
  return useQuery({
    queryKey: ["self-service", "roster"],
    queryFn: () => SelfServiceApi.getMyRoster(),
  });
}
