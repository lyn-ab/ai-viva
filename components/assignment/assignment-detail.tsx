"use client";

// components/assignment/assignment-detail.tsx
// The assignment detail page: header + tabs (Files | Group | Viva setup | Submissions).
// Group tab only shows for group assignments. Reads everything from mock-data.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FolderOpen,
  Users,
  CalendarClock,
  ClipboardCheck,
  FileText,
  ListChecks,
  Plus,
  Copy,
  CheckCircle2,
  Circle,
  AlertCircle,
  UploadCloud,
} from "lucide-react";
import {
  type Assignment,
  type Course,
  type Section,
  type Profile,
  mockProjectGroups,
  mockGroupMembers,
  mockSubmissions,
  mockVivaSlots,
  getStudentsInSection,
} from "@/lib/mock-data";

// ---- submission status helper ------------------------------------------
type SubState = "submitted" | "late" | "missing";
function studentState(assignmentId: string, studentId: string): SubState {
  const sub = mockSubmissions.find(
    (s) => s.assignmentId === assignmentId && s.studentId === studentId,
  );
  if (!sub) return "missing";
  const vals = [sub.projectReport, sub.sourceCode, sub.slides];
  if (vals.every((v) => v === "complete")) return "submitted";
  if (vals.some((v) => v === "complete" || v === "pending")) return "late";
  return "missing";
}
const STATE_META: Record<SubState, { label: string; color: string; Icon: typeof Circle }> = {
  submitted: { label: "Submitted", color: "hsl(var(--success))", Icon: CheckCircle2 },
  late: { label: "Late", color: "hsl(var(--destructive))", Icon: AlertCircle },
  missing: { label: "Not submitted", color: "hsl(var(--muted-foreground))", Icon: Circle },
};
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return `${p[0]?.[0] ?? ""}${p.at(-1)?.[0] ?? ""}`.toUpperCase();
}

// ---- component ----------------------------------------------------------
export default function AssignmentDetail({
  course,
  assignment,
  section,
}: {
  course: Course;
  assignment: Assignment;
  section: Section;
}) {
  const isGroup = assignment.mode === "group";
  const tabs = useMemo(
    () =>
      [
        { id: "files", label: "Files", icon: FolderOpen },
        ...(isGroup ? [{ id: "group", label: "Group", icon: Users }] : []),
        { id: "viva", label: "Viva setup", icon: CalendarClock },
        { id: "submissions", label: "Submissions", icon: ClipboardCheck },
      ] as const,
    [isGroup],
  );
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("files");

  const enrolled = getStudentsInSection(section.id);
  const groups = mockProjectGroups.filter((g) => g.assignmentId === assignment.id);
  const slots = mockVivaSlots.filter((s) => s.assignmentId === assignment.id);

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {course.code}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{assignment.title}</h1>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge>{course.code} · {section.name}</Badge>
        <Badge>{isGroup ? "Group" : "Individual"}</Badge>
        {assignment.totalMarks != null && <Badge>{assignment.totalMarks} marks</Badge>}
      </div>

      {/* tabs */}
      <div className="mt-5 flex gap-5 overflow-x-auto border-b">
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "flex items-center gap-1.5 whitespace-nowrap pb-2.5 text-sm " +
                (on ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")
              }
              style={on ? { borderBottom: "2px solid hsl(var(--primary))" } : undefined}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "files" && <FilesTab assignment={assignment} />}
        {tab === "group" && isGroup && <GroupTab assignmentId={assignment.id} enrolled={enrolled} groups={groups} />}
        {tab === "viva" && <VivaTab slots={slots} />}
        {tab === "submissions" && (
          <SubmissionsTab assignment={assignment} enrolled={enrolled} groups={groups} />
        )}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

// ---- Files tab ----------------------------------------------------------
function FilesTab({ assignment }: { assignment: Assignment }) {
  const [brief, setBrief] = useState<string | null>(null);
  const [rubric, setRubric] = useState<string | null>(null);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Assignment files</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The brief and rubric belong to this assignment, not the whole course.
        </p>
        <div className="mt-4 space-y-3">
          <UploadRow label="Project brief" filename={brief} onFile={(f) => setBrief(f.name)} />
          <UploadRow label="Rubric file" filename={rubric} onFile={(f) => setRubric(f.name)} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Rubric criteria</h2>
        {assignment.rubric && assignment.rubric.length > 0 ? (
          <div className="mt-3 space-y-2">
            {assignment.rubric.map((c, i) => (
              <div key={i} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                <span>{c.criterion}</span>
                <span className="font-medium text-muted-foreground">{c.weight}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No rubric criteria set yet.</p>
        )}

        <h3 className="mt-5 text-sm font-semibold">Required materials</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(assignment.requiredMaterials ?? []).map((m) => (
            <span key={m} className="rounded-full border bg-muted px-2.5 py-1 text-xs capitalize text-muted-foreground">
              {m}
            </span>
          ))}
          {(assignment.requiredMaterials ?? []).length === 0 && (
            <span className="text-sm text-muted-foreground">None specified.</span>
          )}
        </div>
      </section>
    </div>
  );
}

function UploadRow({
  label,
  filename,
  onFile,
}: {
  label: string;
  filename: string | null;
  onFile: (f: File) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-muted/30 p-3 transition-colors hover:bg-accent">
      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-primary"
        style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
      >
        {filename ? <FileText className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{filename ?? "Choose a file"}</p>
      </div>
    </label>
  );
}

// ---- Group tab ----------------------------------------------------------
function GroupTab({
  assignmentId,
  enrolled,
  groups,
}: {
  assignmentId: string;
  enrolled: Profile[];
  groups: typeof mockProjectGroups;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-5 w-5 text-muted-foreground" /> Group formation
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Students join with invite codes. Each member still does their own viva.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> Create group
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {groups.map((g) => {
          const members = mockGroupMembers
            .filter((m) => m.groupId === g.id)
            .map((m) => enrolled.find((s) => s.id === m.studentId))
            .filter(Boolean) as Profile[];
          return (
            <div key={g.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{g.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {g.inviteCode} <Copy className="h-3 w-3" />
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {members.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-primary"
                      style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
                    >
                      {initials(m.fullName)}
                    </span>
                    {m.fullName}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {members.length}/{g.maxMembers} members · {g.isOpen ? "Open to join" : "Locked"}
              </p>
            </div>
          );
        })}
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">No groups yet.</p>
        )}
      </div>
    </section>
  );
}

// ---- Viva setup tab -----------------------------------------------------
function VivaTab({ slots }: { slots: typeof mockVivaSlots }) {
  const generated = slots.length;
  const booked = slots.filter((s) => s.status === "pending").length;
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <CalendarClock className="h-5 w-5 text-muted-foreground" /> Viva setup
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Generate slots from one availability window instead of adding them one by one.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Generated slots</p>
          <p className="mt-1 text-2xl font-semibold">{generated}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Booked</p>
          <p className="mt-1 text-2xl font-semibold">{booked}</p>
        </div>
      </div>
      <button className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        <ListChecks className="h-4 w-4" /> Set up viva schedule
      </button>
    </section>
  );
}

// ---- Submissions tab ----------------------------------------------------
function SubmissionsTab({
  assignment,
  enrolled,
  groups,
}: {
  assignment: Assignment;
  enrolled: Profile[];
  groups: typeof mockProjectGroups;
}) {
  const row = (student: Profile) => {
    const st = STATE_META[studentState(assignment.id, student.id)];
    return (
      <div key={student.id} className="flex items-center gap-3 border-t px-3 py-2.5 first:border-t-0">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-primary"
          style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
        >
          {initials(student.fullName)}
        </span>
        <span className="flex-1 text-sm">{student.fullName}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: st.color }}>
          <st.Icon className="h-4 w-4" /> {st.label}
        </span>
      </div>
    );
  };

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <ClipboardCheck className="h-5 w-5 text-muted-foreground" /> Submission progress
      </h2>

      {assignment.mode === "group" ? (
        <div className="mt-4 space-y-3">
          {groups.map((g) => {
            const members = mockGroupMembers
              .filter((m) => m.groupId === g.id)
              .map((m) => enrolled.find((s) => s.id === m.studentId))
              .filter(Boolean) as Profile[];
            return (
              <div key={g.id} className="overflow-hidden rounded-lg border">
                <div className="bg-muted/40 px-3 py-2 text-sm font-medium">{g.name}</div>
                {members.map(row)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border">{enrolled.map(row)}</div>
      )}
    </section>
  );
}