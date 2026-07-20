"use client";
 
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  CalendarCheck,
  Presentation,
  UserCheck,
  FileCheck2,
  PlayCircle,
  GraduationCap,
} from "lucide-react";
import type { AppNotification, NotificationKind } from "@/lib/mock-data";
 
// icon + tint per notification kind — tints reference design tokens only
const KIND_META: Record<
  NotificationKind,
  { icon: typeof UserPlus; colorVar: string }
> = {
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
 
function NotificationRow({
  n,
  onMarkRead,
  onStartViva,
  onNotYet,
}: {
  n: AppNotification;
  onMarkRead: (id: string) => void;
  onStartViva?: (n: AppNotification) => void;
  onNotYet?: (n: AppNotification) => void;
}) {
  const meta = KIND_META[n.kind];
  const Icon = meta.icon;
 
  return (
    <div
      className="flex gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent"
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
            className="absolute -left-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "hsl(var(--primary))" }}
          />
        )}
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{
            backgroundColor: `hsl(var(${meta.colorVar}) / 0.14)`,
            color: `hsl(var(${meta.colorVar}))`,
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
 
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug text-foreground">
          {n.title}
        </p>
        {n.detail && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {n.detail}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {relativeTime(n.createdAt)}
        </p>
 
        {n.kind === "ready_to_present" && n.actionRequired && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartViva?.(n);
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Start viva
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNotYet?.(n);
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
 
export function NotificationsDropdown({
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onStartViva,
  onNotYet,
}: {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onStartViva?: (n: AppNotification) => void;
  onNotYet?: (n: AppNotification) => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
 
  // click-outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);
 
  const recent = notifications.slice(0, 5);
 
  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-card p-3 shadow-lg sm:w-96"
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-sm font-semibold text-foreground">
          Notifications
        </h3>
        <button
          onClick={onMarkAllRead}
          className="text-xs font-medium text-primary hover:underline"
        >
          Mark all read
        </button>
      </div>
 
      <div className="space-y-1">
        {recent.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          recent.map((n) => (
            <NotificationRow
              key={n.id}
              n={n}
              onMarkRead={onMarkRead}
              onStartViva={onStartViva}
              onNotYet={onNotYet}
            />
          ))
        )}
      </div>
 
      <div className="mt-2 border-t border-border pt-2">
        <button
          onClick={() => {
            onClose();
            router.push("/notifications");
          }}
          className="block w-full rounded-lg py-1.5 text-center text-xs font-medium text-primary hover:bg-accent"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}