"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// ─────────────────────────────────────────────────────
//  theme-provider.tsx
//  Enables dark mode / light mode switching.
//  Wraps the app so any component can call
//  useTheme() to read or change the theme.
// ─────────────────────────────────────────────────────

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}