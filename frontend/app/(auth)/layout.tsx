import Image from "next/image";

// ─────────────────────────────────────────────────────
//  (auth)/layout.tsx
//  Split-screen layout for login/register.
//  Left side: background image with branding overlay
//  Right side: the actual form (children)
// ─────────────────────────────────────────────────────

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side — background image with overlay */}
      <div className="relative hidden lg:block">
        <Image
          src="/auth-bg.png"
          alt="Toll highway at sunset"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div className="font-heading text-2xl font-semibold tracking-tight">
            Toll Management System
          </div>

          <div className="font-heading space-y-3 max-w-md">
              <h1 className="text-4xl font-semibold leading-tight">
              Smarter highways. Seamless journeys.
            </h1>
            <p className="text-white/70 text-base font-sans">
              Real-time toll monitoring, automated payments, and complete
              control over your highway infrastructure.
            </p>
          </div>

          <p className="text-sm text-white/50 font-sans">
            © {new Date().getFullYear()} Toll Management System. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side — form content */}
      <div className="flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}