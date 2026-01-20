import { useCallback, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDepartmentTree } from "@/hooks/departments";
import type { DepartmentLevel, DepartmentTreeNode } from "@/types/department";
import { DepartmentLevelIndicator } from "./DepartmentBadge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface DepartmentSelectorProps {
	value?: string | null;
	onChange: (departmentId: string | null) => void;
	organizationId?: string;
	/**
	 * Filter to only show departments of a specific level
	 * If not provided, all levels are shown
	 */
	filterLevel?: DepartmentLevel;
	/**
	 * Maximum level to allow selection
	 * Useful when you only want to select up to Units (level 2)
	 */
	maxLevel?: DepartmentLevel;
	/**
	 * Show the full hierarchy path when a department is selected
	 */
	showPath?: boolean;
	/**
	 * Allow clearing the selection
	 */
	clearable?: boolean;
	/**
	 * Placeholder text when nothing is selected
	 */
	placeholder?: string;
	/**
	 * Disable the selector
	 */
	disabled?: boolean;
	/**
	 * Additional CSS classes
	 */
	className?: string;
	/**
	 * Error state
	 */
	error?: boolean;
}

export function DepartmentSelector({
	value,
	onChange,
	organizationId,
	filterLevel,
	maxLevel,
	showPath = true,
	clearable = true,
	placeholder = "Select department...",
	disabled = false,
	className,
	error = false,
}: DepartmentSelectorProps) {
	const { data: tree, isLoading } = useDepartmentTree(organizationId);
	const [isOpen, setIsOpen] = useState(false);
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

	// Filter and flatten tree for dropdown
	const flattenedOptions = useMemo(() => {
		if (!tree) return [];

		const result: Array<{
			id: string;
			name: string;
			code: string;
			level: DepartmentLevel;
			depth: number;
			hasChildren: boolean;
			path: string[];
		}> = [];

		const walk = (nodes: DepartmentTreeNode[], depth: number, path: string[]) => {
			for (const node of nodes) {
				const nodePath = [...path, node.name];
				const shouldInclude =
					(!filterLevel || node.departmentLevel === filterLevel) &&
					(!maxLevel || node.departmentLevel <= maxLevel);

				if (shouldInclude) {
					result.push({
						id: node.id,
						name: node.name,
						code: node.code,
						level: node.departmentLevel,
						depth,
						hasChildren: (node.children?.length ?? 0) > 0,
						path: nodePath,
					});
				}

				if (node.children && node.children.length > 0) {
					walk(node.children, depth + 1, nodePath);
				}
			}
		};

		walk(tree, 0, []);
		return result;
	}, [tree, filterLevel, maxLevel]);

	// Get selected department info
	const selectedDepartment = useMemo(() => {
		if (!value || !flattenedOptions.length) return null;
		return flattenedOptions.find((opt) => opt.id === value) || null;
	}, [value, flattenedOptions]);

	const toggleNode = useCallback((nodeId: string) => {
		setExpandedNodes((prev) => {
			const next = new Set(prev);
			if (next.has(nodeId)) {
				next.delete(nodeId);
			} else {
				next.add(nodeId);
			}
			return next;
		});
	}, []);

	const handleSelect = useCallback(
		(departmentId: string) => {
			onChange(departmentId);
			setIsOpen(false);
		},
		[onChange],
	);

	const handleClear = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onChange(null);
		},
		[onChange],
	);

	// For simple use cases, use the Select component
	if (!tree || flattenedOptions.length < 20) {
		return (
			<div className={cn("relative", className)}>
				<Select
					value={value || ""}
					onValueChange={(val) => onChange(val || null)}
					disabled={disabled || isLoading}
				>
					<SelectTrigger
						className={cn(
							"w-full",
							error && "border-destructive",
							!value && "text-muted-foreground",
						)}
					>
						<SelectValue placeholder={isLoading ? "Loading..." : placeholder}>
							{selectedDepartment && (
								<div className="flex items-center gap-2">
									<DepartmentLevelIndicator
										level={selectedDepartment.level}
										className="shrink-0"
									/>
									<span className="truncate">
										{showPath
											? selectedDepartment.path.join(" › ")
											: selectedDepartment.name}
									</span>
								</div>
							)}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{clearable && value && (
							<SelectItem value="">
								<span className="text-muted-foreground">Clear selection</span>
							</SelectItem>
						)}
						{flattenedOptions.map((option) => (
							<SelectItem key={option.id} value={option.id}>
								<div
									className="flex items-center gap-2"
									style={{ paddingLeft: `${option.depth * 12}px` }}
								>
									<DepartmentLevelIndicator
										level={option.level}
										className="shrink-0"
									/>
									<span>{option.name}</span>
									<span className="text-xs text-muted-foreground font-mono">
										{option.code}
									</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		);
	}

	// For larger trees, use a custom tree dropdown
	return (
		<div className={cn("relative", className)}>
			<Button
				type="button"
				variant="outline"
				role="combobox"
				aria-expanded={isOpen}
				disabled={disabled || isLoading}
				className={cn(
					"w-full justify-between font-normal",
					error && "border-destructive",
					!value && "text-muted-foreground",
				)}
				onClick={() => setIsOpen(!isOpen)}
			>
				<div className="flex items-center gap-2 min-w-0 flex-1">
					{selectedDepartment ? (
						<>
							<DepartmentLevelIndicator
								level={selectedDepartment.level}
								className="shrink-0"
							/>
							<span className="truncate">
								{showPath
									? selectedDepartment.path.join(" › ")
									: selectedDepartment.name}
							</span>
						</>
					) : (
						<span>{isLoading ? "Loading..." : placeholder}</span>
					)}
				</div>
				<div className="flex items-center gap-1 shrink-0">
					{clearable && value && (
						<button
							type="button"
							onClick={handleClear}
							className="p-0.5 hover:bg-muted rounded"
						>
							<X className="h-4 w-4" />
						</button>
					)}
					<ChevronDown className="h-4 w-4 opacity-50" />
				</div>
			</Button>

			{isOpen && (
				<div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
					<div className="max-h-60 overflow-y-auto p-1">
						{flattenedOptions.map((option) => {
							const isSelected = value === option.id;
							const isExpanded = expandedNodes.has(option.id);

							return (
								<div
									key={option.id}
									className={cn(
										"flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm",
										isSelected && "bg-accent",
										!isSelected && "hover:bg-muted/50",
									)}
									style={{ paddingLeft: `${option.depth * 16 + 8}px` }}
									onClick={() => handleSelect(option.id)}
								>
									{option.hasChildren && (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												toggleNode(option.id);
											}}
											className="p-0.5 hover:bg-muted rounded"
										>
											{isExpanded ? (
												<ChevronDown className="h-3 w-3" />
											) : (
												<ChevronRight className="h-3 w-3" />
											)}
										</button>
									)}
									{!option.hasChildren && <div className="w-4" />}
									<DepartmentLevelIndicator level={option.level} />
									<span className="flex-1 truncate">{option.name}</span>
									<span className="text-xs text-muted-foreground font-mono">
										{option.code}
									</span>
									{isSelected && <Check className="h-4 w-4 text-primary" />}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

// Cascading dropdown version (Department → Unit → Station)
interface CascadingDepartmentSelectorProps {
	value?: string | null;
	onChange: (departmentId: string | null) => void;
	organizationId?: string;
	disabled?: boolean;
	className?: string;
}

export function CascadingDepartmentSelector({
	onChange,
	organizationId,
	disabled = false,
	className,
}: CascadingDepartmentSelectorProps) {
	const { data: tree, isLoading } = useDepartmentTree(organizationId);

	const [selectedLevel1, setSelectedLevel1] = useState<string | null>(null);
	const [selectedLevel2, setSelectedLevel2] = useState<string | null>(null);
	const [selectedLevel3, setSelectedLevel3] = useState<string | null>(null);

	// Get options for each level
	const level1Options = useMemo(() => {
		if (!tree) return [];
		return tree.filter((node) => node.departmentLevel === 1);
	}, [tree]);

	const level2Options = useMemo(() => {
		if (!selectedLevel1 || !tree) return [];
		const parent = tree.find((node) => node.id === selectedLevel1);
		return parent?.children?.filter((node) => node.departmentLevel === 2) || [];
	}, [selectedLevel1, tree]);

	const level3Options = useMemo(() => {
		if (!selectedLevel2 || !level2Options.length) return [];
		const parent = level2Options.find((node) => node.id === selectedLevel2);
		return parent?.children?.filter((node) => node.departmentLevel === 3) || [];
	}, [selectedLevel2, level2Options]);

	const handleLevel1Change = useCallback(
		(id: string | null) => {
			setSelectedLevel1(id);
			setSelectedLevel2(null);
			setSelectedLevel3(null);
			// If selecting a department directly (no unit/station needed)
			onChange(id);
		},
		[onChange],
	);

	const handleLevel2Change = useCallback(
		(id: string | null) => {
			setSelectedLevel2(id);
			setSelectedLevel3(null);
			onChange(id || selectedLevel1);
		},
		[onChange, selectedLevel1],
	);

	const handleLevel3Change = useCallback(
		(id: string | null) => {
			setSelectedLevel3(id);
			onChange(id || selectedLevel2 || selectedLevel1);
		},
		[onChange, selectedLevel1, selectedLevel2],
	);

	if (isLoading) {
		return (
			<div className={cn("flex gap-2", className)}>
				<div className="h-9 flex-1 rounded-md border bg-muted animate-pulse" />
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
			{/* Level 1: Department */}
			<div className="flex-1">
				<Select
					value={selectedLevel1 || ""}
					onValueChange={(val) => handleLevel1Change(val || null)}
					disabled={disabled}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select Department" />
					</SelectTrigger>
					<SelectContent>
						{level1Options.map((dept) => (
							<SelectItem key={dept.id} value={dept.id}>
								<div className="flex items-center gap-2">
									<DepartmentLevelIndicator level={1} />
									<span>{dept.name}</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Level 2: Unit */}
			{selectedLevel1 && level2Options.length > 0 && (
				<div className="flex-1">
					<Select
						value={selectedLevel2 || ""}
						onValueChange={(val) => handleLevel2Change(val || null)}
						disabled={disabled}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select Unit (optional)" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">
								<span className="text-muted-foreground">
									No specific unit
								</span>
							</SelectItem>
							{level2Options.map((unit) => (
								<SelectItem key={unit.id} value={unit.id}>
									<div className="flex items-center gap-2">
										<DepartmentLevelIndicator level={2} />
										<span>{unit.name}</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}

			{/* Level 3: Station */}
			{selectedLevel2 && level3Options.length > 0 && (
				<div className="flex-1">
					<Select
						value={selectedLevel3 || ""}
						onValueChange={(val) => handleLevel3Change(val || null)}
						disabled={disabled}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select Station (optional)" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">
								<span className="text-muted-foreground">
									No specific station
								</span>
							</SelectItem>
							{level3Options.map((station) => (
								<SelectItem key={station.id} value={station.id}>
									<div className="flex items-center gap-2">
										<DepartmentLevelIndicator level={3} />
										<span>{station.name}</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
		</div>
	);
}
