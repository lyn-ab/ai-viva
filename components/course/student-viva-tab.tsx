"use client";

// components/course/student-viva-tab.tsx
// Students can only book into slots the teacher has already opened for this
// section — no wizard, no creating new slots, no course-wide stats.

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import {
  mockVivaSlots,
  mockAssignments,
  type VivaSlot,
} from "@/lib/mock-data";
import { groupByDate } from "@/lib/viva-schedule";

const DAY = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" });
const TIME = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });

export default function StudentVivaTab({
  sectionId,
  studentId,
}: {
  sectionId: string;
  studentId: string;
}) {
  const [slots, setSlots] = useState<VivaSlot[]>(() =>
    mockVivaSlots.filter((s) => s.sectionId === sectionId),
  );

  const mySlot = slots.find((s) => s.bookedByStudentId === studentId);
  const openSlots = useMemo(
    () => slots.filter((s) => s.status === "open"),
    [slots],
  );
  const grouped = groupByDate(openSlots);
  const dates = Object.keys(grouped).sort();

  function bookSlot(slotId: string) {
    setSlots((current) =>
      current.map((s) =>
        s.id === slotId
          ? { ...s, status: "pending", bookedByStudentId: studentId }
          : s,
      ),
    );
    // TODO(supabase): persist the booking — update the slot row (status,
    // booked_by_student_id) with a server-side check that it's still open.
  }

  function cancelBooking() {
    if (!mySlot) return;
    setSlots((current) =>
      current.map((s) =>
        s.id === mySlot.id
          ? { ...s, status: "open", bookedByStudentId: undefined }
          : s,
      ),
    );
    // TODO(supabase): release the slot back to open server-side.
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <CalendarClock className="h-5 w-5 text-muted-foreground" />
        Viva schedule
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Book a viva slot from the times your teacher has made available.
      </p>

      {mySlot ? (
        <div className="mt-5 rounded-lg border p-4" style={{ backgroundColor: "hsl(var(--success) / 0.08)" }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />
            <p className="text-sm font-medium">Your viva is booked</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {DAY.format(new Date(mySlot.startTime))} · {TIME.format(new Date(mySlot.startTime))} –{" "}
            {TIME.format(new Date(mySlot.endTime))}
          </p>
          {mockAssignments.find((a) => a.id === mySlot.assignmentId) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {mockAssignments.find((a) => a.id === mySlot.assignmentId)?.title}
            </p>
          )}
          <button
            type="button"
            onClick={cancelBooking}
            className="mt-3 rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            Cancel booking
          </button>
        </div>
      ) : dates.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed p-10 text-center">
          <CalendarClock className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No slots available yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your teacher hasn&apos;t opened a viva schedule for this section.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {dates.map((date) => (
            <div key={date}>
              <p className="mb-2 text-sm font-medium">{DAY.format(new Date(`${date}T00:00:00`))}</p>
              <div className="overflow-hidden rounded-lg border">
                {grouped[date].map((slot, i) => {
                  const assignment = mockAssignments.find((a) => a.id === slot.assignmentId);
                  return (
                    <div
                      key={slot.id}
                      className={"flex items-center gap-3 px-4 py-3" + (i > 0 ? " border-t" : "")}
                    >
                      <span className="w-32 shrink-0 text-sm font-medium">
                        {TIME.format(new Date(slot.startTime))} – {TIME.format(new Date(slot.endTime))}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                        {assignment?.title ?? "Viva"}
                      </p>
                      <button
                        type="button"
                        onClick={() => bookSlot(slot.id)}
                        className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                      >
                        Book
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}