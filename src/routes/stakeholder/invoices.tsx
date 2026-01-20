import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Search, Filter, Clock, CheckCircle2, XCircle, FileText, Eye, DollarSign, Loader2, AlertCircle, Receipt, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStakeholderInvoices, useCreateStakeholderInvoice } from "@/hooks/stakeholder-portal";
import type { StakeholderInvoice, InvoiceLineItem } from "@/types/stakeholder-portal";

import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/stakeholder/invoices")({ component: InvoicesPage });

type InvoiceStatus = StakeholderInvoice["status"];

function getStatusBadge(status: InvoiceStatus) {
	const config: Record<InvoiceStatus, { label: string; className: string; icon: React.ReactNode }> = {
		draft: { label: "Draft", className: "bg-slate-500/20 text-slate-400", icon: <FileText className="h-3 w-3" /> },
		submitted: { label: "Submitted", className: "bg-blue-500/20 text-blue-400", icon: <Clock className="h-3 w-3" /> },
		under_review: { label: "Under Review", className: "bg-amber-500/20 text-amber-400", icon: <Clock className="h-3 w-3" /> },
		approved: { label: "Approved", className: "bg-emerald-500/20 text-emerald-400", icon: <CheckCircle2 className="h-3 w-3" /> },
		rejected: { label: "Rejected", className: "bg-red-500/20 text-red-400", icon: <XCircle className="h-3 w-3" /> },
		paid: { label: "Paid", className: "bg-purple-500/20 text-purple-400", icon: <CreditCard className="h-3 w-3" /> },
	};
	const { label, className, icon } = config[status] || config.draft;
	return <Badge variant="outline" className={`${className} flex items-center gap-1.5`}>{icon}{label}</Badge>;
}

function InvoicesPage() {
	const { user } = useAuthStore();
	const orgId = user?.organizationId || "";

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [selectedInvoice, setSelectedInvoice] = useState<StakeholderInvoice | null>(null);
	const [formData, setFormData] = useState({
		invoiceDate: new Date().toISOString().split("T")[0], dueDate: "", description: "",
		lineItems: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }] as InvoiceLineItem[],
	});

	const { data: invoicesData, isLoading } = useStakeholderInvoices(orgId, { reviewStatus: statusFilter !== "all" ? statusFilter : undefined });
	const createInvoice = useCreateStakeholderInvoice(orgId);
	const invoices = invoicesData?.data ?? [];
	const filteredInvoices = useMemo(() => invoices.filter((inv) => inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || inv.description.toLowerCase().includes(search.toLowerCase())), [invoices, search]);

	const stats = useMemo(() => ({
		total: invoices.length,
		paidAmount: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0),
		pendingAmount: invoices.filter((i) => i.status !== "paid" && i.status !== "rejected").reduce((s, i) => s + i.total, 0),
	}), [invoices]);

	const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
		setFormData((prev) => {
			const newItems = [...prev.lineItems];
			newItems[index] = { ...newItems[index], [field]: value };
			if (field === "quantity" || field === "unitPrice") newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
			return { ...prev, lineItems: newItems };
		});
	};

	const addLineItem = () => setFormData((prev) => ({ ...prev, lineItems: [...prev.lineItems, { description: "", quantity: 1, unitPrice: 0, amount: 0 }] }));
	const removeLineItem = (index: number) => { if (formData.lineItems.length > 1) setFormData((prev) => ({ ...prev, lineItems: prev.lineItems.filter((_, i) => i !== index) })); };

	const subtotal = formData.lineItems.reduce((s, i) => s + i.amount, 0);
	const tax = subtotal * 0.075;
	const total = subtotal + tax;

	const handleCreateInvoice = async () => {
		const valid = formData.lineItems.filter((i) => i.description && i.amount > 0);
		if (!formData.dueDate || !valid.length) return;
		await createInvoice.mutateAsync({ invoiceDate: formData.invoiceDate, dueDate: formData.dueDate, description: formData.description, lineItems: valid });
		setShowCreateDialog(false);
		setFormData({ invoiceDate: new Date().toISOString().split("T")[0], dueDate: "", description: "", lineItems: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }] });
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div><h1 className="text-3xl font-bold text-white flex items-center gap-3"><Receipt className="h-8 w-8 text-purple-400" />Invoices</h1><p className="text-slate-400 mt-1">Submit and track invoices</p></div>
					<Button onClick={() => setShowCreateDialog(true)} className="bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
				</div>

				<div className="grid grid-cols-3 gap-4">
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><FileText className="h-8 w-8 text-slate-400" /><div><p className="text-slate-400 text-sm">Total</p><p className="text-2xl font-bold text-white">{stats.total}</p></div></div></div>
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-emerald-400" /><div><p className="text-slate-400 text-sm">Paid</p><p className="text-xl font-bold text-emerald-400">₦{stats.paidAmount.toLocaleString()}</p></div></div></div>
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-amber-400" /><div><p className="text-slate-400 text-sm">Pending</p><p className="text-xl font-bold text-amber-400">₦{stats.pendingAmount.toLocaleString()}</p></div></div></div>
				</div>

				<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4">
					<div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-700 text-white" /></div>
					<Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700 text-white"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="submitted">Submitted</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select>
				</div>

				<div className="space-y-4">
					{isLoading ? <div className="bg-white/5 rounded-xl p-12 text-center"><Loader2 className="h-8 w-8 text-purple-400 mx-auto animate-spin" /></div> : filteredInvoices.length === 0 ? <div className="bg-white/5 rounded-xl p-12 text-center"><AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" /><p className="text-slate-400">No invoices found</p><Button onClick={() => setShowCreateDialog(true)} className="mt-4 bg-purple-500"><Plus className="h-4 w-4 mr-2" />Create Invoice</Button></div> : filteredInvoices.map((inv) => (
						<div key={inv.id} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:bg-white/10 cursor-pointer" onClick={() => { setSelectedInvoice(inv); setShowDetailDialog(true); }}>
							<div className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-4"><div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center"><Receipt className="h-6 w-6 text-purple-400" /></div><div><h3 className="text-white font-medium">{inv.invoiceNumber}</h3><p className="text-sm text-slate-400">{inv.description}</p><div className="mt-2">{getStatusBadge(inv.status)}</div></div></div>
								<div className="flex items-center gap-4"><div className="text-right"><p className="text-slate-400 text-sm">Amount</p><p className="text-xl font-bold text-white">₦{inv.total.toLocaleString()}</p></div><div className="text-right text-sm"><p className="text-slate-400">Due</p><p className="text-white">{new Date(inv.dueDate).toLocaleDateString()}</p></div><Button size="sm" variant="outline" className="border-slate-700"><Eye className="h-4 w-4" /></Button></div>
							</div>
						</div>
					))}
				</div>
			</div>

			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader><DialogTitle>Create Invoice</DialogTitle><DialogDescription className="text-slate-400">Submit a new invoice</DialogDescription></DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-slate-300">Invoice Date</Label><Input type="date" value={formData.invoiceDate} onChange={(e) => setFormData((p) => ({ ...p, invoiceDate: e.target.value }))} className="bg-slate-800 border-slate-700" /></div><div className="space-y-2"><Label className="text-slate-300">Due Date *</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))} className="bg-slate-800 border-slate-700" /></div></div>
						<div className="space-y-2"><Label className="text-slate-300">Description</Label><Textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} className="bg-slate-800 border-slate-700" /></div>
						<div className="space-y-3">
							<div className="flex items-center justify-between"><Label className="text-slate-300">Line Items *</Label><Button type="button" size="sm" variant="outline" onClick={addLineItem} className="border-purple-500/50 text-purple-400"><Plus className="h-3 w-3 mr-1" />Add</Button></div>
							{formData.lineItems.map((item, idx) => (<div key={idx} className="bg-slate-800/50 rounded-lg p-3 space-y-2"><div className="flex items-center gap-2"><Input placeholder="Description" value={item.description} onChange={(e) => updateLineItem(idx, "description", e.target.value)} className="flex-1 bg-slate-800 border-slate-700 text-sm" /><Button type="button" size="icon" variant="ghost" onClick={() => removeLineItem(idx)} className="text-red-400"><Trash2 className="h-4 w-4" /></Button></div><div className="grid grid-cols-3 gap-2"><Input type="number" min="1" value={item.quantity} onChange={(e) => updateLineItem(idx, "quantity", parseInt(e.target.value) || 0)} className="bg-slate-800 border-slate-700 text-sm" placeholder="Qty" /><Input type="number" min="0" value={item.unitPrice} onChange={(e) => updateLineItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="bg-slate-800 border-slate-700 text-sm" placeholder="Price" /><Input readOnly value={`₦${item.amount.toLocaleString()}`} className="bg-slate-700/50 border-slate-700 text-sm" /></div></div>))}
						</div>
						<div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 space-y-2"><div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-white">₦{subtotal.toLocaleString()}</span></div><div className="flex justify-between text-sm"><span className="text-slate-400">VAT (7.5%)</span><span className="text-white">₦{tax.toFixed(2)}</span></div><div className="flex justify-between text-lg font-bold border-t border-purple-500/20 pt-2"><span className="text-white">Total</span><span className="text-purple-400">₦{total.toFixed(2)}</span></div></div>
					</div>
					<DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-slate-700 text-slate-300">Cancel</Button><Button onClick={handleCreateInvoice} disabled={!formData.dueDate || createInvoice.isPending} className="bg-purple-500 hover:bg-purple-600">{createInvoice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}Create</Button></DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
					<DialogHeader><DialogTitle className="flex items-center gap-3"><Receipt className="h-5 w-5 text-purple-400" />Invoice Details</DialogTitle><DialogDescription className="text-slate-400">{selectedInvoice?.invoiceNumber}</DialogDescription></DialogHeader>
					{selectedInvoice && (<div className="space-y-4 py-4">{getStatusBadge(selectedInvoice.status)}<div className="grid grid-cols-3 gap-4"><div className="bg-slate-800/50 rounded-lg p-3"><p className="text-slate-400 text-sm">Date</p><p className="text-white">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</p></div><div className="bg-slate-800/50 rounded-lg p-3"><p className="text-slate-400 text-sm">Due</p><p className="text-white">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p></div><div className="bg-slate-800/50 rounded-lg p-3"><p className="text-slate-400 text-sm">Total</p><p className="text-white font-bold">₦{selectedInvoice.total.toLocaleString()}</p></div></div><div className="bg-slate-800/50 rounded-lg overflow-hidden"><table className="w-full text-sm"><thead className="bg-slate-700/50"><tr><th className="text-left p-3 text-slate-400">Description</th><th className="text-right p-3 text-slate-400">Qty</th><th className="text-right p-3 text-slate-400">Price</th><th className="text-right p-3 text-slate-400">Amount</th></tr></thead><tbody>{selectedInvoice.lineItems.map((item, i) => (<tr key={i} className="border-t border-slate-700/50"><td className="p-3 text-white">{item.description}</td><td className="p-3 text-right text-slate-300">{item.quantity}</td><td className="p-3 text-right text-slate-300">₦{item.unitPrice.toLocaleString()}</td><td className="p-3 text-right text-white font-medium">₦{item.amount.toLocaleString()}</td></tr>))}</tbody></table></div></div>)}
					<DialogFooter><Button variant="outline" onClick={() => setShowDetailDialog(false)} className="border-slate-700 text-slate-300">Close</Button></DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
