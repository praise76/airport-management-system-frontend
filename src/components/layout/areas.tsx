import {
	CalendarRange,
	ClipboardList,
	FileText,
	IdCard,
	Receipt,
	Users,
} from "lucide-react";
import { AreaTabs } from "./AreaTabs";

/** Documents: letters and memos, and companies' permit applications. */
export const DocumentsTabs = () => (
	<AreaTabs
		label="Documents"
		tabs={[
			{ to: "/documents", label: "Documents", icon: FileText },
			{
				to: "/stakeholders/permits",
				label: "Permit applications",
				icon: IdCard,
			},
		]}
	/>
);

/** Tasks: the day's work, including companies' requests and invoices waiting with my office. */
export const TasksTabs = () => (
	<AreaTabs
		label="Tasks"
		tabs={[
			{ to: "/tasks", label: "My tasks", icon: ClipboardList },
			{
				to: "/stakeholders/activities",
				label: "Requests with my office",
				icon: ClipboardList,
			},
			{
				to: "/stakeholders/invoices",
				label: "Invoices with my office",
				icon: Receipt,
			},
		]}
	/>
);

/** Roster: rosters, and the patterns and teams they are built from. */
export const RosterTabs = () => (
	<AreaTabs
		label="Roster"
		tabs={[
			{ to: "/admin/roster/planner", label: "Rosters", icon: CalendarRange },
			{ to: "/roster/patterns", label: "Patterns & teams", icon: Users },
		]}
	/>
);
