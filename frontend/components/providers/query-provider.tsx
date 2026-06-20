"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// ─────────────────────────────────────────────────────
//  query-provider.tsx
//  Wraps the entire app so any component can use
//  useQuery / useMutation to talk to your backend.
//
//  Why "use client"?
//  React Query needs browser state (cache, refetching)
//  so this must run on the client, not the server.
//
//  useState for QueryClient:
//  Ensures each user gets their OWN cache instance —
//  prevents data leaking between different users
//  on server-rendered pages.
// ─────────────────────────────────────────────────────

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch immediately when window regains focus
            // Prevents annoying refetches when switching tabs
            refetchOnWindowFocus: false,

            // Cache data for 1 minute before considering it stale
            staleTime: 60 * 1000,

            // Retry failed requests once
            retry: 1,
          },
          mutations: {
            // Don't retry mutations automatically —
            // e.g. don't accidentally double-submit a payment
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only show in development, hidden in production */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}