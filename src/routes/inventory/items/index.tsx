import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	FolderPlus,
	MapPinPlus,
	Pencil,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CreateItemRequest } from "@/api/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	useCreateInventoryLocation,
	useCreateItem,
	useCreateItemCategory,
	useDeleteItem,
	useInventoryLocations,
	useItemCategories,
	useItems,
	useUpdateItem,
} from "@/hooks/inventory";
import { usePermissions } from "@/hooks/usePermissions";
import type { ItemUnitOfMeasure, StockLocationType } from "@/types/inventory";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/inventory/items/")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: ItemsPage,
});

const UNITS_OF_MEASURE: ItemUnitOfMeasure[] = [
	"each",
	"box",
	"pack",
	"litre",
	"kg",
	"metre",
	"roll",
	"pair",
	"set",
	"carton",
];

const LOCATION_TYPES: StockLocationType[] = [
	"warehouse",
	"store",
	"terminal_store",
	"vehicle",
	"other",
];

const EMPTY_ITEM_FORM: CreateItemRequest = {
	sku: "",
	name: "",
	unitOfMeasure: "each",
	minStockLevel: 0,
	reorderPoint: 0,
};

function ItemsPage() {
	const { hasPermission } = usePermissions();
	const canManage = hasPermission("inventory.manage");
	const [search, setSearch] = useState("");
	const [itemDialogOpen, setItemDialogOpen] = useState(false);
	const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
	const [locationDialogOpen, setLocationDialogOpen] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
	const [itemForm, setItemForm] = useState<CreateItemRequest>(EMPTY_ITEM_FORM);
	const [categoryForm, setCategoryForm] = useState({
		name: "",
		code: "",
		description: "",
	});
	const [locationForm, setLocationForm] = useState<{
		name: string;
		code: string;
		locationType: StockLocationType;
	}>({ name: "", code: "", locationType: "store" });

	const { data: items, isLoading } = useItems({ search: search || undefined });
	const { data: categories } = useItemCategories();
	const { data: locations } = useInventoryLocations();

	const createItem = useCreateItem();
	const updateItem = useUpdateItem(editingItemId ?? "");
	const deleteItem = useDeleteItem();
	const createCategory = useCreateItemCategory();
	const createLocation = useCreateInventoryLocation();

	const categoryNameById = useMemo(() => {
		const map = new Map<string, string>();
		for (const c of categories ?? []) map.set(c.id, c.name);
		return map;
	}, [categories]);

	function openCreateItemDialog() {
		setEditingItemId(null);
		setItemForm(EMPTY_ITEM_FORM);
		setItemDialogOpen(true);
	}

	function openEditItemDialog(itemId: string) {
		const item = items?.find((i) => i.id === itemId);
		if (!item) return;
		setEditingItemId(itemId);
		setItemForm({
			sku: item.sku,
			barcode: item.barcode ?? undefined,
			name: item.name,
			description: item.description ?? undefined,
			categoryId: item.categoryId ?? undefined,
			unitOfMeasure: item.unitOfMeasure,
			minStockLevel: item.minStockLevel,
			reorderPoint: item.reorderPoint,
			reorderQuantity: item.reorderQuantity ?? undefined,
			supplierName: item.supplierName ?? undefined,
			supplierContact: item.supplierContact ?? undefined,
			unitCost: item.unitCost ? Number(item.unitCost) : undefined,
		});
		setItemDialogOpen(true);
	}

	async function handleSaveItem() {
		if (!itemForm.sku.trim() || !itemForm.name.trim()) return;
		if (editingItemId) {
			await updateItem.mutateAsync(itemForm);
		} else {
			await createItem.mutateAsync(itemForm);
		}
		setItemForm(EMPTY_ITEM_FORM);
		setEditingItemId(null);
		setItemDialogOpen(false);
	}

	async function handleDeleteItem() {
		if (!deletingItemId) return;
		await deleteItem.mutateAsync(deletingItemId);
		setDeletingItemId(null);
	}

	async function handleCreateCategory() {
		if (!categoryForm.name.trim() || !categoryForm.code.trim()) return;
		await createCategory.mutateAsync(categoryForm);
		setCategoryForm({ name: "", code: "", description: "" });
		setCategoryDialogOpen(false);
	}

	async function handleCreateLocation() {
		if (!locationForm.name.trim() || !locationForm.code.trim()) return;
		await createLocation.mutateAsync(locationForm);
		setLocationForm({ name: "", code: "", locationType: "store" });
		setLocationDialogOpen(false);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Inventory Items</h1>
					<p className="text-sm text-muted-foreground">
						Item master, categories, and stores/warehouse locations.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<div className="flex gap-4 text-sm mr-2">
						<Link
							to="/inventory/stock"
							className="text-primary hover:underline"
						>
							Stock Levels
						</Link>
						<Link
							to="/inventory/requisitions"
							className="text-primary hover:underline"
						>
							Requisitions
						</Link>
					</div>
					{canManage && (
						<>
							<Button
								variant="outline"
								onClick={() => setLocationDialogOpen(true)}
							>
								<MapPinPlus className="size-4 mr-2" /> New Location
							</Button>
							<Button
								variant="outline"
								onClick={() => setCategoryDialogOpen(true)}
							>
								<FolderPlus className="size-4 mr-2" /> New Category
							</Button>
							<Button onClick={openCreateItemDialog}>
								<Plus className="size-4 mr-2" /> New Item
							</Button>
						</>
					)}
				</div>
			</div>

			<div className="relative max-w-sm">
				<Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
				<Input
					placeholder="Search by name or SKU..."
					className="pl-8"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>SKU</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Unit</TableHead>
							<TableHead>Min Stock</TableHead>
							<TableHead>Reorder Point</TableHead>
							<TableHead>Unit Cost</TableHead>
							<TableHead>Status</TableHead>
							{canManage && <TableHead className="w-24">Actions</TableHead>}
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading && (
							<TableRow>
								<TableCell
									colSpan={canManage ? 9 : 8}
									className="text-center text-muted-foreground py-8"
								>
									Loading items...
								</TableCell>
							</TableRow>
						)}
						{!isLoading && (items?.length ?? 0) === 0 && (
							<TableRow>
								<TableCell
									colSpan={canManage ? 9 : 8}
									className="text-center text-muted-foreground py-8"
								>
									No items found.
								</TableCell>
							</TableRow>
						)}
						{items?.map((item) => (
							<TableRow key={item.id}>
								<TableCell className="font-mono text-xs">{item.sku}</TableCell>
								<TableCell className="font-medium">{item.name}</TableCell>
								<TableCell>
									{item.categoryId
										? (categoryNameById.get(item.categoryId) ?? "-")
										: "-"}
								</TableCell>
								<TableCell className="capitalize">
									{item.unitOfMeasure}
								</TableCell>
								<TableCell>{item.minStockLevel}</TableCell>
								<TableCell>{item.reorderPoint}</TableCell>
								<TableCell>
									{item.unitCost
										? `₦${Number(item.unitCost).toLocaleString()}`
										: "-"}
								</TableCell>
								<TableCell>
									<Badge variant={item.isActive ? "success" : "secondary"}>
										{item.isActive ? "Active" : "Inactive"}
									</Badge>
								</TableCell>
								{canManage && (
									<TableCell>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => openEditItemDialog(item.id)}
											>
												<Pencil className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-destructive"
												onClick={() => setDeletingItemId(item.id)}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									</TableCell>
								)}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Create/Edit Item Dialog */}
			<Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{editingItemId ? "Edit Item" : "New Item"}
						</DialogTitle>
						<DialogDescription>
							{editingItemId
								? "Update this item's details."
								: "Add a new item to the master catalogue."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label htmlFor="sku">SKU</Label>
								<Input
									id="sku"
									value={itemForm.sku}
									onChange={(e) =>
										setItemForm((f) => ({ ...f, sku: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="barcode">Barcode</Label>
								<Input
									id="barcode"
									value={itemForm.barcode ?? ""}
									onChange={(e) =>
										setItemForm((f) => ({ ...f, barcode: e.target.value }))
									}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={itemForm.name}
								onChange={(e) =>
									setItemForm((f) => ({ ...f, name: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={itemForm.description ?? ""}
								onChange={(e) =>
									setItemForm((f) => ({ ...f, description: e.target.value }))
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label>Category</Label>
								<Select
									value={itemForm.categoryId}
									onValueChange={(v) =>
										setItemForm((f) => ({ ...f, categoryId: v }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select category" />
									</SelectTrigger>
									<SelectContent>
										{categories?.map((c) => (
											<SelectItem key={c.id} value={c.id}>
												{c.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Unit of Measure</Label>
								<Select
									value={itemForm.unitOfMeasure}
									onValueChange={(v) =>
										setItemForm((f) => ({
											...f,
											unitOfMeasure: v as ItemUnitOfMeasure,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{UNITS_OF_MEASURE.map((u) => (
											<SelectItem key={u} value={u} className="capitalize">
												{u}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-2">
								<Label htmlFor="minStock">Min Stock</Label>
								<Input
									id="minStock"
									type="number"
									min={0}
									value={itemForm.minStockLevel ?? 0}
									onChange={(e) =>
										setItemForm((f) => ({
											...f,
											minStockLevel: Number(e.target.value),
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="reorderPoint">Reorder Point</Label>
								<Input
									id="reorderPoint"
									type="number"
									min={0}
									value={itemForm.reorderPoint ?? 0}
									onChange={(e) =>
										setItemForm((f) => ({
											...f,
											reorderPoint: Number(e.target.value),
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="unitCost">Unit Cost (₦)</Label>
								<Input
									id="unitCost"
									type="number"
									min={0}
									step="0.01"
									value={itemForm.unitCost ?? ""}
									onChange={(e) =>
										setItemForm((f) => ({
											...f,
											unitCost: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setItemDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleSaveItem}
							disabled={createItem.isPending || updateItem.isPending}
						>
							{createItem.isPending || updateItem.isPending
								? "Saving..."
								: editingItemId
									? "Save Changes"
									: "Create Item"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				open={!!deletingItemId}
				onOpenChange={(open) => !open && setDeletingItemId(null)}
				title="Delete item?"
				description="This cannot be undone. Items referenced by existing stock or requisitions cannot be deleted."
				confirmLabel="Delete Item"
				variant="destructive"
				loading={deleteItem.isPending}
				onConfirm={handleDeleteItem}
			/>

			{/* Create Category Dialog */}
			<Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New Category</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="catName">Name</Label>
							<Input
								id="catName"
								value={categoryForm.name}
								onChange={(e) =>
									setCategoryForm((f) => ({ ...f, name: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="catCode">Code</Label>
							<Input
								id="catCode"
								value={categoryForm.code}
								onChange={(e) =>
									setCategoryForm((f) => ({ ...f, code: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="catDescription">Description</Label>
							<Textarea
								id="catDescription"
								value={categoryForm.description}
								onChange={(e) =>
									setCategoryForm((f) => ({
										...f,
										description: e.target.value,
									}))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCategoryDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateCategory}
							disabled={createCategory.isPending}
						>
							{createCategory.isPending ? "Creating..." : "Create Category"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Create Location Dialog */}
			<Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New Location</DialogTitle>
						<DialogDescription>
							{locations?.length
								? `${locations.length} location(s) already configured.`
								: "No locations yet."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="locName">Name</Label>
							<Input
								id="locName"
								value={locationForm.name}
								onChange={(e) =>
									setLocationForm((f) => ({ ...f, name: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="locCode">Code</Label>
							<Input
								id="locCode"
								value={locationForm.code}
								onChange={(e) =>
									setLocationForm((f) => ({ ...f, code: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Type</Label>
							<Select
								value={locationForm.locationType}
								onValueChange={(v) =>
									setLocationForm((f) => ({
										...f,
										locationType: v as StockLocationType,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{LOCATION_TYPES.map((t) => (
										<SelectItem key={t} value={t} className="capitalize">
											{t.replace("_", " ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setLocationDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateLocation}
							disabled={createLocation.isPending}
						>
							{createLocation.isPending ? "Creating..." : "Create Location"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
