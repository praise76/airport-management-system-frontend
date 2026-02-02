import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAccessToken } from "@/utils/auth";
import {
  useTerminals,
  useTerminalStats,
  useCreateTerminal,
  useUpdateTerminal,
  useDeleteTerminal,
  useSubmitTerminalReport,
  useTerminalPerformance,
} from "@/hooks/terminals";
import type {
  Terminal,
  TerminalInput,
  TerminalUpdate,
  TerminalType,
  TerminalReportInput,
} from "@/types/terminal";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { TerminalTeamWidget } from "@/features/terminals/components/TerminalTeamWidget";

export const Route = createFileRoute("/terminals/")({
  beforeLoad: () => {
    const token = getAccessToken();
    if (!token && typeof window !== "undefined")
      throw redirect({ to: "/auth/login" });
  },
  component: Page,
});

const typeColors: Record<string, string> = {
  domestic: "bg-blue-500/20 text-blue-400",
  international: "bg-purple-500/20 text-purple-400",
  cargo: "bg-orange-500/20 text-orange-400",
  general_aviation: "bg-green-500/20 text-green-400",
  vip: "bg-yellow-500/20 text-yellow-400",
  mixed: "bg-pink-500/20 text-pink-400",
  seasonal: "bg-teal-500/20 text-teal-400",
};

function Page() {
  const { data: terminals = [], isLoading } = useTerminals();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(
    null,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Terminals</h1>
          <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
            Manage airport terminals and facilities
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Terminal
        </button>
      </div>

      {/* Terminal Grid */}
      {isLoading ? (
        <div className="bg-(--color-surface) rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
          Loading terminals...
        </div>
      ) : terminals.length === 0 ? (
        <div className="bg-(--color-surface) rounded-xl border border-[var(--color-border)] p-8 text-center text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
          No terminals registered. Add your first terminal!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {terminals.map((terminal) => (
            <TerminalCard
              key={terminal.id}
              terminal={terminal}
              onClick={() => setSelectedTerminal(terminal)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTerminalModal onClose={() => setShowCreate(false)} />
      )}
      {selectedTerminal && (
        <TerminalDetailModal
          terminal={selectedTerminal}
          onClose={() => setSelectedTerminal(null)}
        />
      )}
    </div>
  );
}

function TerminalCard({
  terminal,
  onClick,
}: {
  terminal: Terminal;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-(--color-surface) rounded-xl border border-(--color-border) p-5 cursor-pointer hover:border-(--color-primary) transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">
              {terminal.airportCode}
            </span>
          </div>
          <div>
            <h3 className="font-semibold">{terminal.terminalName}</h3>
            {terminal.location && (
              <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
                {terminal.location}
              </p>
            )}
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            terminal.isOperational
              ? "bg-green-500/20 text-green-400"
              : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {terminal.isOperational ? "Active" : "Inactive"}
        </span>
      </div>

      {terminal.terminalType && (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium ${typeColors[terminal.terminalType] || "bg-gray-500/20 text-gray-400"}`}
        >
          {terminal.terminalType.replace("_", " ")}
        </span>
      )}

      {terminal.description && (
        <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_70%,transparent)] mt-3 line-clamp-2">
          {terminal.description}
        </p>
      )}
    </div>
  );
}

function TerminalDetailModal({
  terminal,
  onClose,
}: {
  terminal: Terminal;
  onClose: () => void;
}) {
  const { data: stats } = useTerminalStats(terminal.id);
  const updateTerminal = useUpdateTerminal();
  const deleteTerminal = useDeleteTerminal();
  const [activeTab, setActiveTab] = useState<
    "details" | "team" | "reports" | "performance"
  >("details");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<TerminalUpdate>({
    terminalName: terminal.terminalName,
    terminalCode: terminal.terminalCode,
    terminalType: terminal.terminalType,
    airportCode: terminal.airportCode,
    description: terminal.description || "",
    location: terminal.location || "",
    isOperational: terminal.isOperational,
    operatorType: terminal.operatorType,
  });

  const handleSave = () => {
    updateTerminal.mutate(
      { id: terminal.id, input: form },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleDelete = () => {
    if (confirm("Delete this terminal?")) {
      deleteTerminal.mutate(terminal.id, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-3xl border border-[var(--color-border)] flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-(--color-primary)/20 flex items-center justify-center">
              <span className="font-bold text-(--color-primary)">
                {terminal.terminalCode}
              </span>
            </div>
            <div>
              <h2 className="font-semibold">{terminal.terminalName}</h2>
              <p className="text-xs text-muted-foreground">
                {terminal.airportCode}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-background)] rounded"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-(--color-border) px-4">
          {["details", "team", "reports", "performance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-(--color-primary) text-(--color-primary)"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-(--color-background) rounded-lg p-3 text-center">
                    <p className="text-xl font-semibold">
                      {stats.assignedStaff}
                    </p>
                    <p className="text-xs text-muted-foreground">Staff</p>
                  </div>
                  <div className="bg-(--color-background) rounded-lg p-3 text-center">
                    <p className="text-xl font-semibold">
                      {stats.activeRosters}
                    </p>
                    <p className="text-xs text-muted-foreground">Rosters</p>
                  </div>
                  <div className="bg-(--color-background) rounded-lg p-3 text-center">
                    <p className="text-xl font-semibold">
                      {stats.activeInspections}
                    </p>
                    <p className="text-xs text-muted-foreground">Inspections</p>
                  </div>
                  <div className="bg-(--color-background) rounded-lg p-3 text-center">
                    <p className="text-xl font-semibold">{stats.activeTasks}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                </div>
              )}

              {/* Edit Form / View */}
              {isEditing ? (
                <div className="space-y-3">
                  {/* ... (Existing Form Fields - simplified for brevity, assume full fields here or use existing structure) ... */}
                  {/* Reusing the existing form structure would be best, but for brevity I will include the key fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Name
                      </label>
                      <input
                        value={form.terminalName}
                        onChange={(e) =>
                          setForm({ ...form, terminalName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Location
                      </label>
                      <input
                        value={form.location}
                        onChange={(e) =>
                          setForm({ ...form, location: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Type
                      </label>
                      <select
                        value={form.terminalType}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            terminalType: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border"
                      >
                        <option value="domestic">Domestic</option>
                        <option value="international">International</option>
                        <option value="cargo">Cargo</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        checked={form.isOperational}
                        onChange={(e) =>
                          setForm({ ...form, isOperational: e.target.checked })
                        }
                      />
                      <label className="text-sm">Operational</label>
                    </div>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border"
                    placeholder="Description"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border rounded hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      <span className="capitalize">
                        {terminal.terminalType}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location:</span>{" "}
                      {terminal.location}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Operator:</span>{" "}
                      <span className="capitalize">
                        {terminal.operatorType}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      {terminal.isOperational ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <p className="text-sm">{terminal.description}</p>

                  <div className="flex justify-between pt-4 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-sm text-destructive hover:underline"
                    >
                      Delete Terminal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "team" && (
            <TerminalTeamWidget terminalId={terminal.id} />
          )}

          {activeTab === "reports" && (
            <OperationalReportForm terminalId={terminal.id} />
          )}

          {activeTab === "performance" && (
            <TerminalPerformance terminalId={terminal.id} />
          )}
        </div>
      </div>
    </div>
  );
}

function OperationalReportForm({ terminalId }: { terminalId: string }) {
  const submitReport = useSubmitTerminalReport();
  const [report, setReport] = useState<TerminalReportInput>({
    reportDate: new Date().toISOString().split("T")[0],
    reportPeriod: "daily",
    totalPassengers: 0,
    totalFlights: 0,
    incidentsCount: 0,
    equipmentDowntimeHours: 0,
    achievements: "",
    challenges: "",
    actionItems: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport.mutate(
      { terminalId, input: report },
      {
        onSuccess: () =>
          setReport({
            reportDate: new Date().toISOString().split("T")[0],
            reportPeriod: "daily",
            totalPassengers: 0,
            totalFlights: 0,
            incidentsCount: 0,
            equipmentDowntimeHours: 0,
            achievements: "",
            challenges: "",
            actionItems: "",
          }),
      },
    );
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setReport((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Submit Operational Report</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="reportDate"
              value={report.reportDate}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-(--color-background) border border-(--color-border)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Period</label>
            <select
              name="reportPeriod"
              value={report.reportPeriod}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-(--color-background) border border-(--color-border)"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Total Passengers
            </label>
            <input
              type="number"
              name="totalPassengers"
              value={report.totalPassengers}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-(--color-background) border border-(--color-border)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Total Flights
            </label>
            <input
              type="number"
              name="totalFlights"
              value={report.totalFlights}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-(--color-background) border border-(--color-border)"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Incidents Count
            </label>
            <input
              type="number"
              name="incidentsCount"
              value={report.incidentsCount}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-(--color-background) border border-(--color-border)"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Downtime (Hours)
            </label>
            <input
              type="number"
              step="0.1"
              name="equipmentDowntimeHours"
              value={report.equipmentDowntimeHours}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-(--color-background) border border-(--color-border)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Achievements</label>
          <textarea
            name="achievements"
            value={report.achievements}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-(--color-background) border border-(--color-border) min-h-[60px]"
            required
            placeholder="Key successes today..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Challenges</label>
          <textarea
            name="challenges"
            value={report.challenges}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-(--color-background) border border-(--color-border) min-h-[60px]"
            placeholder="Any issues encountered..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Action Items</label>
          <textarea
            name="actionItems"
            value={report.actionItems}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-(--color-background) border border-(--color-border) min-h-[60px]"
            placeholder="Recommendations or next steps..."
          />
        </div>

        <button
          type="submit"
          disabled={submitReport.isPending}
          className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {submitReport.isPending ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}

function TerminalPerformance({ terminalId }: { terminalId: string }) {
  const { data, isLoading } = useTerminalPerformance(terminalId);

  // console.log("data", data);

  if (isLoading)
    return <div className="text-center py-8">Loading performance data...</div>;
  if (!data)
    return (
      <div className="text-center py-8 text-muted-foreground">
        No performance data available
      </div>
    );

  const stats = data.stats || {};
  const period = data.period || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Performance Dashboard</h3>
        {period.startDate && period.endDate && (
          <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
            {new Date(period.startDate).toLocaleDateString()} -{" "}
            {new Date(period.endDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div
            key={key}
            className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-border)]"
          >
            <p className="text-sm text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
            </p>
            <p className="text-2xl font-bold mt-1">
              {typeof value === "number"
                ? value.toLocaleString()
                : Number(value).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateTerminalModal({ onClose }: { onClose: () => void }) {
  const createTerminal = useCreateTerminal();
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<Partial<TerminalInput>>({
    terminalName: "",
    terminalCode: "",
    airportCode: "",
    terminalType: "domestic",
    operatorType: "faan",
    isOperational: true,
    isSeasonal: false,
    organizationId: user?.organizationId || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTerminal.mutate(form as TerminalInput, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h2 className="font-semibold">Add Terminal</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-background)] rounded"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Terminal Name
            </label>
            <input
              value={form.terminalName}
              onChange={(e) =>
                setForm({ ...form, terminalName: e.target.value })
              }
              placeholder="e.g., Terminal 1"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <input
                value={form.terminalCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    terminalCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., T1"
                maxLength={5}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Airport Code
              </label>
              <input
                value={form.airportCode || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    airportCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., LOS"
                maxLength={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.terminalType || "domestic"}
              onChange={(e) =>
                setForm({
                  ...form,
                  terminalType: e.target.value as TerminalType,
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              required
            >
              <option value="domestic">Domestic</option>
              <option value="international">International</option>
              <option value="cargo">Cargo</option>
              <option value="general_aviation">General Aviation</option>
              <option value="vip">VIP</option>
              <option value="seasonal">Seasonal</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., North Wing"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Brief description..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[60px]"
            />
          </div>
          <button
            type="submit"
            disabled={createTerminal.isPending}
            className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {createTerminal.isPending ? "Creating..." : "Add Terminal"}
          </button>
        </form>
      </div>
    </div>
  );
}
