import { createFileRoute, redirect } from "@tanstack/react-router";
import { useOrganizationsQuery } from "@/hooks/organizations";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/organizations/")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: OrganizationsPage,
});

function OrganizationsPage() {
	const { data, isLoading, isError, refetch, error } = useOrganizationsQuery();
	console.log("organizations", data);

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Organizations</h1>
			{isLoading && (
				<p className="text-sm text-[color-mix(in_oklab,var(--color-text)_70%,transparent)]">
					Loading organizations…
				</p>
			)}
			{isError && (
				<div className="text-sm text-red-500">
					Failed to load.{" "}
					<button type="button" className="underline" onClick={() => refetch()}>
						Retry
					</button>
					{(() => {
						const message =
							error instanceof Error
								? error.message
								: typeof error === "object" && error && "message" in error
									? String((error as { message?: unknown }).message ?? "")
									: "";
						return message ? (
							<span className="ml-2 opacity-70">{message}</span>
						) : null;
					})()}
				</div>
			)}
			{!!data && (
				<div className="overflow-x-auto">
					<table className="w-full border border-(--color-border) rounded-md">
						<thead className="bg-[color-mix(in_oklab,var(--color-text)_5%,transparent)] sticky top-0">
							<tr className="text-left">
								<th className="px-3 py-2 border-b border-(--color-border)">
									Name
								</th>
								<th className="px-3 py-2 border-b border-(--color-border)">
									Industry
								</th>
								<th className="px-3 py-2 border-b border-(--color-border)">
									Updated
								</th>
							</tr>
						</thead>
						<tbody>
							{data?.data?.map((org) => (
								<tr
									key={org.id}
									className="hover:bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)]"
								>
									<td className="px-3 py-2">{org.name}</td>
									<td className="px-3 py-2">{org.industry}</td>
									<td className="px-3 py-2">
										{org.updatedAt
											? new Date(org.updatedAt).toLocaleString()
											: "-"}
									</td>
								</tr>
							))}
							{(data.data?.length ?? 0) === 0 && (
								<tr>
									<td
										className="px-3 py-6 text-center text-sm text-[color-mix(in_oklab,var(--color-text)_70%,transparent)]"
										colSpan={3}
									>
										No organizations found
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
