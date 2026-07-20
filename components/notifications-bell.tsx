"use client";
 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useNotifications } from "@/lib/notifications-store";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { ReadyToPresentToast } from "@/components/ready-to-present-toast";
import type { AppNotification } from "@/lib/mock-data";
 
export function NotificationsBell({
  role,
}: {
  role: "teacher" | "student";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toastNotification, setToastNotification] =
    useState<AppNotification | null>(null);
 
  const { notifications, unreadCount, markRead, markAllRead, resolveActionRequired } =
    useNotifications(role);
 
  // TODO(supabase realtime): subscribe to ready_to_present inserts for this
  // teacher's sections and call setToastNotification(newRow) on arrival.
  // For this prototype, surface the toast for the newest unresolved
  // ready_to_present notification a few seconds after mount, once.
  useEffect(() => {
    if (role !== "teacher") return;
    const pending = notifications.find(
      (n) => n.kind === "ready_to_present" && n.actionRequired
    );
    if (!pending) return;
 
    const t = setTimeout(() => setToastNotification(pending), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);
 
  function handleStartViva(n: AppNotification) {
    resolveActionRequired(n.id);
    setToastNotification(null);
    setOpen(false);
    // TODO(supabase): set viva session active — server-side permission check
    // that the caller is the owning teacher for this vivaSlotId
    router.push("/examination");
  }
 
  function handleNotYet(n: AppNotification) {
    markRead(n.id);
    setToastNotification(null);
  }
 
  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full"
            style={{ backgroundColor: "hsl(var(--destructive))" }}
          />
        )}
      </button>
 
      {open && (
        <NotificationsDropdown
          notifications={notifications}
          onClose={() => setOpen(false)}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onStartViva={handleStartViva}
          onNotYet={handleNotYet}
        />
      )}
 
      {toastNotification && (
        <ReadyToPresentToast
          notification={toastNotification}
          onStartViva={handleStartViva}
          onDismiss={() => {
            markRead(toastNotification.id);
            setToastNotification(null);
          }}
        />
      )}
    </div>
  );
}
 