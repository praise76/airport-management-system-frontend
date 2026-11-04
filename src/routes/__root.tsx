import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { isStakeholderUser } from "@/lib/access";
import { useAuthStore } from "@/stores/auth";
import { getAccessToken } from "@/utils/auth";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";
import { CommandPalette } from "../components/CommandPalette";
import { AppShell } from "../components/layout/AppShell";
import { Toaster } from "../components/ui/toaster";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

interface MyRouterContext {
  queryClient: QueryClient;
}

// Pages anyone can open without signing in.
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/stakeholder/login",
  "/stakeholder/forgot-password",
  "/stakeholder/reset-password",
  "/stakeholder/register",
  "/stakeholder/registration-success",
  "/public/",
];

const isPublicPath = (path: string) =>
  PUBLIC_PATHS.some((p) => path === p || path.startsWith(p));

// The external stakeholder portal lives under /stakeholder (singular).
// /stakeholders (plural) is the internal FAAN admin area for managing them.
const isPortalPath = (path: string) =>
  path === "/stakeholder" || path.startsWith("/stakeholder/");

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const path = location.pathname;
    if (isPublicPath(path)) return;

    const user = useAuthStore.getState().user;
    if (!getAccessToken() || !user) {
      throw redirect({
        to: isPortalPath(path) ? "/stakeholder/login" : "/auth/login",
      });
    }
    // Keep the two apps apart: portal users stay in the portal, staff stay in the staff app.
    if (isStakeholderUser(user) && !isPortalPath(path)) {
      throw redirect({ to: "/stakeholder/dashboard" });
    }
    if (!isStakeholderUser(user) && isPortalPath(path)) {
      throw redirect({ to: "/" });
    }
  },
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

  // Check if this is an auth route or a stakeholder portal route
  // Note: '/stakeholders' (plural) is for admin access and should use AppShell
  // '/stakeholder' (singular) is for the external portal and handles its own layout
  // The public duty board is shown on terminal screens, so it has no staff menu either.
  const path = router.location.pathname;
  const isNoShellRoute =
    path.startsWith("/auth") || path.startsWith("/public") || isPortalPath(path);

  return (
    <>
      {isNoShellRoute ? (
        // Routes without AppShell (Auth & External Portal)
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
          TanStackQueryDevtools,
        ]}
      />
    </>
  );
}
