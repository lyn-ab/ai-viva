"use client";

// components/assignment/student-assignment-detail.tsx
// Student-facing assignment detail: header + tabs (Files | Group | My
// submission). Group only shows for group-mode assignments. No Viva tab
// (already covered by the separate student viva tab elsewhere). Reads
// everything from mock-data.

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FolderOpen,
  ClipboardCheck,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Circle,
  Users,
} from "lucide-react";
import {
  type Assignment,
  type Course,
  type Section,
  type GroupMember,
  mockSubmissions,
  mockGroupMembers,
  mockStudents,
  getCurrentUser,
  getGroupsForAssignment,
} from "@/lib/mock-data";
import { initials } from "@/lib/course-utils";

// ---- submission item helpers ---------------------------------------------
type SubmissionItemKey = "projectReport" | "sourceCode" | "slides";
type SubmissionItemStatus = "complete" | "pending" | "missing";

const ITEM_LABEL: Record<SubmissionItemKey, string> = {
  projectReport: "Project report",
  sourceCode: "Source code",
  slides: "Slides",
};

const STATUS_META: Record<
  SubmissionItemStatus,
  { label: string; color: string; Icon: typeof Circle }
> = {
  complete: { label: "Submitted", color: "hsl(var(--success))", Icon: CheckCircle2 },
  pending: { label: "Awaiting review", color: "hsl(var(--warning))", Icon: Clock },
  missing: { label: "Not submitted", color: "hsl(var(--muted-foreground))", Icon: Circle },
};

// ---- component ------------------------------------------------------------
export default function StudentAssignmentDetail({
  course,
  assignment,
  section,
}: {
  course: Course;
  assignment: Assignment;
  section: Section;
}) {
  const isGroup = assignment.mode === "group";
  const tabs = [
    { id: "files" as const, label: "Files", icon: FolderOpen },
    ...(isGroup ? [{ id: "group" as const, label: "Group", icon: Users }] : []),
    { id: "submission" as const, label: "My submission", icon: ClipboardCheck },
  ];
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("files");

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
        <Badge>
          {course.code} · {section.name}
        </Badge>
        <Badge>{assignment.mode === "group" ? "Group" : "Individual"}</Badge>
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
        {tab === "group" && isGroup && <GroupTab assignment={assignment} />}
        {tab === "submission" && <SubmissionTab assignment={assignment} />}
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

// ---- Files tab (read-only for students) -----------------------------------
function FilesTab({ assignment }: { assignment: Assignment }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Assignment files</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Files provided by your instructor for this assignment.
        </p>
        <div className="mt-4 space-y-3">
          <FileRow label="Project brief" />
          <FileRow label="Rubric file" />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Rubric criteria</h2>
        {assignment.rubric && assignment.rubric.length > 0 ? (
          <div className="mt-3 space-y-2">
            {assignment.rubric.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b py-2 text-sm last:border-0"
              >
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
            <span
              key={m}
              className="rounded-full border bg-muted px-2.5 py-1 text-xs capitalize text-muted-foreground"
            >
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

function FileRow({ label }: { label: string }) {
  // TODO(supabase): point this at the actual stored brief/rubric file URL
  // for this assignment once file storage exists. Students only view/
  // download here — no upload control, unlike the teacher's Files tab.
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-primary"
        style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
      >
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">Provided by instructor</p>
      </div>
    </div>
  );
}

// ---- Group tab (student joins a group; teacher creates them elsewhere) ----
function GroupTab({ assignment }: { assignment: Assignment }) {
  const student = getCurrentUser();
  const groups = getGroupsForAssignment(assignment.id);

  // Seed local state from the mock layer, then mutate locally — same
  // "functional against local state" convention as the viva booking tab.
  const [members, setMembers] = useState<GroupMember[]>(() =>
    mockGroupMembers.filter((m) => groups.some((g) => g.id === m.groupId)),
  );
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  const memberCountOf = (groupId: string) => members.filter((m) => m.groupId === groupId).length;
  const myMembership = members.find((m) => m.studentId === student.id);
  const myGroup = myMembership ? groups.find((g) => g.id === myMembership.groupId) : undefined;

  function joinGroup(groupId: string) {
    setMembers((cur) => [...cur, { groupId, studentId: student.id, joinedAt: new Date().toISOString() }]);
    setInviteError(null);
    setInviteCode("");
    // TODO(supabase): insert into group_members with a server-side check on
    // maxMembers and that the student isn't already in another group.
  }

  function joinByInviteCode() {
    const code = inviteCode.trim().toUpperCase();
    const group = groups.find((g) => g.inviteCode.toUpperCase() === code);
    if (!group) {
      setInviteError("No group matches that code.");
      return;
    }
    if (memberCountOf(group.id) >= group.maxMembers) {
      setInviteError("That group is already full.");
      return;
    }
    joinGroup(group.id);
  }

  if (myGroup) {
    const groupMembers = mockStudents.filter((s) =>
      members.some((m) => m.groupId === myGroup.id && m.studentId === s.id),
    );
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-5 w-5 text-muted-foreground" /> {myGroup.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;re in this group · {groupMembers.length}/{myGroup.maxMembers} members
        </p>
        <div className="mt-4 space-y-2">
          {groupMembers.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-primary"
                style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
              >
                {initials(s.fullName)}
              </div>
              <p className="text-sm font-medium">
                {s.fullName}
                {s.id === student.id ? " (You)" : ""}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Users className="h-5 w-5 text-muted-foreground" /> Join a group
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This is a group assignment. Join an open group below, or use an invite code from a teammate.
      </p>

      <div className="mt-4 space-y-2">
        {groups.map((g) => {
          const count = memberCountOf(g.id);
          const full = count >= g.maxMembers;
          return (
            <div key={g.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">{count}/{g.maxMembers} members</p>
              </div>
              <button
                type="button"
                disabled={!g.isOpen || full}
                onClick={() => joinGroup(g.id)}
                className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {full ? "Full" : "Join"}
              </button>
            </div>
          );
        })}
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">No groups have been created yet.</p>
        )}
      </div>

      <div className="mt-5 border-t pt-4">
        <p className="text-sm font-medium">Have an invite code?</p>
        <div className="mt-2 flex gap-2">
          <input
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value.toUpperCase());
              setInviteError(null);
            }}
            placeholder="e.g. GA7K2"
            className="w-full max-w-[180px] rounded-md border bg-background px-3 py-2 text-sm font-mono tracking-wider outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={inviteCode.trim() === ""}
            onClick={joinByInviteCode}
            className="shrink-0 rounded-md bg-muted px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            Join with code
          </button>
        </div>
        {inviteError && (
          <p className="mt-2 text-xs" style={{ color: "hsl(var(--destructive))" }}>
            {inviteError}
          </p>
        )}
      </div>
    </section>
  );
}

// ---- My submission tab (functional upload) --------------------------------
function SubmissionTab({ assignment }: { assignment: Assignment }) {
  const student = getCurrentUser();

  // Seed local state from the existing mock submission row, if one exists,
  // per PROMPT-1's "make it functional against local state" convention.
  const existing = mockSubmissions.find(
    (s) => s.assignmentId === assignment.id && s.studentId === student.id
  );

  const [items, setItems] = useState<
    Record<SubmissionItemKey, { status: SubmissionItemStatus; fileName: string | null }>
  >({
    projectReport: {
      status: (existing?.projectReport as SubmissionItemStatus) ?? "missing",
      fileName: null,
    },
    sourceCode: {
      status: (existing?.sourceCode as SubmissionItemStatus) ?? "missing",
      fileName: null,
    },
    slides: {
      status: (existing?.slides as SubmissionItemStatus) ?? "missing",
      fileName: null,
    },
  });

  function handleUpload(key: SubmissionItemKey, file: File) {
    // TODO(supabase): upload the file to storage and update this student's
    // submission row (projectReport/sourceCode/slides) instead of only
    // local state.
    setItems((prev) => ({
      ...prev,
      [key]: { status: "pending", fileName: file.name },
    }));
  }

  const keys = Object.keys(ITEM_LABEL) as SubmissionItemKey[];

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <ClipboardCheck className="h-5 w-5 text-muted-foreground" /> My submission
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload each required item below. Your instructor reviews submissions before grading.
      </p>

      <div className="mt-4 space-y-3">
        {keys.map((key) => {
          const item = items[key];
          const meta = STATUS_META[item.status];
          return (
            <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(key, f);
                  }}
                />
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-primary"
                  style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
                >
                  {item.fileName ? <FileText className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{ITEM_LABEL[key]}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.fileName ?? "Choose a file to upload"}
                  </p>
                </div>
              </label>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: meta.color }}
              >
                <meta.Icon className="h-3.5 w-3.5" /> {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}