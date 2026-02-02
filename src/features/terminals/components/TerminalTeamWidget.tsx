import {
  useTerminalRepresentatives,
  useAddTerminalRepresentative,
  useRemoveTerminalRepresentative,
} from "@/hooks/terminals";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TerminalTeamWidgetProps {
  terminalId: string;
}

export function TerminalTeamWidget({ terminalId }: TerminalTeamWidgetProps) {
  const { data: representatives, isLoading } =
    useTerminalRepresentatives(terminalId);
  const addRep = useAddTerminalRepresentative();
  const removeRep = useRemoveTerminalRepresentative();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    userId: "", // simplified: typically a user select
    departmentId: "", // simplified: typically a dept select
    role: "",
    isPrimary: false,
  });

  // Mock implementation for adding - normally would select existing user
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, validating IDs is key. Here assuming IDs are manually entered or mocked.
    addRep.mutate(
      {
        terminalId,
        input: {
          ...form,
          userId: form.userId || "mock-user-id",
          departmentId: form.departmentId || "mock-dept-id",
        },
      },
      {
        onSuccess: () => {
          setShowAdd(false);
          setForm({ userId: "", departmentId: "", role: "", isPrimary: false });
        },
      },
    );
  };

  const handleRemove = (id: string) => {
    if (confirm("Remove this representative?")) {
      removeRep.mutate(id);
    }
  };

  if (isLoading)
    return (
      <div className="text-sm text-muted-foreground p-4">Loading team...</div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Terminal Team</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? "Cancel" : "Add Member"}
        </Button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="space-y-3 p-3 bg-muted/30 rounded-lg border"
        >
          <div>
            <input
              placeholder="User ID (Mock)"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded"
            />
          </div>
          <div>
            <input
              placeholder="Department ID (Mock)"
              value={form.departmentId}
              onChange={(e) =>
                setForm({ ...form, departmentId: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border rounded"
            />
          </div>
          <div>
            <input
              placeholder="Role (e.g. Supervisor)"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={form.isPrimary}
              onChange={(e) =>
                setForm({ ...form, isPrimary: e.target.checked })
              }
            />
            <label htmlFor="isPrimary" className="text-sm">
              Primary Contact
            </label>
          </div>
          <Button type="submit" size="sm" disabled={addRep.isPending}>
            Save
          </Button>
        </form>
      )}

      <div className="space-y-2">
        {representatives?.map((rep) => (
          <div
            key={rep.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-[var(--color-surface)]"
          >
            <div>
              <div className="font-medium text-sm">
                {rep.user?.firstName} {rep.user?.lastName}
                {rep.isPrimary && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 rounded">
                    Primary
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {rep.role} • {rep.department?.name}
              </div>
            </div>
            <button
              onClick={() => handleRemove(rep.id)}
              className="text-red-400 hover:text-red-600 p-1"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}

        {!representatives?.length && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No representatives assigned
          </div>
        )}
      </div>
    </div>
  );
}
