import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	ArrowRightLeft,
	ClipboardList,
	PackageMinus,
	PackagePlus,
	Scale,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
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
import { Switch } from "@/components/ui/switch";
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
	useAdjustStock,
	useInventoryLocations,
	useItems,
	useReceiveStock,
	useRecordCycleCount,
	useStockLevels,
	useTransferStock,
	useWriteOffStock,
} from "@/hooks/inventory";
import { usePermissions } from "@/hooks/usePermissions";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/inventory/stock/")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: StockPage,
});

const ADJUSTMENT_REASONS = [
	"damaged",
	"expired",
	"cycle_count_variance",
	"supplier_delivery",
	"other",
];

function StockPage() {
	const { hasPermission } = usePermissions();
	const canIssue = hasPermission("inventory.issue");
	const canManage = hasPermission("inventory.manage");

	const [lowStockOnly, setLowStockOnly] = useState(false);
	const [receiveOpen, setReceiveOpen] = useState(false);
	const [transferOpen, setTransferOpen] = useState(false);
	const [adjustOpen, setAdjustOpen] = useState(false);
	const [writeOffOpen, setWriteOffOpen] = useState(false);
	const [cycleCountOpen, setCycleCountOpen] = useState(false);
	const [receiveForm, setReceiveForm] = useState({
		itemId: "",
		toLocationId: "",
		quantity: 1,
		notes: "",
	});
	const [transferForm, setTransferForm] = useState({
		itemId: "",
		fromLocationId: "",
		toLocationId: "",
		quantity: 1,
		notes: "",
	});
	const [adjustForm, setAdjustForm] = useState({
		itemId: "",
		locationId: "",
		quantity: 1,
		direction: "increase" as "increase" | "decrease",
		reasonCode: "damaged",
		notes: "",
	});
	const [writeOffForm, setWriteOffForm] = useState({
		itemId: "",
		fromLocationId: "",
		quantity: 1,
		reasonCode: "damaged",
		notes: "",
	});
	const [cycleCountForm, setCycleCountForm] = useState({
		itemId: "",
		locationId: "",
		countedQuantity: 0,
	});

	const { data: stockRows, isLoading } = useStockLevels({
		lowStockOnly: lowStockOnly || undefined,
	});
	const { data: items } = useItems();
	const { data: locations } = useInventoryLocations();
	const receiveStock = useReceiveStock();
	const transferStock = useTransferStock();
	const adjustStock = useAdjustStock();
	const writeOffStock = useWriteOffStock();
	const recordCycleCount = useRecordCycleCount();

	async function handleReceive() {
		if (
			!receiveForm.itemId ||
			!receiveForm.toLocationId ||
			receiveForm.quantity <= 0
		)
			return;
		await receiveStock.mutateAsync(receiveForm);
		setReceiveForm({ itemId: "", toLocationId: "", quantity: 1, notes: "" });
		setReceiveOpen(false);
	}

	async function handleTransfer() {
		if (
			!transferForm.itemId ||
			!transferForm.fromLocationId ||
			!transferForm.toLocationId ||
			transferForm.quantity <= 0
		)
			return;
		await transferStock.mutateAsync(transferForm);
		setTransferForm({
			itemId: "",
			fromLocationId: "",
			toLocationId: "",
			quantity: 1,
			notes: "",
		});
		setTransferOpen(false);
	}

	async function handleAdjust() {
		if (
			!adjustForm.itemId ||
			!adjustForm.locationId ||
			adjustForm.quantity <= 0
		)
			return;
		await adjustStock.mutateAsync(adjustForm);
		setAdjustForm({
			itemId: "",
			locationId: "",
			quantity: 1,
			direction: "increase",
			reasonCode: "damaged",
			notes: "",
		});
		setAdjustOpen(false);
	}

	async function handleWriteOff() {
		if (
			!writeOffForm.itemId ||
			!writeOffForm.fromLocationId ||
			writeOffForm.quantity <= 0
		)
			return;
		await writeOffStock.mutateAsync(writeOffForm);
		setWriteOffForm({
			itemId: "",
			fromLocationId: "",
			quantity: 1,
			reasonCode: "damaged",
			notes: "",
		});
		setWriteOffOpen(false);
	}

	async function handleCycleCount() {
		if (!cycleCountForm.itemId || !cycleCountForm.locationId) return;
		await recordCycleCount.mutateAsync(cycleCountForm);
		setCycleCountForm({ itemId: "", locationId: "", countedQuantity: 0 });
		setCycleCountOpen(false);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Stock Levels</h1>
					<p className="text-sm text-muted-foreground">
						Real-time on-hand and reserved quantities across all locations.
					</p>
				</div>
				<div className="flex flex-wrap gap-2 items-center">
					<div className="flex gap-4 text-sm mr-2">
						<Link
							to="/inventory/items"
							className="text-primary hover:underline"
						>
							Items
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
							<Button variant="outline" onClick={() => setCycleCountOpen(true)}>
								<ClipboardList className="size-4 mr-2" /> Cycle Count
							</Button>
							<Button variant="outline" onClick={() => setAdjustOpen(true)}>
								<Scale className="size-4 mr-2" /> Adjust
							</Button>
							<Button variant="outline" onClick={() => setWriteOffOpen(true)}>
								<PackageMinus className="size-4 mr-2" /> Write Off
							</Button>
						</>
					)}
					{canIssue && (
						<>
							<Button variant="outline" onClick={() => setTransferOpen(true)}>
								<ArrowRightLeft className="size-4 mr-2" /> Transfer
							</Button>
							<Button onClick={() => setReceiveOpen(true)}>
								<PackagePlus className="size-4 mr-2" /> Receive Stock
							</Button>
						</>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Switch
					id="lowStockOnly"
					checked={lowStockOnly}
					onCheckedChange={setLowStockOnly}
				/>
				<Label htmlFor="lowStockOnly">Low stock only</Label>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>SKU</TableHead>
							<TableHead>Item</TableHead>
							<TableHead>Location</TableHead>
							<TableHead>On Hand</TableHead>
							<TableHead>Reserved</TableHead>
							<TableHead>Available</TableHead>
							<TableHead>Reorder Point</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading && (
							<TableRow>
								<TableCell
									colSpan={8}
									className="text-center text-muted-foreground py-8"
								>
									Loading stock levels...
								</TableCell>
							</TableRow>
						)}
						{!isLoading && (stockRows?.length ?? 0) === 0 && (
							<TableRow>
								<TableCell
									colSpan={8}
									className="text-center text-muted-foreground py-8"
								>
									No stock records found.
								</TableCell>
							</TableRow>
						)}
						{stockRows?.map((row) => {
							const available =
								row.stockLevel.quantityOnHand - row.stockLevel.quantityReserved;
							const isLow =
								row.stockLevel.quantityOnHand < row.item.reorderPoint;
							return (
								<TableRow key={row.stockLevel.id}>
									<TableCell className="font-mono text-xs">
										{row.item.sku}
									</TableCell>
									<TableCell className="font-medium">{row.item.name}</TableCell>
									<TableCell>{row.location.name}</TableCell>
									<TableCell>{row.stockLevel.quantityOnHand}</TableCell>
									<TableCell>{row.stockLevel.quantityReserved}</TableCell>
									<TableCell>{available}</TableCell>
									<TableCell>{row.item.reorderPoint}</TableCell>
									<TableCell>
										<Badge variant={isLow ? "destructive" : "success"}>
											{isLow ? "Low Stock" : "OK"}
										</Badge>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{/* Receive Stock Dialog */}
			<Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Receive Stock</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Item</Label>
							<Select
								value={receiveForm.itemId}
								onValueChange={(v) =>
									setReceiveForm((f) => ({ ...f, itemId: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select item" />
								</SelectTrigger>
								<SelectContent>
									{items?.map((i) => (
										<SelectItem key={i.id} value={i.id}>
											{i.name} ({i.sku})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Location</Label>
							<Select
								value={receiveForm.toLocationId}
								onValueChange={(v) =>
									setReceiveForm((f) => ({ ...f, toLocationId: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select location" />
								</SelectTrigger>
								<SelectContent>
									{locations?.map((l) => (
										<SelectItem key={l.id} value={l.id}>
											{l.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="receiveQty">Quantity</Label>
							<Input
								id="receiveQty"
								type="number"
								min={1}
								value={receiveForm.quantity}
								onChange={(e) =>
									setReceiveForm((f) => ({
										...f,
										quantity: Number(e.target.value),
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="receiveNotes">Notes</Label>
							<Textarea
								id="receiveNotes"
								value={receiveForm.notes}
								onChange={(e) =>
									setReceiveForm((f) => ({ ...f, notes: e.target.value }))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setReceiveOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleReceive} disabled={receiveStock.isPending}>
							{receiveStock.isPending ? "Receiving..." : "Receive"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Transfer Stock Dialog */}
			<Dialog open={transferOpen} onOpenChange={setTransferOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Transfer Stock</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Item</Label>
							<Select
								value={transferForm.itemId}
								onValueChange={(v) =>
									setTransferForm((f) => ({ ...f, itemId: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select item" />
								</SelectTrigger>
								<SelectContent>
									{items?.map((i) => (
										<SelectItem key={i.id} value={i.id}>
											{i.name} ({i.sku})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label>From</Label>
								<Select
									value={transferForm.fromLocationId}
									onValueChange={(v) =>
										setTransferForm((f) => ({ ...f, fromLocationId: v }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="From location" />
									</SelectTrigger>
									<SelectContent>
										{locations?.map((l) => (
											<SelectItem key={l.id} value={l.id}>
												{l.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>To</Label>
								<Select
									value={transferForm.toLocationId}
									onValueChange={(v) =>
										setTransferForm((f) => ({ ...f, toLocationId: v }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="To location" />
									</SelectTrigger>
									<SelectContent>
										{locations?.map((l) => (
											<SelectItem key={l.id} value={l.id}>
												{l.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="transferQty">Quantity</Label>
							<Input
								id="transferQty"
								type="number"
								min={1}
								value={transferForm.quantity}
								onChange={(e) =>
									setTransferForm((f) => ({
										...f,
										quantity: Number(e.target.value),
									}))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setTransferOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleTransfer} disabled={transferStock.isPending}>
							{transferStock.isPending ? "Transferring..." : "Transfer"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Adjust Stock Dialog */}
			<Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Adjust Stock</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Item</Label>
							<Select
								value={adjustForm.itemId}
								onValueChange={(v) =>
									setAdjustForm((f) => ({ ...f, itemId: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select item" />
								</SelectTrigger>
								<SelectContent>
									{items?.map((i) => (
										<SelectItem key={i.id} value={i.id}>
											{i.name} ({i.sku})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Location</Label>
							<Select
								value={adjustForm.locationId}
								onValueChange={(v) =>
									setAdjustForm((f) => ({ ...f, locationId: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select location" />
								</SelectTrigger>
								<SelectContent>
									{locations?.map((l) => (
										<SelectItem key={l.id} value={l.id}>
											{l.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label>Direction</Label>
								<Select
									value={adjustForm.direction}
									onValueChange={(v) =>
										setAdjustForm((f) => ({
											...f,
											direction: v as "increase" | "decrease",
										}))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="increase">Increase</SelectItem>
										<SelectItem value="decrease">Decrease</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="adjustQty">Quantity</Label>
								<Input
									id="adjustQty"
									type="number"
									min={1}
									value={adjustForm.quantity}
									onChange={(e) =>
										setAdjustForm((f) => ({
											...f,
											quantity: Number(e.target.value),
										}))
									}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Reason</Label>
							<Select
								value={adjustForm.reasonCode}
								onValueChange={(v) =>
									setAdjustForm((f) => ({ ...f, reasonCode: v }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{ADJUSTMENT_REASONS.map((r) => (
										<SelectItem key={r} value={r} className="capitalize">
											{r.replace(/_/g, " ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setAdjustOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleAdjust} disabled={adjustStock.isPending}>
							{adjustStock.isPending ? "Adjusting..." : "Adjust"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Write Off Stock Dialog */}
			<Dialog open={writeOffOpen} onOpenChange={setWriteOffOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Write Off Stock</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Item</Label>
							<Select
								value={writeOffForm.itemId}
								onValueChange={(v) =>
									setWriteOffForm((f) => ({ ...f, itemId: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select item" />
								</SelectTrigger>
								<SelectContent>
									{items?.map((i) => (
										<SelectItem key={i.id} value={i.id}>
											{i.name} ({i.sku})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Location</Label>
							<Select
								value={writeOffForm.fromLocationId}
								onValueChange={(v) =>
									setWriteOffForm((f) => ({ ...f, fromLocationId: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select location" />
								</SelectTrigger>
								<SelectContent>
									{locations?.map((l) => (
										<SelectItem key={l.id} value={l.id}>
											{l.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label htmlFor="writeOffQty">Quantity</Label>
								<Input
									id="writeOffQty"
									type="number"
									min={1}
									value={writeOffForm.quantity}
									onChange={(e) =>
										setWriteOffForm((f) => ({
											...f,
											quantity: Number(e.target.value),
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Reason</Label>
								<Select
									value={writeOffForm.reasonCode}
									onValueChange={(v) =>
										setWriteOffForm((f) => ({ ...f, reasonCode: v }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{ADJUSTMENT_REASONS.map((r) => (
											<SelectItem key={r} value={r} className="capitalize">
												{r.replace(/_/g, " ")}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setWriteOffOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleWriteOff}
							disabled={writeOffStock.isPending}
						>
							{writeOffStock.isPending ? "Writing off..." : "Write Off"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Cycle Count Dialog */}
			<Dialog open={cycleCountOpen} onOpenChange={setCycleCountOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cycle Count</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Item</Label>
							<Select
								value={cycleCountForm.itemId}
								onValueChange={(v) =>
									setCycleCountForm((f) => ({ ...f, itemId: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select item" />
								</SelectTrigger>
								<SelectContent>
									{items?.map((i) => (
										<SelectItem key={i.id} value={i.id}>
											{i.name} ({i.sku})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Location</Label>
							<Select
								value={cycleCountForm.locationId}
								onValueChange={(v) =>
									setCycleCountForm((f) => ({ ...f, locationId: v }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select location" />
								</SelectTrigger>
								<SelectContent>
									{locations?.map((l) => (
										<SelectItem key={l.id} value={l.id}>
											{l.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="countedQty">Counted Quantity</Label>
							<Input
								id="countedQty"
								type="number"
								min={0}
								value={cycleCountForm.countedQuantity}
								onChange={(e) =>
									setCycleCountForm((f) => ({
										...f,
										countedQuantity: Number(e.target.value),
									}))
								}
							/>
							<p className="text-xs text-muted-foreground">
								Any variance from the current on-hand quantity is recorded as an
								automatic adjustment.
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCycleCountOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleCycleCount}
							disabled={recordCycleCount.isPending}
						>
							{recordCycleCount.isPending ? "Recording..." : "Record Count"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
