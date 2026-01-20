import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Search, Filter, Clock, Plane, PlaneTakeoff, PlaneLanding, Calendar, Loader2, AlertCircle, Eye, Users, Package, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStakeholderFlights, useCreateStakeholderFlight, useUpdateStakeholderFlight } from "@/hooks/stakeholder-portal";
import type { StakeholderFlight, FlightStatus } from "@/types/stakeholder-portal";

import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/stakeholder/flights")({ component: FlightsPage });

const flightStatuses: { value: FlightStatus; label: string; color: string }[] = [
	{ value: "scheduled", label: "Scheduled", color: "bg-blue-500/20 text-blue-400" },
	{ value: "boarding", label: "Boarding", color: "bg-amber-500/20 text-amber-400" },
	{ value: "departed", label: "Departed", color: "bg-emerald-500/20 text-emerald-400" },
	{ value: "arrived", label: "Arrived", color: "bg-purple-500/20 text-purple-400" },
	{ value: "delayed", label: "Delayed", color: "bg-orange-500/20 text-orange-400" },
	{ value: "cancelled", label: "Cancelled", color: "bg-red-500/20 text-red-400" },
];

function getStatusBadge(status: string) {
	const s = flightStatuses.find((fs) => fs.value === status) || flightStatuses[0];
	return <Badge variant="outline" className={`${s.color} border-transparent`}>{s.label}</Badge>;
}

function FlightsPage() {
	const { user } = useAuthStore();
	const orgId = user?.organizationId || "";

	const [search, setSearch] = useState("");
	const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [selectedFlight, setSelectedFlight] = useState<StakeholderFlight | null>(null);

	const [formData, setFormData] = useState({
		flightNumber: "", aircraftType: "", aircraftRegistration: "", origin: "", destination: "",
		scheduledDeparture: "", scheduledArrival: "", gate: "", terminal: "", passengerCount: 0, cargoWeight: 0,
	});
	const [editData, setEditData] = useState({ gate: "", status: "" });

	const { data: flightsData, isLoading } = useStakeholderFlights(orgId, { date: dateFilter, flightStatus: statusFilter !== "all" ? statusFilter : undefined });
	const createFlight = useCreateStakeholderFlight(orgId);
	const updateFlight = useUpdateStakeholderFlight(orgId);

	const flights = flightsData?.data ?? [];
	const filteredFlights = useMemo(() => flights.filter((f) => f.flightNumber.toLowerCase().includes(search.toLowerCase()) || f.origin.toLowerCase().includes(search.toLowerCase()) || f.destination.toLowerCase().includes(search.toLowerCase())), [flights, search]);

	const stats = useMemo(() => ({ total: flights.length, departures: flights.filter((f) => f.origin === "LOS").length, arrivals: flights.filter((f) => f.destination === "LOS").length, delayed: flights.filter((f) => f.status === "delayed").length }), [flights]);

	const handleCreateFlight = async () => {
		if (!formData.flightNumber || !formData.origin || !formData.destination) return;
		await createFlight.mutateAsync({
			flightNumber: formData.flightNumber, aircraftType: formData.aircraftType || undefined, aircraftRegistration: formData.aircraftRegistration || undefined, origin: formData.origin, destination: formData.destination,
			scheduledDeparture: formData.scheduledDeparture, scheduledArrival: formData.scheduledArrival, gate: formData.gate || undefined, terminal: formData.terminal || undefined,
			passengerCount: formData.passengerCount || undefined, cargoWeight: formData.cargoWeight || undefined,
		});
		setShowCreateDialog(false);
		setFormData({ flightNumber: "", aircraftType: "", aircraftRegistration: "", origin: "", destination: "", scheduledDeparture: "", scheduledArrival: "", gate: "", terminal: "", passengerCount: 0, cargoWeight: 0 });
	};

	const handleUpdateFlight = async () => {
		if (!selectedFlight) return;
		await updateFlight.mutateAsync({ flightId: selectedFlight.id, input: { gate: editData.gate || undefined, flightStatus: editData.status || undefined } });
		setShowEditDialog(false);
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div><h1 className="text-3xl font-bold text-white flex items-center gap-3"><Plane className="h-8 w-8 text-sky-400" />Flight Schedules</h1><p className="text-slate-400 mt-1">Manage your airline's flight schedules</p></div>
					<Button onClick={() => setShowCreateDialog(true)} className="bg-linear-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"><Plus className="h-4 w-4 mr-2" />Add Flight</Button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><Plane className="h-8 w-8 text-sky-400" /><div><p className="text-slate-400 text-sm">Total</p><p className="text-2xl font-bold text-white">{stats.total}</p></div></div></div>
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><PlaneTakeoff className="h-8 w-8 text-emerald-400" /><div><p className="text-slate-400 text-sm">Departures</p><p className="text-2xl font-bold text-emerald-400">{stats.departures}</p></div></div></div>
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><PlaneLanding className="h-8 w-8 text-purple-400" /><div><p className="text-slate-400 text-sm">Arrivals</p><p className="text-2xl font-bold text-purple-400">{stats.arrivals}</p></div></div></div>
					<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-orange-400" /><div><p className="text-slate-400 text-sm">Delayed</p><p className="text-2xl font-bold text-orange-400">{stats.delayed}</p></div></div></div>
				</div>

				<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4">
					<div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search flights..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-700 text-white" /></div>
					<Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full md:w-48 bg-slate-800/50 border-slate-700 text-white" />
					<Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700 text-white"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{flightStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
				</div>

				<div className="space-y-4">
					{isLoading ? <div className="bg-white/5 rounded-xl p-12 text-center"><Loader2 className="h-8 w-8 text-sky-400 mx-auto animate-spin" /></div> : filteredFlights.length === 0 ? <div className="bg-white/5 rounded-xl p-12 text-center"><AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" /><p className="text-slate-400">No flights found</p><Button onClick={() => setShowCreateDialog(true)} className="mt-4 bg-sky-500"><Plus className="h-4 w-4 mr-2" />Add Flight</Button></div> : filteredFlights.map((flight) => (
						<div key={flight.id} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
							<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
								<div className="flex items-center gap-4">
									<div className="w-14 h-14 bg-gradient-to-br from-sky-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-sky-500/30"><Plane className="h-7 w-7 text-sky-400" /></div>
									<div><div className="flex items-center gap-2"><h3 className="text-xl font-bold text-white">{flight.flightNumber}</h3>{getStatusBadge(flight.status)}</div><p className="text-sm text-slate-400">{flight.aircraftType} • {flight.aircraftRegistration}</p></div>
								</div>
								<div className="flex items-center gap-6">
									<div className="text-center"><p className="text-2xl font-bold text-white">{flight.origin}</p><p className="text-xs text-slate-400">{new Date(flight.scheduledDeparture).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div>
									<div className="flex flex-col items-center"><div className="w-16 h-px bg-slate-600 relative"><Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" /></div></div>
									<div className="text-center"><p className="text-2xl font-bold text-white">{flight.destination}</p><p className="text-xs text-slate-400">{new Date(flight.scheduledArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div>
								</div>
								<div className="flex items-center gap-3">
									{flight.gate && <div className="text-center px-3 py-1 bg-slate-700/50 rounded-lg"><p className="text-xs text-slate-400">Gate</p><p className="text-white font-semibold">{flight.gate}</p></div>}
									<Button size="sm" variant="outline" onClick={() => { setSelectedFlight(flight); setShowDetailDialog(true); }} className="border-slate-700"><Eye className="h-4 w-4" /></Button>
									<Button size="sm" variant="outline" onClick={() => { setSelectedFlight(flight); setEditData({ gate: flight.gate || "", status: flight.status }); setShowEditDialog(true); }} className="border-slate-700"><Edit2 className="h-4 w-4" /></Button>
								</div>
							</div>
							<div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
								{flight.passengerCount && <div className="flex items-center gap-1 text-sm text-slate-400"><Users className="h-4 w-4" />{flight.passengerCount} pax</div>}
								{flight.cargoWeight && <div className="flex items-center gap-1 text-sm text-slate-400"><Package className="h-4 w-4" />{flight.cargoWeight} kg</div>}
							</div>
						</div>
					))}
				</div>
			</div>

			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
					<DialogHeader><DialogTitle>Add Flight</DialogTitle><DialogDescription className="text-slate-400">Add a new flight schedule</DialogDescription></DialogHeader>
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-slate-300">Flight Number *</Label><Input value={formData.flightNumber} onChange={(e) => setFormData((p) => ({ ...p, flightNumber: e.target.value }))} className="bg-slate-800 border-slate-700" /></div><div className="space-y-2"><Label className="text-slate-300">Aircraft</Label><Input value={formData.aircraftType} onChange={(e) => setFormData((p) => ({ ...p, aircraftType: e.target.value }))} className="bg-slate-800 border-slate-700" /></div></div>
						<div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-slate-300">Origin *</Label><Input value={formData.origin} onChange={(e) => setFormData((p) => ({ ...p, origin: e.target.value }))} className="bg-slate-800 border-slate-700" /></div><div className="space-y-2"><Label className="text-slate-300">Destination *</Label><Input value={formData.destination} onChange={(e) => setFormData((p) => ({ ...p, destination: e.target.value }))} className="bg-slate-800 border-slate-700" /></div></div>
						<div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-slate-300">Departure *</Label><Input type="datetime-local" value={formData.scheduledDeparture} onChange={(e) => setFormData((p) => ({ ...p, scheduledDeparture: e.target.value }))} className="bg-slate-800 border-slate-700" /></div><div className="space-y-2"><Label className="text-slate-300">Arrival *</Label><Input type="datetime-local" value={formData.scheduledArrival} onChange={(e) => setFormData((p) => ({ ...p, scheduledArrival: e.target.value }))} className="bg-slate-800 border-slate-700" /></div></div>
						<div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-slate-300">Gate</Label><Input value={formData.gate} onChange={(e) => setFormData((p) => ({ ...p, gate: e.target.value }))} className="bg-slate-800 border-slate-700" /></div><div className="space-y-2"><Label className="text-slate-300">Terminal</Label><Input value={formData.terminal} onChange={(e) => setFormData((p) => ({ ...p, terminal: e.target.value }))} className="bg-slate-800 border-slate-700" /></div></div>
					</div>
					<DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-slate-700 text-slate-300">Cancel</Button><Button onClick={handleCreateFlight} disabled={!formData.flightNumber || !formData.origin || createFlight.isPending} className="bg-sky-500 hover:bg-sky-600">{createFlight.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}Add</Button></DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
					<DialogHeader><DialogTitle className="flex items-center gap-3"><Plane className="h-5 w-5 text-sky-400" />{selectedFlight?.flightNumber}</DialogTitle></DialogHeader>
					{selectedFlight && (<div className="space-y-4 py-4">{getStatusBadge(selectedFlight.status)}<div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between"><div className="text-center"><p className="text-3xl font-bold text-white">{selectedFlight.origin}</p><p className="text-sm text-slate-400">Origin</p></div><Plane className="h-6 w-6 text-sky-400" /><div className="text-center"><p className="text-3xl font-bold text-white">{selectedFlight.destination}</p><p className="text-sm text-slate-400">Destination</p></div></div><div className="grid grid-cols-2 gap-4"><div className="bg-slate-800/50 rounded-lg p-3"><p className="text-slate-400 text-sm">Departure</p><p className="text-white">{new Date(selectedFlight.scheduledDeparture).toLocaleString()}</p></div><div className="bg-slate-800/50 rounded-lg p-3"><p className="text-slate-400 text-sm">Arrival</p><p className="text-white">{new Date(selectedFlight.scheduledArrival).toLocaleString()}</p></div></div></div>)}
					<DialogFooter><Button variant="outline" onClick={() => setShowDetailDialog(false)} className="border-slate-700 text-slate-300">Close</Button></DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm">
					<DialogHeader><DialogTitle>Update Flight</DialogTitle></DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2"><Label className="text-slate-300">Status</Label><Select value={editData.status} onValueChange={(v) => setEditData((p) => ({ ...p, status: v }))}><SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger><SelectContent>{flightStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
						<div className="space-y-2"><Label className="text-slate-300">Gate</Label><Input value={editData.gate} onChange={(e) => setEditData((p) => ({ ...p, gate: e.target.value }))} className="bg-slate-800 border-slate-700" /></div>
					</div>
					<DialogFooter><Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-slate-700 text-slate-300">Cancel</Button><Button onClick={handleUpdateFlight} disabled={updateFlight.isPending} className="bg-sky-500 hover:bg-sky-600">{updateFlight.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Update</Button></DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
