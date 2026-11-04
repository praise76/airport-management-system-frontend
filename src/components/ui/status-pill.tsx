import { cn } from "@/lib/utils";
import { label } from "@/lib/labels";
import { Badge } from "./badge";

export type DocumentStatus =
  | "DRAFT"
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export type AttendanceStatus =
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "ABSENT"
  | "ON_LEAVE";

export type CertificationStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "PENDING_REVIEW";

type StatusType =
  | DocumentStatus
  | AttendanceStatus
  | CertificationStatus
  | string;

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<
  string,
  {
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "success"
      | "warning"
      | "info";
    label?: string;
  }
> = {
  // Document statuses
  DRAFT: { variant: "secondary", label: "Draft" },
  PENDING: { variant: "warning", label: "Pending" },
  IN_REVIEW: { variant: "info", label: "In Review" },
  APPROVED: { variant: "success", label: "Approved" },
  REJECTED: { variant: "destructive", label: "Rejected" },
  ARCHIVED: { variant: "secondary", label: "Archived" },

  // Attendance statuses
  CHECKED_IN: { variant: "success", label: "Checked In" },
  clocked_in: { variant: "success", label: "Checked In" },
  CHECKED_OUT: { variant: "secondary", label: "Checked Out" },
  clocked_out: { variant: "secondary", label: "Checked Out" },
  ABSENT: { variant: "destructive", label: "Absent" },
  ON_LEAVE: { variant: "info", label: "On Leave" },
  not_checked_in: { variant: "secondary", label: "Not checked in yet" },
  late_not_checked_in: { variant: "warning", label: "Shift started, not checked in" },

  // Certification statuses
  ACTIVE: { variant: "success", label: "Active" },
  EXPIRING_SOON: { variant: "warning", label: "Expiring Soon" },
  EXPIRED: { variant: "destructive", label: "Expired" },
  PENDING_REVIEW: { variant: "warning", label: "Pending Review" },
};

type Variant = (typeof statusConfig)[string]["variant"];

// Colours for statuses that aren't listed above, matched on words in the status.
// Order matters: "inactive" and "unpaid" must be caught before "active" and "paid".
const TONE_BY_WORD: [RegExp, Variant][] = [
  [/(inactive|offline|archived)/, "secondary"],
  [/(unpaid|not_paid)/, "warning"],
  [/(reject|absent|expired|blacklist|suspend|cancel|fail|critical|overdue|revoked|urgent)/, "destructive"],
  [/high_priority/, "warning"],
  [/(approv|verified|present|active|complete|paid|closed|acknowledg|on_duty|adequate)/, "success"],
  [/(pending|late|review|submitted|waiting|understaff|draft_review|expiring)/, "warning"],
  [/(forward|dispatch|progress|assigned|in_transit|registered|scheduled)/, "info"],
];

export function StatusPill({ status, className }: StatusPillProps) {
  const raw = status == null ? "" : String(status);
  const config =
    statusConfig[raw] ||
    statusConfig[raw.toUpperCase()] || {
      variant:
        TONE_BY_WORD.find(([re]) => re.test(raw.toLowerCase()))?.[1] ??
        ("secondary" as const),
      label: label(raw),
    };

  if (!raw) return null;

  return (
    <Badge variant={config.variant} className={cn("font-medium", className)}>
      {config.label || label(raw)}
    </Badge>
  );
}
