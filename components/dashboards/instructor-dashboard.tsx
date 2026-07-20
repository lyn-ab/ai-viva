// components/dashboards/instructor-dashboard.tsx
//
// Instructor overview. All numbers/lists derived from lib/mock-data.ts.
// Layout: full-width dashboard grid — KPIs on top, a 2/3 main column
// (upcoming vivas + courses) and a 1/3 right rail (quick actions + status).
import Link from "next/link";

import {
  PlayCircle,
  ClipboardCheck,
  FileText,
  Users,
  CalendarClock,
  BookOpen,
  FolderPlus,
  FilePlus,
  CalendarPlus,
} from "lucide-react";
import {
  getCurrentUser,
  getCoursesForTeacher,
  mockStudents,
  mockSections,
  mockAssignments,
  mockSubmissions,
  mockVivaSlots,
} from "@/lib/mock-data";

// --- helpers -------------------------------------------------------------

function initials(name: string) {
  const parts = name.replace(/^Dr\.\s*/, "").trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function submissionFor(studentId: string) {
  return mockSubmissions.find((s) => s.studentId === studentId);
}
function isReady(studentId: string) {
  const sub = submissionFor(studentId);
  return (
    !!sub &&
    sub.projectReport === "complete" &&
    sub.sourceCode === "complete" &&
    sub.slides === "complete"
  );
}
function projectName(studentId: string) {
  const sub = submissionFor(studentId);
  const asg = sub && mockAssignments.find((a) => a.id === sub.assignmentId);
  return asg?.title ?? "Project submission";
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function formatSlot(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
}

// --- component -----------------------------------------------------------

export default function InstructorDashboard() {
  const user = getCurrentUser();
  const courses = getCoursesForTeacher(user.id);

  // vibrant icon-circle colors (white glyph) — professional, not pastel
  const kpis = [
    { label: "Vivas to activate", value: mockVivaSlots.filter((s) => s.status === "pending").length, icon: PlayCircle, circle: "251 80% 62%" },
    { label: "Awaiting review", value: mockVivaSlots.filter((s) => s.status === "closed").length, icon: ClipboardCheck, circle: "205 82% 52%" },
    { label: "Open assignments", value: mockAssignments.length, icon: FileText, circle: "32 88% 52%" },
    { label: "Total students", value: mockStudents.length, icon: Users, circle: "158 66% 42%" },
  ];

  const upcoming = mockVivaSlots
    .filter((s) => s.bookedByStudentId && s.status !== "closed")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // submission status breakdown (for the right-rail widget)
  const subStatuses = mockSubmissions.flatMap((s) => [s.projectReport, s.sourceCode, s.slides]);
  const subTotal = subStatuses.length || 1;
  const complete = subStatuses.filter((x) => x === "complete").length;
  const pending = subStatuses.filter((x) => x === "pending").length;
  const missing = subStatuses.filter((x) => x === "missing").length;

  const accentTint = { backgroundColor: "hsl(var(--primary) / 0.14)" };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Good morning, {user.fullName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Here&apos;s what needs your attention today.
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
     <div className="mt-4">
        <div className="space-y-4">
          {/* upcoming vivas panel */}
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              Upcoming vivas
            </h2>
            <div className="mt-3 -mx-1">
              {upcoming.length === 0 && (
                <p className="px-1 py-4 text-sm text-muted-foreground">No booked vivas yet.</p>
              )}
              {upcoming.map((slot, i) => {
                const student = mockStudents.find((s) => s.id === slot.bookedByStudentId);
                if (!student) return null;
                const ready = isReady(student.id);
                return (
                  <div
                    key={slot.id}
                    className={
                      "flex items-center gap-3 rounded-lg px-1 py-3" +
                      (i < upcoming.length - 1 ? " border-b" : "")
                    }
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium text-primary"
                      style={accentTint}
                    >
                      {initials(student.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{student.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {projectName(student.id)}
                      </p>
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {formatSlot(slot.startTime)}
                    </span>
                    {ready ? (
                      <button className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground">
                        Activate
                      </button>
                    ) : (
                      <button disabled className="rounded-md bg-muted px-3.5 py-1.5 text-sm text-muted-foreground">
                        Not ready
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* courses panel */}
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              Your courses
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((course) => {
                const sections = mockSections.filter((s) => s.courseId === course.id);
                return (
                  <Link key={course.id} href={`/courses/${course.id}`} className="block rounded-lg border bg-muted/60 p-4 transition-colors hover:border-primary/40">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary" style={accentTint}>
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium">{course.name}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                        {course.code}
                      </span>
                      {sections.map((sec) => (
                        <span key={sec.id} className="rounded-full px-2.5 py-1 text-xs text-primary" style={accentTint}>
                          {sec.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {sections.length} {sections.length === 1 ? "section" : "sections"}
                      </span>
                      <button className="text-xs font-medium text-primary">+ Add section</button>
                    </div>
                  </Link>
                );
              })}

              <button className="flex min-h-[120px] flex-col items-center justify-center rounded-lg border border-dashed border-input p-4 text-center text-muted-foreground transition-colors hover:bg-accent">
                <span className="text-2xl leading-none">+</span>
                <span className="mt-1 text-sm font-medium">Create course</span>
              </button>
            </div>
          </section>
        </div>

        
        </div>
      </div>
  );
}

function StatusRow({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-medium">{count}</span>
    </div>
  );
}