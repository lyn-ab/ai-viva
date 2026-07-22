"use client";

// components/course/schedule-wizard.tsx
// Phase 2: the "Calendly" creation flow.
// Basic info -> availability (calendar + time windows) -> generate + preview -> publish.
// Uses generateSlots() from lib/viva-schedule (no hardcoded times).

import { useMemo, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  Plus,
  Clock,
  CalendarDays,
  ListChecks,
} from "lucide-react";
import { type Assignment, type VivaSlot } from "@/lib/mock-data";
import {
  type AvailabilityWindow,
  generateSlots,
  toVivaSlots,
} from "@/lib/viva-schedule";

const STEPS = ["Basics", "Availability", "Generate", "Publish"] as const;
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const pad = (n: number) => String(n).padStart(2, "0");
const TIME = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });
const DATE = new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short" });
let windowSeq = 0;

export default function ScheduleWizard({
  sectionId,
  assignments,
  onClose,
  onPublish,
}: {
  sectionId: string;
  assignments: Assignment[];
  onClose: () => void;
  onPublish: (slots: VivaSlot[]) => void;
}) {
  const [step, setStep] = useState(0);

  // step 1 — basics
  const [title, setTitle] = useState("Final viva");
  const [assignmentId, setAssignmentId] = useState(assignments[0]?.id ?? "");
  const [durationMin, setDurationMin] = useState(15);
  const [bufferMin, setBufferMin] = useState(5);
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  // step 2 — availability windows
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);

  // step 3 — generated slots (minus any the teacher removed)
  const generated = useMemo(
    () => generateSlots(windows, { durationMin, bufferMin }),
    [windows, durationMin, bufferMin],
  );
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const finalSlots = generated.filter((s) => !removed.has(s.id));

  const selectedDates = [...new Set(windows.map((w) => w.date))].sort();

  const canNext =
    step === 0
      ? title.trim() !== "" && assignmentId !== "" && durationMin > 0
      : step === 1
        ? windows.length > 0 && windows.every((w) => w.start < w.end)
        : step === 2
          ? finalSlots.length > 0
          : true;

  function publish() {
    onPublish(toVivaSlots(finalSlots, { sectionId, assignmentId }));
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-card shadow-lg">
        {/* header + stepper */}
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Set up viva schedule</h2>
            <div className="mt-3 flex items-center gap-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className={
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium " +
                      (i <= step ? "text-primary-foreground" : "bg-muted text-muted-foreground")
                    }
                    style={i <= step ? { backgroundColor: "hsl(var(--primary))" } : undefined}
                  >
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={"text-xs " + (i === step ? "font-medium" : "text-muted-foreground")}>
                    {label}
                  </span>
                  {i < STEPS.length - 1 && <span className="mx-1 h-px w-5 bg-border" />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <FieldRow label="Viva title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
              </FieldRow>
              <FieldRow label="Assignment">
                <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} className={inputCls}>
                  {assignments.length === 0 && <option value="">No assignments in this section</option>}
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </FieldRow>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldRow label="Demo duration (min)">
                  <input type="number" min={1} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className={inputCls} />
                </FieldRow>
                <FieldRow label="Buffer between demos (min)">
                  <input type="number" min={0} value={bufferMin} onChange={(e) => setBufferMin(Number(e.target.value))} className={inputCls} />
                </FieldRow>
              </div>
              <FieldRow label="Booking deadline (optional)">
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
              </FieldRow>
              <FieldRow label="Notes (optional)">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} />
              </FieldRow>
            </div>
          )}

          {step === 1 && (
            <AvailabilityStep windows={windows} setWindows={setWindows} selectedDates={selectedDates} />
          )}

          {step === 2 && (
            <GenerateStep
              generated={generated}
              removed={removed}
              onToggleRemove={(id) =>
                setRemoved((cur) => {
                  const next = new Set(cur);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })
              }
              durationMin={durationMin}
              bufferMin={bufferMin}
            />
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Review before publishing.</p>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <SummaryRow label="Title" value={title} />
                <SummaryRow label="Assignment" value={assignments.find((a) => a.id === assignmentId)?.title ?? "—"} />
                <SummaryRow label="Duration / buffer" value={`${durationMin} min / ${bufferMin} min`} />
                <SummaryRow label="Dates" value={`${selectedDates.length}`} />
                <SummaryRow label="Slots to publish" value={`${finalSlots.length}`} />
                {deadline && <SummaryRow label="Booking deadline" value={deadline} />}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <button
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
            className="rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={publish}
              disabled={finalSlots.length === 0}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Publish {finalSlots.length} slots
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// --- step 2: availability calendar + time windows -----------------------

function AvailabilityStep({
  windows,
  setWindows,
  selectedDates,
}: {
  windows: AvailabilityWindow[];
  setWindows: React.Dispatch<React.SetStateAction<AvailabilityWindow[]>>;
  selectedDates: string[];
}) {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(view);

  const keyFor = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const hasWindows = (date: string) => windows.some((w) => w.date === date);

  function toggleDate(date: string) {
    if (hasWindows(date)) {
      setWindows((cur) => cur.filter((w) => w.date !== date));
    } else {
      setWindows((cur) => [...cur, { id: `w-${windowSeq++}`, date, start: "09:00", end: "12:00" }]);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* calendar */}
      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setView(new Date(year, month - 1, 1))} className="rounded-md p-1.5 hover:bg-accent">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">{monthLabel}</span>
          <button onClick={() => setView(new Date(year, month + 1, 1))} className="rounded-md p-1.5 hover:bg-accent">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {WEEKDAYS.map((d) => <span key={d} className="py-1">{d}</span>)}
          {Array.from({ length: firstWeekday }).map((_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = keyFor(day);
            const on = hasWindows(date);
            return (
              <button
                key={date}
                onClick={() => toggleDate(date)}
                className={"aspect-square rounded-md text-sm transition-colors " + (on ? "text-primary-foreground" : "hover:bg-accent")}
                style={on ? { backgroundColor: "hsl(var(--primary))" } : undefined}
              >
                {day}
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> Click dates you&apos;re available. Click again to remove.
        </p>
      </div>

      {/* time windows */}
      <div className="space-y-3">
        {selectedDates.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Pick dates on the calendar to add availability windows.
          </p>
        )}
        {selectedDates.map((date) => (
          <div key={date} className="rounded-lg border p-3">
            <p className="mb-2 text-sm font-medium">{DATE.format(new Date(`${date}T00:00:00`))}</p>
            <div className="space-y-2">
              {windows.filter((w) => w.date === date).map((w) => (
                <div key={w.id} className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="time" value={w.start}
                    onChange={(e) => setWindows((cur) => cur.map((x) => x.id === w.id ? { ...x, start: e.target.value } : x))}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                  />
                  <span className="text-muted-foreground">–</span>
                  <input
                    type="time" value={w.end}
                    onChange={(e) => setWindows((cur) => cur.map((x) => x.id === w.id ? { ...x, end: e.target.value } : x))}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => setWindows((cur) => cur.filter((x) => x.id !== w.id))}
                    className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setWindows((cur) => [...cur, { id: `w-${windowSeq++}`, date, start: "13:00", end: "16:00" }])}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add window
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- step 3: generated slots preview ------------------------------------

function GenerateStep({
  generated,
  removed,
  onToggleRemove,
  durationMin,
  bufferMin,
}: {
  generated: ReturnType<typeof generateSlots>;
  removed: Set<string>;
  onToggleRemove: (id: string) => void;
  durationMin: number;
  bufferMin: number;
}) {
  const kept = generated.filter((s) => !removed.has(s.id)).length;
  const byDate: Record<string, typeof generated> = {};
  for (const s of generated) (byDate[s.date] ??= []).push(s);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
        <ListChecks className="h-4 w-4 text-primary" />
        <span className="font-medium">{kept} slots</span>
        <span className="text-muted-foreground">
          generated from {durationMin} min demos + {bufferMin} min buffer. Remove any you don&apos;t want.
        </span>
      </div>
      <div className="space-y-4">
        {Object.keys(byDate).sort().map((date) => (
          <div key={date}>
            <p className="mb-2 text-sm font-medium">{DATE.format(new Date(`${date}T00:00:00`))}</p>
            <div className="flex flex-wrap gap-2">
              {byDate[date].map((s) => {
                const gone = removed.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => onToggleRemove(s.id)}
                    className={
                      "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                      (gone ? "text-muted-foreground line-through opacity-60" : "hover:border-primary/50")
                    }
                  >
                    {TIME.format(new Date(s.startTime))}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}