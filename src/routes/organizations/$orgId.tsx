import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	redirect,
	useParams,
	useRouter,
} from "@tanstack/react-router";
import { getOrganization } from "@/api/organizations";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/organizations/$orgId")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: OrganizationDetailPage,
});

function OrganizationDetailPage() {
	const { orgId } = useParams({ from: "/organizations/$orgId" });
	const router = useRouter();
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["organization", { id: orgId }],
		queryFn: () => getOrganization(orgId),
	});

	if (isLoading) return <div>Loading…</div>;
	if (isError) {
		const message =
			error instanceof Error
				? error.message
				: typeof error === "object" && error && "message" in error
					? String((error as { message?: unknown }).message ?? "")
					: "";
		return (
			<div className="text-red-500">Error: {message || "Failed to load"}</div>
		);
	}
	if (!data) return <div>Not found</div>;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">{data.name}</h1>
				<Button
					variant="outline"
					onClick={() =>
						router.navigate({
							to: "/organizations/$orgId/edit",
							params: { orgId },
						})
					}
				>
					Edit
				</Button>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="rounded-lg border border-(--color-border) p-4">
					<div className="text-sm opacity-70">Industry</div>
					<div className="font-medium">{data.industry}</div>
				</div>
				<div className="rounded-lg border border-(--color-border) p-4">
					<div className="text-sm opacity-70">Updated</div>
					<div className="font-medium">
						{data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "-"}
					</div>
				</div>
			</div>
		</div>
	);
}
