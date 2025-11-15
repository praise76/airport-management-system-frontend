import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	Building2,
	ChevronDown,
	ChevronRight,
	Plus,
	UserCircle,
	UserCog,
	Users,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import {
	useAssignHOD,
	useCreateDepartment,
	useDepartmentTree,
} from "@/hooks/departments";
import { useUiStore } from "@/stores/ui";
import type { DepartmentTreeNode } from "@/types/department";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/departments/")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: DepartmentsPage,
});

function DepartmentsPage() {
	const { data: tree, isLoading, error } = useDepartmentTree();
	const selectedOrganizationId = useUiStore(
		(state) => state.selectedOrganizationId,
	);

	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
	const [selectedDept, setSelectedDept] = useState<DepartmentTreeNode | null>(
		null,
	);
	const [assignHODDialog, setAssignHODDialog] = useState(false);
	const [userId, setUserId] = useState("");
	const assignInputId = useId();

	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [deptName, setDeptName] = useState("");
	const [deptCode, setDeptCode] = useState("");
	const [parentDepartmentId, setParentDepartmentId] = useState<string>("");
	const [isRegistry, setIsRegistry] = useState(false);
	const deptNameInputId = useId();
	const deptCodeInputId = useId();
	const deptParentInputId = useId();
	const deptRegistryInputId = useId();

	const assignMutation = useAssignHOD();
	const createMutation = useCreateDepartment();

	const resetCreateForm = () => {
		setDeptName("");
		setDeptCode("");
		setParentDepartmentId("");
		setIsRegistry(false);
	};

	const parentOptions = useMemo(() => {
		if (!tree) return [];
		const result: Array<{ id: string; label: string }> = [];
		const walk = (nodes: DepartmentTreeNode[], depth: number) => {
			for (const node of nodes) {
				result.push({
					id: node.id,
					label: `${"— ".repeat(depth)}${node.name}`,
				});
				if (node.children && node.children.length > 0) {
					walk(node.children, depth + 1);
				}
			}
		};
		walk(tree, 0);
		return result;
	}, [tree]);

	const toggleNode = (id: string) => {
		setExpandedNodes((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleAssignHOD = async () => {
		if (!selectedDept) return;
		await assignMutation.mutateAsync({
			id: selectedDept.id,
			input: { userId },
		});
		setAssignHODDialog(false);
		setUserId("");
		setSelectedDept(null);
	};

	const handleCreateDepartment = async () => {
		if (!selectedOrganizationId) {
			toast.error("Select an organization before creating a department.");
			return;
		}
		await createMutation.mutateAsync({
			name: deptName,
			code: deptCode,
			organizationId: selectedOrganizationId,
			parentDepartmentId: parentDepartmentId || undefined,
			isRegistry,
		});
		setCreateDialogOpen(false);
		resetCreateForm();
	};

	const renderTree = (nodes: DepartmentTreeNode[], level = 0) => {
		return nodes.map((node) => {
			const isExpanded = expandedNodes.has(node.id);
			const hasChildren = node.children && node.children.length > 0;

			return (
				<div key={node.id}>
					<div
						className="flex items-center gap-2 p-3 hover:bg-muted/30 rounded-lg transition-colors group"
						style={{ paddingLeft: `${level * 24 + 12}px` }}
					>
						{/* Expand/Collapse */}
						{hasChildren ? (
							<button
								type="button"
								onClick={() => toggleNode(node.id)}
								className="p-1 hover:bg-muted rounded"
							>
								{isExpanded ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronRight className="h-4 w-4" />
								)}
							</button>
						) : (
							<div className="w-6" />
						)}

						{/* Icon */}
						<Building2 className="h-5 w-5 text-muted-foreground" />

						{/* Info */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<span className="font-medium">{node.name}</span>
								<Badge variant="secondary" className="text-xs font-mono">
									{node.code}
								</Badge>
								{node.employeeCount !== undefined && (
									<span className="text-xs text-muted-foreground flex items-center gap-1">
										<Users className="h-3 w-3" />
										{node.employeeCount}
									</span>
								)}
							</div>
							{node.hod && (
								<div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
									<UserCircle className="h-3 w-3" />
									HOD: {node.hod.name}
								</div>
							)}
						</div>

						{/* Actions */}
						<div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => {
									setSelectedDept(node);
									setAssignHODDialog(true);
								}}
							>
								<UserCog className="h-4 w-4" />
								{node.hod ? "Change HOD" : "Assign HOD"}
							</Button>
						</div>
					</div>

					{/* Children */}
					{hasChildren && isExpanded && (
						<div>{renderTree(node.children ?? [], level + 1)}</div>
					)}
				</div>
			);
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Departments</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Organizational hierarchy and department management
					</p>
				</div>
				<Button
					type="button"
					onClick={() => setCreateDialogOpen(true)}
					disabled={!selectedOrganizationId}
				>
					<Plus className="h-4 w-4" />
					Add Department
				</Button>
			</div>

			{/* Content */}
			{isLoading && (
				<div className="text-center py-12 text-muted-foreground">
					Loading departments...
				</div>
			)}

			{error && (
				<div className="text-center py-12 text-destructive">
					Failed to load departments
				</div>
			)}

			{tree && tree.length === 0 && (
				<div className="text-center py-12">
					<Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">No departments found</h3>
					<p className="text-sm text-muted-foreground mb-4">
						Get started by creating your first department
					</p>
					<Button
						type="button"
						onClick={() => setCreateDialogOpen(true)}
						disabled={!selectedOrganizationId}
					>
						<Plus className="h-4 w-4" />
						Add Department
					</Button>
				</div>
			)}

			{tree && tree.length > 0 && (
				<div className="border rounded-lg p-4">
					<div className="flex items-center justify-between mb-4">
						<h2 className="font-semibold">Organization Structure</h2>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								if (expandedNodes.size > 0) {
									setExpandedNodes(new Set());
								} else {
									const allIds = new Set<string>();
									const collectIds = (nodes: DepartmentTreeNode[]) => {
										nodes.forEach((node) => {
											if (node.children && node.children.length > 0) {
												allIds.add(node.id);
												collectIds(node.children);
											}
										});
									};
									collectIds(tree);
									setExpandedNodes(allIds);
								}
							}}
						>
							{expandedNodes.size > 0 ? "Collapse All" : "Expand All"}
						</Button>
					</div>
					<div className="space-y-1">{renderTree(tree)}</div>
				</div>
			)}

			{/* Create Department Dialog */}
			<Dialog
				open={createDialogOpen}
				onOpenChange={(open) => {
					setCreateDialogOpen(open);
					if (!open) {
						resetCreateForm();
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Department</DialogTitle>
						<DialogDescription>
							Fill in the details below to add a new department to the selected
							organization.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{!selectedOrganizationId && (
							<p className="text-sm text-destructive">
								Select an organization from the header to create a department.
							</p>
						)}
						<div className="space-y-2">
							<Label htmlFor={deptNameInputId}>Name</Label>
							<Input
								id={deptNameInputId}
								value={deptName}
								onChange={(event) => setDeptName(event.target.value)}
								placeholder="e.g. Operations Control"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={deptCodeInputId}>Code</Label>
							<Input
								id={deptCodeInputId}
								value={deptCode}
								onChange={(event) => setDeptCode(event.target.value)}
								placeholder="e.g. OPS-CTRL"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={deptParentInputId}>Parent department</Label>
							<select
								id={deptParentInputId}
								className="w-full h-9 rounded-md border bg-background px-3 text-sm"
								value={parentDepartmentId}
								onChange={(event) => setParentDepartmentId(event.target.value)}
							>
								<option value="">None</option>
								{parentOptions.map((option) => (
									<option key={option.id} value={option.id}>
										{option.label}
									</option>
								))}
							</select>
						</div>
						<div className="flex items-center justify-between rounded-md border px-3 py-2">
							<div>
								<Label
									htmlFor={deptRegistryInputId}
									className="text-sm font-medium"
								>
									Mark as registry
								</Label>
								<p className="text-xs text-muted-foreground">
									Registry departments manage official document intake.
								</p>
							</div>
							<Switch
								id={deptRegistryInputId}
								checked={isRegistry}
								onCheckedChange={(checked) => setIsRegistry(checked)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setCreateDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleCreateDepartment}
							disabled={
								!selectedOrganizationId ||
								!deptName.trim() ||
								!deptCode.trim() ||
								createMutation.isPending
							}
						>
							{createMutation.isPending ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Assign HOD Dialog */}
			<Dialog open={assignHODDialog} onOpenChange={setAssignHODDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Assign Head of Department</DialogTitle>
						<DialogDescription>
							Assign a user as HOD for {selectedDept?.name}
						</DialogDescription>
					</DialogHeader>
					<div>
						<label className="text-sm font-medium" htmlFor={assignInputId}>
							User ID
						</label>
						<Input
							id={assignInputId}
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							placeholder="Enter user ID"
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setAssignHODDialog(false);
								setUserId("");
								setSelectedDept(null);
							}}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleAssignHOD}
							disabled={!userId || assignMutation.isPending}
						>
							{assignMutation.isPending ? "Assigning..." : "Assign"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
