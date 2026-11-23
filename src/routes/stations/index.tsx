import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getMyRoster } from "@/api/self-service";
import { StationCheckIn } from "@/features/stations/components/StationCheckIn";
import { useAllDepartments } from "@/hooks/departments";
import { getRoles } from "@/lib/access";
import { stationsFor } from "@/lib/stationAccess";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/stations/")({
	component: Page,
});

const today = () => {
	// The airport works on Lagos time (UTC+1).
	return new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
};

function Page() {
	const user = useAuthStore((s) => s.user);
	const { data: departments, isLoading } = useAllDepartments();
	const { data: shifts } = useQuery({
		queryKey: ["self-service", "roster", "today"],
		queryFn: () => getMyRoster({ startDate: today(), endDate: today() }),
	});
	const me = user as {
		id?: string;
		userId?: string;
		departmentId?: string;
	} | null;
	const scope = stationsFor(
		{
			id: me?.userId ?? me?.id,
			departmentId: me?.departmentId,
			roles: getRoles(user),
		},
		departments,
		(shifts ?? []).map((s) => s.dutyLocation),
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Stations</h1>
				<p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
					{scope.all
						? "Every station at the airport."
						: "Check in at your own unit's stations. A post in another unit appears here only when your roster sends you to cover it today."}
				</p>
			</div>

			{isLoading ? (
				<div className="text-center py-10 opacity-50">Loading stations...</div>
			) : (
				<>
					{scope.covering.length > 0 && (
						<section className="space-y-3">
							<h2 className="text-lg font-semibold">Covering today</h2>
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{scope.covering.map((s) => (
									<StationCheckIn
										key={s.id}
										stationId={s.id}
										stationName={s.name}
									/>
								))}
							</div>
						</section>
					)}
					<section className="space-y-3">
						{scope.covering.length > 0 && (
							<h2 className="text-lg font-semibold">Your stations</h2>
						)}
						{scope.mine.length === 0 ? (
							<div className="text-center py-10 opacity-50 border-2 border-dashed rounded-xl">
								Your unit has no stations to check in at.
							</div>
						) : (
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{scope.mine.map((s) => (
									<StationCheckIn
										key={s.id}
										stationId={s.id}
										stationName={s.name}
									/>
								))}
							</div>
						)}
					</section>
				</>
			)}
		</div>
	);
}
