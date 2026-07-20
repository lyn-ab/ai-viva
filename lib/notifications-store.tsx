"use client";
 
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  mockNotifications,
  type AppNotification,
} from "@/lib/mock-data";
 
type NotificationsContextValue = {
  all: AppNotification[];
  markRead: (id: string) => void;
  markAllRead: (role: "teacher" | "student") => void;
  resolveActionRequired: (id: string) => void;
  addNotification: (n: AppNotification) => void;
};
 
const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);
 
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // seeded from the mock layer; local state stands in for the DB until
  // TODO(supabase): replace with a live query + realtime subscription
  const [all, setAll] = useState<AppNotification[]>(mockNotifications);
 
  const markRead = useCallback((id: string) => {
    // TODO(supabase): update notifications set read = true where id = :id
    setAll((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);
 
  const markAllRead = useCallback((role: "teacher" | "student") => {
    // TODO(supabase): update notifications set read = true where for_role = :role
    setAll((prev) =>
      prev.map((n) => (n.forRole === role ? { ...n, read: true } : n))
    );
  }, []);
 
  const resolveActionRequired = useCallback((id: string) => {
    // TODO(supabase): update notifications set action_required = false, read = true where id = :id
    setAll((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true, actionRequired: false } : n
      )
    );
  }, []);
 
  const addNotification = useCallback((n: AppNotification) => {
    // TODO(supabase realtime): this is where an inserted row would arrive
    // via subscription instead of being pushed locally
    setAll((prev) => [n, ...prev]);
  }, []);
 
  const value = useMemo(
    () => ({ all, markRead, markAllRead, resolveActionRequired, addNotification }),
    [all, markRead, markAllRead, resolveActionRequired, addNotification]
  );
 
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
 
export function useNotifications(role: "teacher" | "student") {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
 
  const forRole = useMemo(
    () =>
      ctx.all
        .filter((n) => n.forRole === role)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [ctx.all, role]
  );
 
  const unreadCount = useMemo(
    () => forRole.filter((n) => !n.read).length,
    [forRole]
  );
 
  return {
    notifications: forRole,
    unreadCount,
    markRead: ctx.markRead,
    markAllRead: () => ctx.markAllRead(role),
    resolveActionRequired: ctx.resolveActionRequired,
    addNotification: ctx.addNotification,
  };
}