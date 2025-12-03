import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";
import { CommandPalette } from "../components/CommandPalette";
import { AppShell } from "../components/layout/AppShell";
import { Toaster } from "../components/ui/toaster";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import StoreDevtools from "../lib/demo-store-devtools";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
	errorComponent: ({ error }) => {
		return (
			<div className="p-6">
				<h1 className="text-xl font-semibold">Something went wrong</h1>
				<p className="text-sm opacity-70 mt-1">
					{(error as any)?.message ?? "An unknown error occurred."}
				</p>
			</div>
		);
	},
});

function RootComponent() {
	const [commandOpen, setCommandOpen] = useState(false);
	const router = useRouterState();

	// Check if we're on an auth route (login/register)
	const isAuthRoute = router.location.pathname.startsWith("/auth");

	return (
		<>
			{isAuthRoute ? (
				// Auth routes: no app shell, just the page content
				<div className="min-h-dvh">
					<Outlet />
				</div>
			) : (
				// Protected routes: full app shell with navigation
				<AppShell>
					<Outlet />
				</AppShell>
			)}
			<Toaster richColors position="top-right" />
			<CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					StoreDevtools,
					TanStackQueryDevtools,
				]}
			/>
		</>
	);
}
