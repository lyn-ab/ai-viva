"use client";
 
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, UserPlus, CalendarCheck, Presentation, UserCheck, FileCheck2, PlayCircle, GraduationCap } from "lucide-react";
import { getCurrentUser, type AppNotification, type NotificationKind } from "@/lib/mock-data";
import { useNotifications } from "@/lib/notifications-store";
 
const KIND_META: Record<NotificationKind, { icon: typeof UserPlus; colorVar: string }> = {
  student_enrolled: { icon: UserPlus, colorVar: "--success" },
  viva_booked: { icon: CalendarCheck, colorVar: "--primary" },
  ready_to_present: { icon: Presentation, colorVar: "--primary" },
  join_request: { icon: UserCheck, colorVar: "--warning" },
  submission_received: { icon: FileCheck2, colorVar: "--success" },
  viva_activated: { icon: PlayCircle, colorVar: "--primary" },
  grade_posted: { icon: GraduationCap, colorVar: "--success" },
};
 
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
 
function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
 
type Filter = "all" | "unread" | "action";
 
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-full border px-2.5 py-1 text-xs text-primary"
          : "rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
      }
      style={
        active ? { backgroundColor: "hsl(var(--primary) / 0.14)" } : undefined
      }
    >
      {label}
    </button>
  );
}
 
function Row({
  n,
  onMarkRead,
  onStartViva,
  onNotYet,
}: {
  n: AppNotification;
  onMarkRead: (id: string) => void;
  onStartViva: (n: AppNotification) => void;
  onNotYet: (n: AppNotification) => void;
}) {
  const meta = KIND_META[n.kind];
  const Icon = meta.icon;
 
  return (
    <div
      className="flex gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-accent"
      style={
        !n.read
          ? { backgroundColor: `hsl(var(${meta.colorVar}) / 0.06)` }
          : undefined
      }
      onClick={() => onMarkRead(n.id)}
      role="button"
    >
      <div className="relative flex-shrink-0">
        {!n.read && (
          <span
            className="absolute -left-2 top-3 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "hsl(var(--primary))" }}
          />
        )}
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            backgroundColor: `hsl(var(${meta.colorVar}) / 0.14)`,
            color: `hsl(var(${meta.colorVar}))`,
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
 
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-foreground">
            {n.title}
          </p>
          <span className="flex-shrink-0 text-xs text-muted-foreground">
            {relativeTime(n.createdAt)}
          </span>
        </div>
        {n.detail && (
          <p className="mt-0.5 text-sm text-muted-foreground">{n.detail}</p>
        )}
 
        {n.kind === "ready_to_present" && n.actionRequired && (
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartViva(n);
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Start viva
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNotYet(n);
              }}
              className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              Not yet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
 
export default function NotificationsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const { notifications, markRead, markAllRead, resolveActionRequired } =
    useNotifications(user.role);
  const [filter, setFilter] = useState<Filter>("all");
 
  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    if (filter === "action")
      return notifications.filter((n) => n.actionRequired);
    return notifications;
  }, [notifications, filter]);
 
  const today = filtered.filter((n) => isToday(n.createdAt));
  const earlier = filtered.filter((n) => !isToday(n.createdAt));
 
  function handleStartViva(n: AppNotification) {
    resolveActionRequired(n.id);
    // TODO(supabase): set viva session active — server-side permission check
    // that the caller is the owning teacher for this vivaSlotId
    router.push("/examination");
  }
 
  function handleNotYet(n: AppNotification) {
    markRead(n.id);
  }
 
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-base font-semibold">Notifications</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates on courses, vivas, and submissions.
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          Mark all read
        </button>
      </div>
 
      <div className="flex gap-2">
        <FilterPill
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterPill
          label="Unread"
          active={filter === "unread"}
          onClick={() => setFilter("unread")}
        />
        <FilterPill
          label="Action required"
          active={filter === "action"}
          onClick={() => setFilter("action")}
        />
      </div>
 
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nothing here.
          </p>
        ) : (
          <div className="space-y-4">
            {today.length > 0 && (
              <div>
                <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Today
                </p>
                <div className="space-y-1">
                  {today.map((n) => (
                    <Row
                      key={n.id}
                      n={n}
                      onMarkRead={markRead}
                      onStartViva={handleStartViva}
                      onNotYet={handleNotYet}
                    />
                  ))}
                </div>
              </div>
            )}
            {earlier.length > 0 && (
              <div>
                <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Earlier
                </p>
                <div className="space-y-1">
                  {earlier.map((n) => (
                    <Row
                      key={n.id}
                      n={n}
                      onMarkRead={markRead}
                      onStartViva={handleStartViva}
                      onNotYet={handleNotYet}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}