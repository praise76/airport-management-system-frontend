import { useState } from "react";
import { useCreateShiftReport } from "@/hooks/shift-reports";
import type { ShiftReportInput } from "@/types/shift-report";
import { Button } from "@/components/ui/button";

interface SubmitShiftReportModalProps {
  onClose: () => void;
}

export function SubmitShiftReportModal({
  onClose,
}: SubmitShiftReportModalProps) {
  const createReport = useCreateShiftReport();
  const [form, setForm] = useState<ShiftReportInput>({
    summary: "",
    passengersProcessed: undefined,
    incidentsCount: 0,
    equipmentStatus: {},
    observations: "",
    challenges: "",
    recommendations: "",
    handoverNotes: "",
    urgentItems: "",
    attachments: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReport.mutate(form, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-2xl border border-[var(--color-border)] max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)] sticky top-0 z-10">
          <h2 className="font-semibold text-lg">Submit Shift Report</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Summary */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Shift Summary *
            </label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[80px]"
              required
              placeholder="Brief summary of your shift..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Passengers Processed
              </label>
              <input
                type="number"
                value={form.passengersProcessed || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    passengersProcessed: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                placeholder="0"
              />
            </div>

            {/* Incidents */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Incidents Count
              </label>
              <input
                type="number"
                value={form.incidentsCount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    incidentsCount: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
              />
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Observations
            </label>
            <textarea
              value={form.observations || ""}
              onChange={(e) =>
                setForm({ ...form, observations: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[60px]"
              placeholder="Any notable observations..."
            />
          </div>

          {/* Challenges */}
          <div>
            <label className="block text-sm font-medium mb-1">Challenges</label>
            <textarea
              value={form.challenges || ""}
              onChange={(e) => setForm({ ...form, challenges: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[60px]"
              placeholder="Issues faced during shift..."
            />
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Recommendations
            </label>
            <textarea
              value={form.recommendations || ""}
              onChange={(e) =>
                setForm({ ...form, recommendations: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[60px]"
              placeholder="Suggestions for improvement..."
            />
          </div>

          {/* Handover Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Handover Notes
            </label>
            <textarea
              value={form.handoverNotes || ""}
              onChange={(e) =>
                setForm({ ...form, handoverNotes: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] min-h-[80px]"
              placeholder="Notes for the next shift..."
            />
          </div>

          {/* Urgent Items */}
          <div>
            <label className="block text-sm font-medium mb-1 text-red-500">
              Urgent Items
            </label>
            <textarea
              value={form.urgentItems || ""}
              onChange={(e) =>
                setForm({ ...form, urgentItems: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-red-200 focus:border-red-500 min-h-[60px]"
              placeholder="Critical items requiring immediate attention..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Skip / Cancel
            </Button>
            <Button
              type="submit"
              disabled={createReport.isPending}
              className="flex-1"
            >
              {createReport.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
