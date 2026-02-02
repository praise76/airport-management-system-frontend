import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAccessToken } from "@/utils/auth";
import {
  useGeofenceZones,
  useCreateGeofenceZone,
  useUpdateGeofenceZone,
  useDeleteGeofenceZone,
} from "@/hooks/attendance";
import type { GeofenceZone } from "@/types/attendance";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  X,
  MapPin,
  Circle as CircleIcon,
  Pentagon,
  Settings,
  ChevronRight,
  Map as MapIcon,
} from "lucide-react";

export const Route = createFileRoute("/geofence/")({
  beforeLoad: () => {
    const token = getAccessToken();
    if (!token && typeof window !== "undefined")
      throw redirect({ to: "/auth/login" });
  },
  component: Page,
});

const zoneTypeColors: Record<string, string> = {
  office: "bg-indigo-500/10 text-indigo-500",
  terminal: "bg-purple-500/10 text-purple-500",
  restricted: "bg-rose-500/10 text-rose-500",
  parking: "bg-emerald-500/10 text-emerald-500",
  work: "bg-amber-500/10 text-amber-500",
};

function Page() {
  const { data: zones, isLoading } = useGeofenceZones();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedZone, setSelectedZone] = useState<GeofenceZone | null>(null);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Spatial Management
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            Configure precision circular and polygonal geofence zones for
            attendance tracking.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-primary hover:opacity-90 shadow-lg shadow-primary/20 h-11 px-6 gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Zone
        </Button>
      </div>

      {/* Modern Stats / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Zones",
            val: zones?.length ?? 0,
            icon: <MapPin className="text-indigo-500" />,
          },
          {
            label: "Active",
            val: zones?.filter((z) => z.isActive).length ?? 0,
            icon: <ActivityIcon className="text-emerald-500" />,
          },
          {
            label: "Circular",
            val: zones?.filter((z) => z.type === "circle").length ?? 0,
            icon: <CircleIcon className="text-amber-500" />,
          },
          {
            label: "Polygonal",
            val: zones?.filter((z) => z.type === "polygon").length ?? 0,
            icon: <Pentagon className="text-purple-500" />,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-surface rounded-2xl border p-6 flex items-center gap-4 transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.val}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* High-End List UI */}
      <div className="bg-surface rounded-2xl border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground italic flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Determining spatial boundaries...
          </div>
        ) : zones?.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MapIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Geofences Defined</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
              You haven't created any spatial tracking zones yet. Start by
              defining your first operational area.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowCreate(true)}
              className="mt-6"
            >
              Establish First Zone
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {zones?.map((zone) => (
              <div
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className="group flex items-center p-5 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center mr-5 ${zoneTypeColors[zone.zoneType]}`}
                >
                  {zone.type === "circle" ? (
                    <CircleIcon className="w-6 h-6" />
                  ) : (
                    <Pentagon className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg leading-none">
                      {zone.name}
                    </h3>
                    <Badge
                      variant={zone.isActive ? "default" : "secondary"}
                      className="h-5 px-2 text-[10px] font-bold tracking-wider"
                    >
                      {zone.isActive ? "Active" : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Settings className="w-3.5 h-3.5" />
                      {zone.zoneType.charAt(0).toUpperCase() +
                        zone.zoneType.slice(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {zone.type === "circle"
                        ? `R: ${zone.radius}m`
                        : `${zone.polygonJson?.coordinates?.[0]?.length || 0} vertices`}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateZoneModal onClose={() => setShowCreate(false)} />}
      {selectedZone && (
        <ZoneDetailModal
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function ZoneDetailModal({
  zone,
  onClose,
}: {
  zone: GeofenceZone;
  onClose: () => void;
}) {
  const updateZone = useUpdateGeofenceZone();
  const deleteZone = useDeleteGeofenceZone();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: zone.name,
    description: zone.description || "",
    zoneType: zone.zoneType,
    type: zone.type,
    latitude: zone.latitude || 0,
    longitude: zone.longitude || 0,
    radius: zone.radius || 0,
    isActive: zone.isActive,
  });

  const handleSave = () => {
    updateZone.mutate(
      { id: zone.id, data: form },
      {
        onSuccess: () => {
          setIsEditing(false);
          onClose();
        },
      },
    );
  };

  const handleDelete = () => {
    if (
      confirm("Permanently decommission this geofence? This cannot be undone.")
    ) {
      deleteZone.mutate(zone.id, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-xl border shadow-2xl overflow-hidden text-(--color-text)">
        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-4">
            <div
              className={`p-2.5 rounded-xl ${zoneTypeColors[zone.zoneType]}`}
            >
              {zone.type === "circle" ? (
                <CircleIcon className="w-6 h-6" />
              ) : (
                <Pentagon className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{zone.name}</h2>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
                {zone.type} zone
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 block">
                  Display Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 block">
                  Categorization
                </label>
                <select
                  value={form.zoneType}
                  onChange={(e) =>
                    setForm({ ...form, zoneType: e.target.value as any })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-muted border-none cursor-pointer"
                >
                  <option value="office">Office</option>
                  <option value="terminal">Terminal</option>
                  <option value="restricted">Restricted Area</option>
                  <option value="parking">Parking Area</option>
                  <option value="work">Operational Post</option>
                </select>
              </div>

              {form.type === "circle" && (
                <>
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 block">
                        Center Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            latitude: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-muted border-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 block">
                        Center Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            longitude: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-muted border-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2 block">
                      Radius (m)
                    </label>
                    <input
                      type="number"
                      value={form.radius}
                      onChange={(e) =>
                        setForm({ ...form, radius: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-muted border-none"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2 bg-muted p-4 rounded-xl flex items-center justify-between">
                <span className="font-semibold text-sm">
                  Operational Status
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="md:col-span-2 flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-6 rounded-2xl"
                >
                  Abort Adjustments
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateZone.isPending}
                  className="flex-1 py-6 rounded-2xl shadow-lg shadow-primary/20 bg-(--color-primary) text-white"
                >
                  {updateZone.isPending ? "Syncing..." : "Publish Update"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                    Type & Category
                  </p>
                  <p className="text-lg font-bold capitalize">
                    {zone.zoneType} • {zone.type}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                    Coverage
                  </p>
                  <p className="text-lg font-bold">
                    {zone.type === "circle"
                      ? `${zone.radius}m Radius`
                      : `${zone.polygonJson?.coordinates?.[0]?.length || 0} Points`}
                  </p>
                </div>
              </div>

              {zone.type === "circle" && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                    Geolocation Center
                  </p>
                  <div className="bg-muted p-4 rounded-2xl font-mono text-sm grid grid-cols-2 gap-4">
                    <div>
                      <span className="opacity-50 mr-2">LAT:</span>
                      {zone?.latitude}
                    </div>
                    <div>
                      <span className="opacity-50 mr-2">LNG:</span>
                      {zone?.longitude}
                    </div>
                  </div>
                </div>
              )}

              {zone.description && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                    Operational Intelligence
                  </p>
                  <p className="text-sm bg-muted p-5 rounded-2xl text-muted-foreground leading-relaxed">
                    {zone.description}
                  </p>
                </div>
              )}

              <Button
                onClick={() => setIsEditing(true)}
                className="w-full py-7 rounded-2xl gap-2 shadow-sm border"
              >
                <Settings className="w-5 h-5" />
                Enter Modification Mode
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateZoneModal({ onClose }: { onClose: () => void }) {
  const createZone = useCreateGeofenceZone();
  const [form, setForm] = useState({
    name: "",
    description: "",
    zoneType: "work" as any,
    type: "circle" as "circle" | "polygon",
    latitude: "" as string | number,
    longitude: "" as string | number,
    radius: "" as string | number,
    polygonJson: { type: "Polygon", coordinates: [[]] as any },
    organizationId: "",
  });

  const [vertices, setVertices] = useState<{ lat: number; lng: number }[]>([]);
  const [vInput, setVInput] = useState({ lat: "", lng: "" });

  const addVertex = () => {
    const lat = parseFloat(vInput.lat);
    const lng = parseFloat(vInput.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setVertices([...vertices, { lat, lng }]);
      setVInput({ lat: "", lng: "" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      name: form.name,
      description: form.description,
      zoneType: form.zoneType,
      type: form.type,
      isActive: true,
    };

    if (form.type === "circle") {
      payload.latitude = parseFloat(form.latitude as string);
      payload.longitude = parseFloat(form.longitude as string);
      payload.radius = parseInt(form.radius as string);
    } else {
      payload.polygonJson = {
        type: "Polygon",
        coordinates: [vertices.map((v) => [v.lng, v.lat])], // GeoJSON is [LNG, LAT]
      };
    }

    createZone.mutate(payload, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-3xl w-full max-w-2xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-(--color-text)">
        <div className="p-8 border-b flex justify-between items-center bg-muted/40">
          <div>
            <h2 className="text-2xl font-bold">New Operational Perimeter</h2>
            <p className="text-sm text-muted-foreground">
              Define a new physical zone for location tracking.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto">
          {/* Spatial Mode Selector */}
          <div className="flex p-1 bg-muted rounded-2xl">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "circle" })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${form.type === "circle" ? "bg-surface shadow-sm font-bold" : "text-muted-foreground"}`}
            >
              <CircleIcon className="w-4 h-4" /> Circular
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "polygon" })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${form.type === "polygon" ? "bg-surface shadow-sm font-bold" : "text-muted-foreground"}`}
            >
              <Pentagon className="w-4 h-4" /> Polygonal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Zone Designation
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Terminal 1 North Gate"
                className="w-full px-5 py-4 rounded-2xl bg-muted border-none ring-offset-background placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary h-14"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Category
              </label>
              <select
                value={form.zoneType}
                onChange={(e) =>
                  setForm({ ...form, zoneType: e.target.value as any })
                }
                className="w-full px-5 py-4 rounded-2xl bg-muted border-none h-14"
              >
                <option value="work">Work Post</option>
                <option value="terminal">Airport Terminal</option>
                <option value="office">Staff Office</option>
                <option value="restricted">Restricted Area</option>
                <option value="parking">Vehicle Parking</option>
              </select>
            </div>

            {form.type === "circle" ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Detection Radius (m)
                  </label>
                  <input
                    required
                    type="number"
                    value={form.radius}
                    onChange={(e) =>
                      setForm({ ...form, radius: e.target.value })
                    }
                    placeholder="e.g. 50"
                    className="w-full px-5 py-4 rounded-2xl bg-muted border-none h-14"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Latitude
                  </label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) =>
                      setForm({ ...form, latitude: e.target.value })
                    }
                    placeholder="6.5779"
                    className="w-full px-5 py-4 rounded-2xl bg-muted border-none h-14"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Longitude
                  </label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) =>
                      setForm({ ...form, longitude: e.target.value })
                    }
                    placeholder="3.3215"
                    className="w-full px-5 py-4 rounded-2xl bg-muted border-none h-14"
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-2 space-y-4 bg-muted p-6 rounded-3xl">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Boundary Vertices
                </p>
                <div className="flex gap-2 text-black">
                  <input
                    type="number"
                    step="any"
                    placeholder="LAT"
                    value={vInput.lat}
                    onChange={(e) =>
                      setVInput({ ...vInput, lat: e.target.value })
                    }
                    className="flex-1 bg-surface border-none rounded-xl px-3 py-3"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="LNG"
                    value={vInput.lng}
                    onChange={(e) =>
                      setVInput({ ...vInput, lng: e.target.value })
                    }
                    className="flex-1 bg-surface border-none rounded-xl px-3 py-3"
                  />
                  <Button
                    type="button"
                    onClick={addVertex}
                    className="rounded-xl px-5 h-11"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-12 items-center">
                  {vertices.map((v, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="pl-3 pr-1 py-1 gap-2 rounded-lg border-none"
                    >
                      ({v.lat.toFixed(4)}, {v.lng.toFixed(4)})
                      <button
                        onClick={() =>
                          setVertices(vertices.filter((_, idx) => idx !== i))
                        }
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {vertices.length === 0 && (
                    <span className="text-xs text-muted-foreground/70 italic">
                      At least 3 points required for polygons.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={createZone.isPending}
            className="w-full py-8 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 bg-(--color-primary) text-white h-14"
          >
            {createZone.isPending
              ? "Syncing Perimeter..."
              : "Establish Geofence Zone"}
          </Button>
        </form>
      </div>
    </div>
  );
}
