"use client";

// components/course/assignments-tab.tsx
// Slim assignments list. Columns: Assignment | Mode | Due date | Marks.
// Expanding a row shows material/criteria counts + Configure + a read-only
// submission overview (grouped by group for group assignments). All the heavy
// editing (files, group creation, viva setup) lives on the assignment detail
// page, reached via "Configure".

import Link from "next/link";
import {
  ClipboardList,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  Settings2,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import {
  type Assignment,
  type Profile,
  type ProjectGroup,
  type GroupMember,
  mockSubmissions,
} from "@/lib/mock-data";
import { formatDate, initials } from "@/lib/course-utils";

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

function StatusText({ state }: { state: SubState }) {
  const m = STATE_META[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: m.color }}>
      <m.Icon className="h-4 w-4" />
      {m.label}
    </span>
  );
}

const COLS = "lg:grid-cols-[minmax(240px,2.4fr)_110px_140px_90px_1fr_40px]";

export default function AssignmentsTab({
  courseId,
  assignments,
  enrolled,
  groups,
  groupMembers,
  expandedAssignmentId,
  onToggleExpanded,
  onCreate,
}: {
  courseId: string;
  assignments: Assignment[];
  enrolled: Profile[];
  groups: ProjectGroup[];
  groupMembers: GroupMember[];
  expandedAssignmentId: string | null;
  onToggleExpanded: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            Assignments
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each assignment has its own brief, rubric, groups and viva setup.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Create assignment
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border">
        {/* column header */}
        <div className={`hidden gap-4 border-b bg-muted/60 px-4 py-3 text-xs font-medium text-muted-foreground lg:grid ${COLS}`}>
          <span>Assignment</span>
          <span>Mode</span>
          <span>Due date</span>
          <span>Marks</span>
          <span />
          <span />
        </div>

        {assignments.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No assignments yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create the first assignment for this section.
            </p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const expanded = expandedAssignmentId === assignment.id;
            const submittedCount = enrolled.filter(
              (s) => studentState(assignment.id, s.id) === "submitted",
            ).length;
            const materialsCount = assignment.requiredMaterials?.length ?? 0;
            const rubricCount = assignment.rubric?.length ?? 0;
            const assignmentGroups = groups.filter((g) => g.assignmentId === assignment.id);

            return (
              <div key={assignment.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => onToggleExpanded(assignment.id)}
                  className={`grid w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40 lg:items-center lg:gap-4 ${COLS}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{assignment.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {assignment.description || assignment.focusNotes}
                    </p>
                  </div>

                  <div>
                    <span className="rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {assignment.mode === "group" ? "Group" : "Individual"}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">{formatDate(assignment.dueDate)}</p>

                  <p className="text-sm font-medium">
                    {assignment.totalMarks != null ? assignment.totalMarks : "—"}
                  </p>

                  <p className="text-right text-xs text-muted-foreground lg:text-left">
                    {submittedCount}/{enrolled.length} submitted
                  </p>

                  <span className="flex justify-end text-muted-foreground">
                    {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>

                {expanded && (
                  <div className="border-t bg-muted/20 px-4 py-4">
                    {/* summary row: counts + configure */}
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {materialsCount} materials · {rubricCount} rubric criteria
                      </span>
                      <Link
                        href={`/courses/${courseId}/assignments/${assignment.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                      >
                        <Settings2 className="h-4 w-4" />
                        Configure
                      </Link>
                    </div>

                    {/* submission overview */}
                    {assignment.mode === "group" ? (
                      <div className="space-y-3">
                        {assignmentGroups.map((group) => {
                          const members = groupMembers
                            .filter((m) => m.groupId === group.id)
                            .map((m) => enrolled.find((s) => s.id === m.studentId))
                            .filter(Boolean) as Profile[];
                          const allSubmitted =
                            members.length > 0 &&
                            members.every((m) => studentState(assignment.id, m.id) === "submitted");
                          return (
                            <div key={group.id} className="overflow-hidden rounded-lg border">
                              <div className="flex items-center justify-between bg-muted/40 px-3 py-2">
                                <span className="text-sm font-medium">{group.name}</span>
                                <StatusText state={allSubmitted ? "submitted" : "late"} />
                              </div>
                              {members.map((m) => (
                                <MemberRow key={m.id} student={m} state={studentState(assignment.id, m.id)} />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border">
                        {enrolled.map((s) => (
                          <MemberRow key={s.id} student={s} state={studentState(assignment.id, s.id)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function MemberRow({ student, state }: { student: Profile; state: SubState }) {
  return (
    <div className="flex items-center gap-3 border-t px-3 py-2.5 first:border-t-0">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-primary"
        style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
      >
        {initials(student.fullName)}
      </span>
      <span className="flex-1 text-sm">{student.fullName}</span>
      <StatusText state={state} />
    </div>
  );
}