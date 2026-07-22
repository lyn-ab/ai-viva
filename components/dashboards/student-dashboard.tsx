"use client";

// components/dashboards/student-dashboard.tsx
//
// Student overview. All data derived from lib/mock-data.ts for the logged-in
// student (getCurrentUser()). "Now" is read in useEffect (after mount) so we
// never access the current time during prerender.
// Preview: set getCurrentUser() to mockStudents[0] (Alice, complete) or
// mockStudents[1] (Bob, has missing/pending materials).

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  UploadCloud,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Video,
  Plus,
  X,
} from "lucide-react";
import {
  getCurrentUser,
  mockCourses,
  mockSections,
  mockAssignments,
  mockSubmissions,
  mockVivaSlots,
  type Assignment,
  type Submission,
  type VivaSlot,
} from "@/lib/mock-data";
import { useNotifications } from "@/lib/notifications-store";

const READY_WINDOW_MS = 5 * 60 * 1000;

// --- helpers -------------------------------------------------------------

const MATERIALS = [
  { key: "projectReport", label: "Project report" },
  { key: "sourceCode", label: "Source code" },
  { key: "slides", label: "Slides" },
] as const;

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function submissionStatus(sub: Submission) {
  const done = MATERIALS.filter((m) => sub[m.key] === "complete").length;
  const missing = MATERIALS.length - done;
  if (missing === 0) {
    return { label: "All submitted", complete: true, bg: "hsl(var(--success) / 0.15)", fg: "hsl(var(--success))" };
  }
  return {
    label: `${missing} file${missing > 1 ? "s" : ""} to submit`,
    complete: false,
    bg: "hsl(var(--warning) / 0.15)",
    fg: "hsl(var(--warning))",
  };
}

function courseNameFor(asg?: Assignment) {
  if (!asg) return "";
  const section = mockSections.find((s) => s.id === asg.sectionId);
  const course = section ? mockCourses.find((c) => c.id === section.courseId) : undefined;
  return course?.name ?? "";
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
function formatSlot(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
}

// --- component -----------------------------------------------------------

export default function StudentDashboard() {
  const user = getCurrentUser();
  const firstName = user.fullName.split(" ")[0];

  // read "now" only after mount, so prerender never touches the current time.
  // ticks every 15s so the "mark ready" window opens live, without a reload.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  const daysLeft = (iso: string): number | null =>
    nowMs == null ? null : Math.ceil((new Date(iso).getTime() - nowMs) / 86400000);

  const { addNotification } = useNotifications("student");

  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set());

  const mySubmissions = mockSubmissions.filter((s) => s.studentId === user.id);

  const myAssignments = mySubmissions
    .map((sub) => mockAssignments.find((a) => a.id === sub.assignmentId))
    .filter(Boolean) as Assignment[];
  myAssignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const myCourseIds = new Set(
    myAssignments
      .map((a) => mockSections.find((s) => s.id === a.sectionId)?.courseId)
      .filter(Boolean) as string[],
  );
  const myCourses = mockCourses.filter((c) => myCourseIds.has(c.id));

  const myVivas = mockVivaSlots
    .filter((v) => v.bookedByStudentId === user.id && v.status !== "closed")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const nextViva = myVivas[0];

  const displayedVivas = selectedDate
    ? myVivas.filter((v) => dateKey(new Date(v.startTime)) === selectedDate)
    : myVivas;

  function canMarkReady(v: VivaSlot) {
    if (nowMs == null) return false;
    const opensAt = new Date(v.startTime).getTime() - READY_WINDOW_MS;
    const closesAt = new Date(v.endTime).getTime();
    return nowMs >= opensAt && nowMs <= closesAt;
  }

  function markReady(v: VivaSlot) {
    setReadyIds((cur) => new Set(cur).add(v.id));
    const assignment = mockAssignments.find((a) => a.id === v.assignmentId);
    addNotification({
      id: `n-ready-${v.id}-${Date.now()}`,
      kind: "ready_to_present",
      forRole: "teacher",
      title: `${user.fullName} is ready to present`,
      detail: assignment?.title,
      createdAt: new Date().toISOString(),
      read: false,
      actionRequired: true,
      studentId: user.id,
      sectionId: v.sectionId,
      vivaSlotId: v.id,
    });
  }

  const filesToUpload = mySubmissions.reduce(
    (n, sub) => n + MATERIALS.filter((m) => sub[m.key] !== "complete").length,
    0,
  );

  const nextVivaLeft = nextViva ? daysLeft(nextViva.startTime) : null;
  const nextVivaValue = !nextViva ? "—" : nextVivaLeft == null ? "…" : nextVivaLeft <= 0 ? "Today" : `${nextVivaLeft}d`;

  const kpis = [
    { label: "Assignments", value: myAssignments.length, icon: FileText, circle: "205 82% 52%" },
    { label: "Files to upload", value: filesToUpload, icon: UploadCloud, circle: "32 88% 52%" },
    { label: "Next viva", value: nextVivaValue, icon: CalendarClock, circle: "251 80% 62%" },
    { label: "Courses", value: myCourses.length, icon: BookOpen, circle: "158 66% 42%" },
  ];

  const accentTint = { backgroundColor: "hsl(var(--primary) / 0.14)" };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Good morning, {firstName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Here&apos;s where your project stands.
      </p>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: `hsl(${kpi.circle})` }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{kpi.label}</div>
                  <div className="text-3xl font-semibold leading-tight">{kpi.value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* main + right rail */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* ---- left / main column ---- */}
        <div className="space-y-4 lg:col-span-2">
          {/* my submissions */}
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
              My submissions
            </h2>

            {mySubmissions.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing to submit yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {mySubmissions.map((sub) => {
                  const asg = mockAssignments.find((a) => a.id === sub.assignmentId);
                  const status = submissionStatus(sub);
                  return (
                    <div key={sub.id} className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-primary"
                        style={accentTint}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{asg?.title ?? "Assignment"}</p>
                        <p className="truncate text-xs text-muted-foreground">{courseNameFor(asg)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{ backgroundColor: status.bg, color: status.fg }}
                        >
                          {status.label}
                        </span>
                        {asg && (
                          <span className="text-xs text-muted-foreground">Due {formatDate(asg.dueDate)}</span>
                        )}
                      </div>
                      {!status.complete && (
                        <button
                          type="button"
                          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* my courses */}
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                My courses
              </h2>
              <button
                type="button"
                onClick={() => setJoinOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" />
                Join course
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {myCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="block rounded-lg border bg-muted/50 p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary" style={accentTint}>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium">{course.name}</p>
                  </div>
                  <span className="mt-3 inline-block rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    {course.code}
                  </span>
                </Link>
              ))}
              {myCourses.length === 0 && (
                <p className="text-sm text-muted-foreground">Not enrolled in any course yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* ---- right rail ---- */}
        <div className="space-y-4">
          {/* viva calendar */}
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              Viva calendar
            </h2>
            <div className="mt-3">
              {nowMs == null ? (
                <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                  Loading…
                </div>
              ) : (
                <VivaCalendar
                  vivas={myVivas}
                  baseDate={new Date(nowMs)}
                  todayKey={dateKey(new Date(nowMs))}
                  monthOffset={monthOffset}
                  onMonthChange={(d) => setMonthOffset((m) => m + d)}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
            </div>
          </section>

          {/* upcoming vivas */}
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Video className="h-5 w-5 text-muted-foreground" />
                Upcoming vivas
              </h2>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-xs font-medium text-primary"
                >
                  Clear filter
                </button>
              )}
            </div>

            {displayedVivas.length === 0 ? (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">
                  {selectedDate ? "No vivas on this date." : "No vivas booked yet."}
                </p>
                {!selectedDate && (
                  <Link
                    href="/scheduling"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-muted px-4 py-2.5 text-sm font-medium hover:bg-accent"
                  >
                    Book a slot
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
                {displayedVivas.map((v) => {
                  const assignment = mockAssignments.find((a) => a.id === v.assignmentId);
                  const ready = readyIds.has(v.id);
                  const canReady = canMarkReady(v);
                  return (
                    <div key={v.id} className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary"
                        style={accentTint}
                      >
                        <Video className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{assignment?.title ?? "Viva"}</p>
                        <p className="truncate text-xs text-muted-foreground">{formatSlot(v.startTime)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={!canReady || ready}
                        onClick={() => markReady(v)}
                        title={!ready && !canReady ? "Opens 5 minutes before your viva" : undefined}
                        className={
                          "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                          (ready
                            ? ""
                            : canReady
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground")
                        }
                        style={ready ? { backgroundColor: "hsl(var(--success) / 0.15)", color: "hsl(var(--success))" } : undefined}
                      >
                        {ready ? "Ready" : "Mark ready"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* cam & mic test — lives inside the same card, under the list */}
            <div className="mt-4 border-t pt-4">
              <Link
                href="/camera"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <Video className="h-4 w-4" /> Camera &amp; mic test
              </Link>
            </div>
          </section>
        </div>
      </div>

      {joinOpen && <JoinCourseDialog onClose={() => setJoinOpen(false)} />}
    </div>
  );
}

// --- viva calendar ---------------------------------------------------------

function VivaCalendar({
  vivas,
  baseDate,
  todayKey,
  monthOffset,
  onMonthChange,
  selectedDate,
  onSelectDate,
}: {
  vivas: VivaSlot[];
  baseDate: Date;
  todayKey: string;
  monthOffset: number;
  onMonthChange: (delta: number) => void;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const view = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(view);
  const keyFor = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const vivaCountOn = (key: string) => vivas.filter((v) => dateKey(new Date(v.startTime)) === key).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(-1)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-medium">{monthLabel}</span>
        <button
          type="button"
          onClick={() => onMonthChange(1)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex justify-center">
        <div
          className="grid gap-y-0.5 gap-x-0.5 text-center"
          style={{ gridTemplateColumns: "repeat(7, 1.65rem)" }}
        >
          {WEEKDAYS.map((d) => (
            <span key={d} className="text-[10px] font-medium text-muted-foreground">{d[0]}</span>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <span key={`b${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = keyFor(day);
            const has = vivaCountOn(key) > 0;
            const selected = selectedDate === key;
            const isToday = key === todayKey;
            const classes = [
              "relative flex h-[1.65rem] w-[1.65rem] items-center justify-center rounded-full text-[11px] transition-colors",
              selected
                ? "text-primary-foreground"
                : has
                  ? "font-semibold hover:bg-accent"
                  : isToday
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground/40",
              isToday && !selected ? "ring-1 ring-inset ring-primary" : "",
            ].filter(Boolean).join(" ");
            return (
              <button
                type="button"
                key={key}
                disabled={!has}
                onClick={() => onSelectDate(selected ? null : key)}
                className={classes}
                style={selected ? { backgroundColor: "hsl(var(--primary))" } : undefined}
              >
                {day}
                {has && !selected && (
                  <span
                    className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ backgroundColor: selected ? "currentColor" : "hsl(var(--primary))" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- join course dialog ----------------------------------------------------

function JoinCourseDialog({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Join a course</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div
            className="mt-4 rounded-lg p-4 text-sm"
            style={{ backgroundColor: "hsl(var(--success) / 0.15)", color: "hsl(var(--success))" }}
          >
            Request sent. Your teacher will confirm your enrollment.
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the join code your teacher shared with you.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7K2P9Q"
              className="mt-4 w-full rounded-md border bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.2em] outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={code.trim() === ""}
              onClick={() => setSubmitted(true)}
              className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Join course
            </button>
          </>
        )}
      </div>
    </div>
  );
}
