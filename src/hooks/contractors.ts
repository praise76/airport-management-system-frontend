import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ContractorsApi from "@/api/contractors";
import { toast } from "sonner";

export function useContractorOrganizations(params?: { status?: string }) {
  return useQuery({
    queryKey: ["contractors", "organizations", params],
    queryFn: () => ContractorsApi.listContractorOrganizations(params),
  });
}

export function useRegisterContractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof ContractorsApi.registerContractorOrganization>[0]) => ContractorsApi.registerContractorOrganization(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contractors", "organizations"] });
      toast.success("Organization registered successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to register organization");
    },
  });
}

export function useVerifyContractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ContractorsApi.verifyContractorOrganization(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contractors", "organizations"] });
      toast.success("Organization verified");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to verify organization");
    },
  });
}

export function useRegisterPersonnel() {
  return useMutation({
    mutationFn: (input: Parameters<typeof ContractorsApi.registerContractorPersonnel>[0]) => ContractorsApi.registerContractorPersonnel(input),
    onSuccess: () => {
      toast.success("Personnel registered successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to register personnel");
    },
  });
}

export function useApplyPass() {
  return useMutation({
    mutationFn: (input: Parameters<typeof ContractorsApi.applyForPass>[0]) => ContractorsApi.applyForPass(input),
    onSuccess: () => {
      toast.success("Pass application submitted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to apply for pass");
    },
  });
}

export function useReviewPass(id: string, level: string) {
  return useMutation({
    mutationFn: (input: { decision: string; comments: string }) => ContractorsApi.reviewPassApplication(id, level, input),
    onSuccess: () => {
      toast.success("Review submitted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit review");
    },
  });
}
