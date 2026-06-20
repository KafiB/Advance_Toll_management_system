import { redirect } from "next/navigation";

// ─────────────────────────────────────────────────────
//  app/page.tsx
//  Root route — redirects to login immediately.
//  Users land here after typing the domain name.
// ─────────────────────────────────────────────────────

export default function RootPage() {
  redirect("/login");
}