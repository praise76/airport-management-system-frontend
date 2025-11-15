import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";
import { CommandPalette } from "../components/CommandPalette";
import { AppShell } from "../components/layout/AppShell";
import { Toaster } from "../components/ui/toaster";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import StoreDevtools from "../lib/demo-store-devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "TanStack Start Starter",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	shellComponent: RootDocument,
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

function RootDocument({ children }: { children: React.ReactNode }) {
	const [commandOpen, setCommandOpen] = useState(false);
	const router = useRouterState();

	// Check if we're on an auth route (login/register)
	const isAuthRoute = router.location.pathname.startsWith("/auth");

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-dvh">
				{isAuthRoute ? (
					// Auth routes: no app shell, just the page content
					<div className="min-h-dvh">{children}</div>
				) : (
					// Protected routes: full app shell with navigation
					<AppShell>{children}</AppShell>
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
				<Scripts />
			</body>
		</html>
	);
}
