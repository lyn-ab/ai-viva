"use client";

// components/course/viva-schedule-tab.tsx
// Phase 1 + 2: stats + agenda view, and the real setup wizard.
// Slots live in state so published slots appear immediately.

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CircleCheck,
  UserCheck,
  Percent,
  Plus,
  ListChecks,
} from "lucide-react";
import {
  mockVivaSlots,
  mockAssignments,
  mockStudents,
  type VivaSlot,
} from "@/lib/mock-data";
import { computeStats, groupByDate } from "@/lib/viva-schedule";
import ScheduleWizard from "@/components/course/schedule-wizard";

const DAY = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" });
const TIME = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });

function statusMeta(status: VivaSlot["status"]) {
  if (status === "open") return { label: "Available", color: "hsl(var(--success))" };
  if (status === "pending") return { label: "Booked", color: "hsl(var(--primary))" };
  return { label: "Closed", color: "hsl(var(--muted-foreground))" };
}

export default function VivaScheduleTab({ sectionId }: { sectionId: string }) {
  const [slots, setSlots] = useState<VivaSlot[]>(() =>
    mockVivaSlots.filter((s) => s.sectionId === sectionId),
  );
  const [wizardOpen, setWizardOpen] = useState(false);

  const assignments = useMemo(
    () => mockAssignments.filter((a) => a.sectionId === sectionId),
    [sectionId],
  );

  const stats = computeStats(slots);
  const grouped = groupByDate(slots);
  const dates = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total slots" value={stats.total} icon={CalendarClock} circle="205 82% 52%" />
        <StatCard label="Available" value={stats.available} icon={CircleCheck} circle="158 66% 42%" />
        <StatCard label="Booked" value={stats.booked} icon={UserCheck} circle="251 80% 62%" />
        <StatCard label="Occupancy" value={`${stats.occupancy}%`} icon={Percent} circle="32 88% 52%" />
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ListChecks className="h-5 w-5 text-muted-foreground" />
              Viva schedule
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Slots generated from your availability. Booked slots turn unavailable.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Set up viva schedule
          </button>
        </div>

        {dates.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed p-10 text-center">
            <CalendarClock className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No slots yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set up a schedule to generate bookable slots from your availability.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {dates.map((date) => (
              <div key={date}>
                <p className="mb-2 text-sm font-medium">{DAY.format(new Date(`${date}T00:00:00`))}</p>
                <div className="overflow-hidden rounded-lg border">
                  {grouped[date].map((slot, i) => {
                    const meta = statusMeta(slot.status);
                    const student = mockStudents.find((s) => s.id === slot.bookedByStudentId);
                    const assignment = mockAssignments.find((a) => a.id === slot.assignmentId);
                    return (
                      <div key={slot.id} className={"flex items-center gap-3 px-4 py-3" + (i > 0 ? " border-t" : "")}>
                        <span className="w-32 shrink-0 text-sm font-medium">
                          {TIME.format(new Date(slot.startTime))} – {TIME.format(new Date(slot.endTime))}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{assignment?.title ?? "Viva"}</p>
                          {student && (
                            <p className="truncate text-xs text-muted-foreground">Booked by {student.fullName}</p>
                          )}
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{ backgroundColor: meta.color.replace(")", " / 0.14)"), color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {wizardOpen && (
        <ScheduleWizard
          sectionId={sectionId}
          assignments={assignments}
          onClose={() => setWizardOpen(false)}
          onPublish={(newSlots) => setSlots((cur) => [...cur, ...newSlots])}
        />
      )}
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, circle,
}: {
  label: string; value: string | number; icon: typeof CalendarClock; circle: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: `hsl(${circle})` }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-3xl font-semibold leading-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}