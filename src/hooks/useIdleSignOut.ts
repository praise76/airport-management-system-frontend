import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { isStakeholderUser } from "@/lib/access";
import {
	IDLE_LIMIT_MS,
	IDLE_SIGNED_OUT_MESSAGE,
	idleApplies,
	isIdle,
	readLastActivity,
	signInPathFor,
	writeLastActivity,
} from "@/lib/idle";
import { useAuthStore } from "@/stores/auth";

const ACTIVITY_EVENTS = [
	"pointerdown",
	"keydown",
	"wheel",
	"touchstart",
	"scroll",
] as const;
/** Write the activity time at most this often, so scrolling doesn't hammer storage. */
const WRITE_EVERY_MS = 15_000;
const CHECK_EVERY_MS = 30_000;

/**
 * Signs the person out after IDLE_LIMIT_MS without a click, key, scroll or touch, in the staff app
 * and the partner portal alike. The server's own token expiry is a separate, longer limit.
 */
export function useIdleSignOut(limit = IDLE_LIMIT_MS) {
	const user = useAuthStore((s) => s.user);
	const navigate = useNavigate();
	const path = useRouterState({ select: (s) => s.location.pathname });
	const active = !!user && idleApplies(path);

	useEffect(() => {
		if (!active || typeof window === "undefined") return;
		const storage = window.localStorage;
		let lastWrite = 0;

		const signOut = () => {
			const portal = isStakeholderUser(useAuthStore.getState().user);
			for (const key of [
				"stakeholder_token",
				"stakeholder_user",
				"stakeholder_org",
			])
				storage.removeItem(key);
			useAuthStore.getState().logout();
			toast.info(IDLE_SIGNED_OUT_MESSAGE, { duration: 10_000 });
			navigate({ to: signInPathFor(window.location.pathname, portal) });
		};

		// Reopened after the limit: sign out straight away.
		if (isIdle(readLastActivity(storage), Date.now(), limit)) {
			signOut();
			return;
		}

		const touch = () => {
			const now = Date.now();
			if (now - lastWrite < WRITE_EVERY_MS) return;
			lastWrite = now;
			writeLastActivity(storage, now);
		};
		touch();

		for (const e of ACTIVITY_EVENTS)
			window.addEventListener(e, touch, { passive: true });
		const timer = window.setInterval(() => {
			if (isIdle(readLastActivity(storage), Date.now(), limit)) signOut();
		}, CHECK_EVERY_MS);

		return () => {
			for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, touch);
			window.clearInterval(timer);
		};
	}, [active, limit, navigate]);
}
