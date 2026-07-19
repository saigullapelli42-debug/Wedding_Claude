import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "../components/ui/sonner";
import { supabase } from "../lib/supabase";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold gold-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center rounded-full gold-gradient text-white px-6 py-2 text-sm font-medium"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-full gold-gradient text-white px-6 py-2 text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sai & Priya · Our Wedding · 15 December 2026" },
      {
        name: "description",
        content:
          "Together with our families, we invite you to celebrate the wedding of Sai and Priya on 15 December 2026.",
      },
      { property: "og:title", content: "Sai & Priya · Our Wedding" },
      { property: "og:description", content: "Join us as we say 'I do' on 15 December 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Apply a custom favicon set in the admin panel, if any, without needing a server round-trip.
    (async () => {
      try {
        const { data } = await supabase.from("site_settings").select("favicon_url").single();
        if (!data?.favicon_url) return;
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = data.favicon_url;
      } catch {
        // Non-fatal: keep the default favicon.png if this fails for any reason.
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
