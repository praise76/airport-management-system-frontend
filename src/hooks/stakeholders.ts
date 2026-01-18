import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as StakeholdersApi from "@/api/stakeholders";
import type { AirlineInput, VendorInput, VendorRatingInput, RegulatorySubmissionInput } from "@/types/stakeholder";
import { toast } from "sonner";

// Airlines
export function useAirlines() {
  return useQuery({
    queryKey: ["stakeholders", "airlines"],
    queryFn: () => StakeholdersApi.getAirlines(),
  });
}

export function useAirline(id: string) {
  return useQuery({
    queryKey: ["stakeholders", "airlines", id],
    queryFn: () => StakeholdersApi.getAirline(id),
    enabled: !!id,
  });
}

export function useCreateAirline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AirlineInput) => StakeholdersApi.createAirline(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stakeholders", "airlines"] });
      toast.success("Airline created");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create airline"),
  });
}

// Vendors
export function useVendors() {
  return useQuery({
    queryKey: ["stakeholders", "vendors"],
    queryFn: () => StakeholdersApi.getVendors(),
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ["stakeholders", "vendors", id],
    queryFn: () => StakeholdersApi.getVendor(id),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VendorInput) => StakeholdersApi.createVendor(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stakeholders", "vendors"] });
      toast.success("Vendor created");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create vendor"),
  });
}

export function useVendorRatings(vendorId: string) {
  return useQuery({
    queryKey: ["stakeholders", "vendors", vendorId, "ratings"],
    queryFn: () => StakeholdersApi.getVendorRatings(vendorId),
    enabled: !!vendorId,
  });
}

export function useCreateVendorRating() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VendorRatingInput) => StakeholdersApi.createVendorRating(input),
    onSuccess: (_, { vendorId }) => {
      qc.invalidateQueries({ queryKey: ["stakeholders", "vendors", vendorId, "ratings"] });
      qc.invalidateQueries({ queryKey: ["stakeholders", "vendors"] });
      toast.success("Rating submitted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to submit rating"),
  });
}

// Regulatory
export function useRegulatorySubmissions() {
  return useQuery({
    queryKey: ["stakeholders", "regulatory"],
    queryFn: () => StakeholdersApi.getRegulatorySubmissions(),
  });
}

export function useCreateRegulatorySubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegulatorySubmissionInput) => StakeholdersApi.createRegulatorySubmission(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stakeholders", "regulatory"] });
      toast.success("Submission created");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create submission"),
  });
}
