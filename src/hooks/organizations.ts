import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as OrgsApi from "@/api/organizations";

export function useOrganizationsQuery(
	params?: OrgsApi.ListOrganizationsParams,
) {
	return useQuery({
		queryKey: ["organizations", params],
		queryFn: () => OrgsApi.listOrganizations(params ?? {}),
	});
}

export function useCreateOrganizationMutation() {
	const qc = useQueryClient();
	return useMutation({
		mutationKey: ["organizations", "create"],
		mutationFn: (input: OrgsApi.CreateOrganizationRequest) =>
			OrgsApi.createOrganization(input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["organizations"] });
		},
	});
}

export function useUpdateOrganizationMutation(id: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationKey: ["organizations", id, "update"],
		mutationFn: (input: OrgsApi.UpdateOrganizationRequest) =>
			OrgsApi.updateOrganization(id, input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["organizations"] });
			qc.invalidateQueries({ queryKey: ["organization", { id }] });
		},
	});
}
