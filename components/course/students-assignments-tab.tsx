"use client";

// components/course/student-assignments-tab.tsx
// Student view of assignments: same list shape as the teacher's
// AssignmentsTab, but shows only the current student's own status (never
// classmates'), and has no create/configure actions.

import Link from "next/link";
import {
  ClipboardList,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { type Assignment, mockSubmissions } from "@/lib/mock-data";
import { formatDate } from "@/lib/course-utils";

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
  late: { label: "In progress", color: "hsl(var(--warning))", Icon: AlertCircle },
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

const COLS = "lg:grid-cols-[minmax(240px,2.4fr)_110px_140px_90px_1fr]";

export default function StudentAssignmentsTab({
  courseId,
  assignments,
  studentId,
}: {
  courseId: string;
  assignments: Assignment[];
  studentId: string;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
        Assignments
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your briefs, rubrics and submission status for this section.
      </p>

      <div className="mt-5 overflow-hidden rounded-lg border">
        <div className={`hidden gap-4 border-b bg-muted/60 px-4 py-3 text-xs font-medium text-muted-foreground lg:grid ${COLS}`}>
          <span>Assignment</span>
          <span>Mode</span>
          <span>Due date</span>
          <span>Marks</span>
          <span>Your status</span>
        </div>

        {assignments.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No assignments yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your teacher hasn&apos;t posted an assignment for this section.
            </p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const state = studentState(assignment.id, studentId);
            return (
              <Link
                key={assignment.id}
                href={`/courses/${courseId}/assignments/${assignment.id}`}
                className={`grid gap-3 border-b px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/40 lg:items-center lg:gap-4 ${COLS}`}
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

                <StatusText state={state} />
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}