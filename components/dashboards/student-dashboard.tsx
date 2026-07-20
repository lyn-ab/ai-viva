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
  BookOpen,
  Video,
  Clock,
} from "lucide-react";
import {
  getCurrentUser,
  mockCourses,
  mockSections,
  mockAssignments,
  mockSubmissions,
  mockVivaSlots,
  type Assignment,
} from "@/lib/mock-data";

// --- helpers -------------------------------------------------------------

const MATERIALS = [
  { key: "projectReport", label: "Project report" },
  { key: "sourceCode", label: "Source code" },
  { key: "slides", label: "Slides" },
] as const;

function statusStyle(status: "complete" | "pending" | "missing") {
  if (status === "complete")
    return { bg: "hsl(var(--success) / 0.15)", fg: "hsl(var(--success))", label: "Uploaded" };
  if (status === "pending")
    return { bg: "hsl(var(--warning) / 0.15)", fg: "hsl(var(--warning))", label: "Pending" };
  return { bg: "hsl(var(--destructive) / 0.15)", fg: "hsl(var(--destructive))", label: "Missing" };
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

  // read "now" only after mount, so prerender never touches the current time
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => setNowMs(Date.now()), []);
  const daysLeft = (iso: string): number | null =>
    nowMs == null ? null : Math.ceil((new Date(iso).getTime() - nowMs) / 86400000);

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

  const filesToUpload = mySubmissions.reduce(
    (n, sub) => n + MATERIALS.filter((m) => sub[m.key] !== "complete").length,
    0,
  );

  const kpis = [
    { label: "Assignments", value: myAssignments.length, icon: FileText, circle: "205 82% 52%" },
    { label: "Files to upload", value: filesToUpload, icon: UploadCloud, circle: "32 88% 52%" },
    { label: "Upcoming vivas", value: myVivas.length, icon: Video, circle: "251 80% 62%" },
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

            {mySubmissions.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">Nothing to submit yet.</p>
            )}

            <div className="mt-3 space-y-3">
              {mySubmissions.map((sub) => {
                const asg = mockAssignments.find((a) => a.id === sub.assignmentId);
                const done = MATERIALS.filter((m) => sub[m.key] === "complete").length;
                const pct = Math.round((done / MATERIALS.length) * 100);
                return (
                  <div key={sub.id} className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{asg?.title ?? "Assignment"}</p>
                      {asg && (
                        <span className="text-xs text-muted-foreground">
                          Due {formatDate(asg.dueDate)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {MATERIALS.map((m) => {
                        const st = statusStyle(sub[m.key]);
                        return (
                          <span
                            key={m.key}
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{ backgroundColor: st.bg, color: st.fg }}
                          >
                            {m.label}: {st.label}
                          </span>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: "hsl(var(--success))" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                      {pct < 100 && (
                        <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                          Upload
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* my courses */}
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              My courses
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {myCourses.map((course) => (
                <div key={course.id} className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary" style={accentTint}>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium">{course.name}</p>
                  </div>
                  <span className="mt-3 inline-block rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    {course.code}
                  </span>
                </div>
              ))}
              {myCourses.length === 0 && (
                <p className="text-sm text-muted-foreground">Not enrolled in any course yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* ---- right rail ---- */}
        <div className="space-y-4">
          {/* next viva */}
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              Next viva
            </h2>

            {nextViva ? (
              <div className="mt-3">
                <div className="rounded-lg p-4" style={accentTint}>
                  <p className="text-sm font-medium text-primary">{formatSlot(nextViva.startTime)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Your oral examination is booked.</p>
                </div>
                <Link
                  href="/camera"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  <Video className="h-4 w-4" /> Camera &amp; mic test
                </Link>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Your teacher starts the session when it&apos;s time.
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">No viva booked yet.</p>
                <Link
                  href="/scheduling"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-muted px-4 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Book a slot
                </Link>
              </div>
            )}
          </section>

          {/* deadlines */}
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Deadlines
            </h2>
            <div className="mt-3 space-y-2">
              {myAssignments.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
              )}
              {myAssignments.map((a) => {
                const left = daysLeft(a.dueDate);
                const urgent = left != null && left <= 7;
                const label =
                  left == null
                    ? `Due ${formatDate(a.dueDate)}`
                    : left < 0
                      ? "overdue"
                      : left === 0
                        ? "due today"
                        : `in ${left}d`;
                return (
                  <div key={a.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm">{a.title}</span>
                    <span
                      className="shrink-0 text-xs font-medium"
                      style={{ color: urgent ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))" }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}