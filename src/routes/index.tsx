import { createFileRoute } from "@tanstack/react-router";
import { TodayScreen } from "@/features/today/TodayScreen";

// Sign-in is checked for every page in __root.tsx.
export const Route = createFileRoute("/")({
	component: TodayScreen,
});
