"use client";
 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Presentation, X } from "lucide-react";
import type { AppNotification } from "@/lib/mock-data";
 
export function ReadyToPresentToast({
  notification,
  onStartViva,
  onDismiss,
}: {
  notification: AppNotification;
  onStartViva: (n: AppNotification) => void;
  onDismiss: (id: string) => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
 
  // slide-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);
 
  function handleDismiss() {
    setVisible(false);
    // let the exit transition play before removing from state
    setTimeout(() => onDismiss(notification.id), 200);
  }
 
  function handleStart() {
    onStartViva(notification);
    // TODO(supabase): set viva session active — server-side permission check
    // that the caller is the owning teacher for this vivaSlotId
    router.push("/examination");
  }
 
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] w-80 rounded-xl border bg-card p-4 shadow-lg transition-all duration-200 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: "hsl(var(--primary) / 0.14)",
            color: "hsl(var(--primary))",
          }}
        >
          <Presentation className="h-4 w-4" />
        </span>
 
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-foreground">
            {notification.title}
          </p>
          {notification.detail && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {notification.detail}
            </p>
          )}
 
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleStart}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Start viva
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              Dismiss
            </button>
          </div>
        </div>
 
        <button
          aria-label="Dismiss"
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}