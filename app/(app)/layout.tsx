"use client";

// app/(app)/layout.tsx
// The SHELL. Every page inside app/(app)/ renders inside this frame, so the
// sidebar + top nav are guaranteed consistent across the whole app.
// Build this first, then fill in the individual pages.
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  ClipboardCheck,
  Camera,
  Bot,
  BookOpen,
} from "lucide-react";
import { getCurrentUser } from "@/lib/mock-data";
import { NotificationsProvider } from "@/lib/notifications-store";
import { NotificationsBell } from "@/components/notifications-bell";

function initials(name: string) {
    const parts = name.replace(/^Dr\.\s*/, "").trim().split(" ");
    return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }
  
// Top-nav items, gated by role. Add/remove freely.
const TEACHER_NAV = [
  { href: "/dashboard", label: "Instructor Dashboard", icon: LayoutDashboard },
  { href: "/scheduling", label: "Viva Scheduling", icon: CalendarClock },
  { href: "/review", label: "Review Results", icon: ClipboardCheck },
];

const STUDENT_NAV = [
  { href: "/dashboard", label: "Student Portal", icon: LayoutDashboard },
  { href: "/camera", label: "Camera Test", icon: Camera },
  { href: "/examination", label: "AI Examination", icon: Bot },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser(); // ← swap the return in mock-data.ts to test roles
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const nav = user.role === "teacher" ? TEACHER_NAV : STUDENT_NAV;

  return (
    <NotificationsProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* ---- LEFT SIDEBAR (dark navy) ---- */}
        <aside
          className="hidden w-64 shrink-0 flex-col p-4 md:flex"
          style={{
            background: "hsl(var(--sidebar))",
            color: "hsl(var(--sidebar-foreground))",
            borderRight: "1px solid hsl(var(--sidebar-border))",
          }}
        >
          <div className="mb-8 flex items-center gap-2 px-2 pt-2">
            <BookOpen className="h-6 w-6" />
            <span className="text-lg font-semibold text-white">AI Viva</span>
          </div>

          <div
            className="px-2 pb-2 text-xs font-medium uppercase tracking-wider"
            style={{ color: "hsl(var(--sidebar-foreground) / 0.6)" }}
          >
            {user.role === "teacher" ? "Teaching" : "My Work"}
          </div>

          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                  style={
                    active
                      ? {
                          background: "hsl(var(--sidebar-accent))",
                          color: "hsl(var(--sidebar-accent-foreground))",
                        }
                      : undefined
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-2 pt-4 text-xs" style={{ color: "hsl(var(--sidebar-foreground) / 0.6)" }}>
            {user.fullName}
            <br />
            {user.role === "teacher" ? "Instructor" : `ID: ${user.institutionId}`}
          </div>
        </aside>

        {/* ---- MAIN COLUMN ---- */}
        <div className="flex flex-1 flex-col">
          {/* top utility bar */}
          <header className="flex items-center justify-end gap-1 border-b border-border bg-card px-6 py-3">
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <NotificationsBell role={user.role} />

            <button
              aria-label="Settings"
              onClick={() => router.push("/settings")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
            </button>

            <button className="ml-2 flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-accent">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-primary" style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}>
                {initials(user.fullName)}
              </span>
              <span className="hidden text-sm font-medium sm:block">{user.fullName}</span>
            </button>
          </header>

          {/* the actual page renders here */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </NotificationsProvider>
  );
}