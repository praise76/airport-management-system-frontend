import { createFileRoute, redirect } from "@tanstack/react-router";
import { Award, CheckCircle, FileText, Plus } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	useCertificationTypes,
	useCreateCertificationType,
} from "@/hooks/certifications";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/certifications/")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: CertificationsPage,
});

function CertificationsPage() {
	const { data: types, isLoading: loadingTypes } = useCertificationTypes();
	const [createTypeDialog, setCreateTypeDialog] = useState(false);

	const [typeName, setTypeName] = useState("");
	const [typeValidity, setTypeValidity] = useState("");
	const typeNameId = useId();
	const typeValidityId = useId();

	const createTypeMutation = useCreateCertificationType();

	const handleCreateType = async () => {
		await createTypeMutation.mutateAsync({
			name: typeName,
			validityDays: Number.parseInt(typeValidity),
		});
		setCreateTypeDialog(false);
		setTypeName("");
		setTypeValidity("");
	};

	const typeCount = types?.length ?? 0;
	const totalValidity = useMemo(
		() => types?.reduce((sum, type) => sum + (type.validityDays ?? 0), 0) ?? 0,
		[types],
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold">Certifications</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Manage certification types available to your organization
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="border rounded-lg p-6 space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold">Certification Types</h2>
						<Button size="sm" onClick={() => setCreateTypeDialog(true)}>
							<Plus className="h-4 w-4" />
							Add Type
						</Button>
					</div>

					{loadingTypes && (
						<div className="text-center py-8 text-muted-foreground">
							Loading types...
						</div>
					)}

					{!loadingTypes && typeCount === 0 && (
						<div className="text-center py-8">
							<Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-muted-foreground">
								No certification types defined yet.
							</p>
						</div>
					)}

					{typeCount > 0 && (
						<div className="grid grid-cols-1 gap-3">
							{types?.map((type) => (
								<div
									key={type.id}
									className="p-4 border rounded-lg hover:bg-muted/30 transition-colors space-y-2"
								>
									<div className="flex items-center justify-between">
										<div className="font-medium">{type.name}</div>
										<Badge variant="outline">{type.validityDays} days</Badge>
									</div>
									<p className="text-sm text-muted-foreground">
										Validity: {type.validityDays} day
										{type.validityDays === 1 ? "" : "s"}
									</p>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="border rounded-lg p-6 space-y-4">
					<h2 className="font-semibold">Summary</h2>
					<div className="grid grid-cols-1 gap-3">
						<div className="p-4 border rounded-lg flex items-center gap-3">
							<CheckCircle className="h-5 w-5 text-emerald-500" />
							<div>
								<p className="text-sm font-medium">Total types</p>
								<p className="text-sm text-muted-foreground">{typeCount}</p>
							</div>
						</div>
						<div className="p-4 border rounded-lg flex items-center gap-3">
							<FileText className="h-5 w-5 text-indigo-500" />
							<div>
								<p className="text-sm font-medium">Average validity</p>
								<p className="text-sm text-muted-foreground">
									{typeCount > 0 ? Math.round(totalValidity / typeCount) : "--"}{" "}
									days
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Create Type Dialog */}
			<Dialog open={createTypeDialog} onOpenChange={setCreateTypeDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Certification Type</DialogTitle>
						<DialogDescription>
							Define a new certification type for your organization
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor={typeNameId}>Name</Label>
							<Input
								id={typeNameId}
								value={typeName}
								onChange={(e) => setTypeName(e.target.value)}
								placeholder="e.g., Safety Training"
							/>
						</div>
						<div>
							<Label htmlFor={typeValidityId}>Validity (days)</Label>
							<Input
								id={typeValidityId}
								type="number"
								value={typeValidity}
								onChange={(e) => setTypeValidity(e.target.value)}
								placeholder="e.g., 365"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCreateTypeDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateType}
							disabled={
								!typeName || !typeValidity || createTypeMutation.isPending
							}
						>
							{createTypeMutation.isPending ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
