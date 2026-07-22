"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FolderOpen,
  Plus,
  Users,
} from "lucide-react";

import {
  type Assignment,
  type Course,
  type JoinRequest,
  type Profile,
  getStudentsInSection,
  mockAssignments,
  mockGroupMembers,
  mockJoinRequests,
  mockProjectGroups,
  mockSections,
} from "@/lib/mock-data";

import AssignmentBuilder from "@/components/assignment/assignment-builder";
import AssignmentsTab from "@/components/course/assignments-tab";
import CourseMaterialsTab from "@/components/course/course-materials-tab";
import StudentsTab from "@/components/course/students-tab";
import VivaScheduleTab from "@/components/course/viva-schedule-tab";

type Tab = "students" | "assignments" | "viva" | "materials";

const TABS = [
  {
    id: "students",
    label: "Students",
    icon: Users,
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: ClipboardList,
  },
  {
    id: "viva",
    label: "Viva schedule",
    icon: CalendarClock,
  },
  {
    id: "materials",
    label: "Materials",
    icon: FolderOpen,
  },
] as const;

export default function CourseDetail({
  course,
}: {
  course: Course;
}) {
  const sections = useMemo(
    () =>
      mockSections.filter(
        (section) => section.courseId === course.id,
      ),
    [course.id],
  );

  const [sectionId, setSectionId] = useState(
    sections[0]?.id ?? "",
  );

  const [activeTab, setActiveTab] =
    useState<Tab>("students");

  const [assignments, setAssignments] =
    useState<Assignment[]>(mockAssignments);

  const [joinRequests, setJoinRequests] =
    useState<JoinRequest[]>(mockJoinRequests);

  const [enrolledBySection, setEnrolledBySection] =
    useState<Record<string, Profile[]>>(() =>
      Object.fromEntries(
        sections.map((section) => [
          section.id,
          getStudentsInSection(section.id),
        ]),
      ),
    );

  const [
    expandedAssignmentId,
    setExpandedAssignmentId,
  ] = useState<string | null>(null);

  const [builderOpen, setBuilderOpen] =
    useState(false);

  const section = sections.find(
    (item) => item.id === sectionId,
  );

  const enrolled =
    enrolledBySection[sectionId] ?? [];

  const sectionAssignments = assignments.filter(
    (assignment) =>
      assignment.sectionId === sectionId,
  );

  const sectionRequests = joinRequests.filter(
    (request) => request.sectionId === sectionId,
  );

  function changeSection(nextSectionId: string) {
    setSectionId(nextSectionId);
    setExpandedAssignmentId(null);
  }

  function approveRequests(requestIds: string[]) {
    const approvedRequests = joinRequests.filter(
      (request) =>
        request.sectionId === sectionId &&
        requestIds.includes(request.id),
    );

    if (approvedRequests.length === 0) {
      return;
    }

    const newStudents: Profile[] =
      approvedRequests.map((request, index) => ({
        id: `local-student-${Date.now()}-${index}`,
        role: "student",
        fullName: request.fullName,
        institutionId: `PENDING-${String(
          enrolled.length + index + 1,
        ).padStart(3, "0")}`,
        email: request.email,
      }));

    setEnrolledBySection((current) => ({
      ...current,
      [sectionId]: [
        ...(current[sectionId] ?? []),
        ...newStudents,
      ],
    }));

    setJoinRequests((current) =>
      current.filter(
        (request) =>
          !requestIds.includes(request.id),
      ),
    );

    // TODO(supabase):
    // Approve the requests and create section enrolments.
  }

  function declineRequests(requestIds: string[]) {
    setJoinRequests((current) =>
      current.filter(
        (request) =>
          !requestIds.includes(request.id),
      ),
    );

    // TODO(supabase):
    // Mark the selected requests as declined.
  }

  if (!section) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h1 className="text-xl font-semibold">
          {course.name}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          This course does not have any sections yet.
        </p>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Courses
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {course.name}
            </h1>

            <span className="rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {course.code}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage students, assignments, resources and
            viva schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-muted-foreground">
            Section
          </span>

          {sections.map((item) => {
            const active =
              item.id === sectionId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  changeSection(item.id)
                }
                className={
                  active
                    ? "rounded-full border px-3 py-1.5 text-xs font-medium text-primary"
                    : "rounded-full border bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                }
                style={
                  active
                    ? {
                        backgroundColor:
                          "hsl(var(--primary) / 0.14)",
                      }
                    : undefined
                }
              >
                {item.name}
              </button>
            );
          })}

          <button
            type="button"
            aria-label="Add section"
            className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </header>

      <nav className="mt-7 flex gap-6 overflow-x-auto border-b">
        {TABS.map((tab) => {
          const active =
            activeTab === tab.id;

          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={
                "relative flex items-center gap-1.5 whitespace-nowrap pb-3 text-sm transition-colors " +
                (active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="h-4 w-4" />

              {tab.label}

              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-5">
        {activeTab === "students" && (
          <StudentsTab
            key={section.id}
            section={section}
            enrolled={enrolled}
            requests={sectionRequests}
            onApprove={approveRequests}
            onDecline={declineRequests}
          />
        )}

        {activeTab === "assignments" && (
          <AssignmentsTab
            courseId={course.id}
            assignments={sectionAssignments}
            enrolled={enrolled}
            groups={mockProjectGroups}
            groupMembers={mockGroupMembers}
            expandedAssignmentId={
              expandedAssignmentId
            }
            onToggleExpanded={(id) =>
              setExpandedAssignmentId(
                (current) =>
                  current === id ? null : id,
              )
            }
            onCreate={() =>
              setBuilderOpen(true)
            }
          />
        )}

        {activeTab === "viva" && (
          <VivaScheduleTab
            sectionId={sectionId}
          />
        )}

        {activeTab === "materials" && (
          <CourseMaterialsTab
            courseId={course.id}
          />
        )}
      </div>

      {builderOpen && (
        <AssignmentBuilder
          sectionId={sectionId}
          onClose={() =>
            setBuilderOpen(false)
          }
          onCreated={(assignment) => {
            setAssignments((current) => [
              ...current,
              assignment,
            ]);

            setExpandedAssignmentId(
              assignment.id,
            );

            setBuilderOpen(false);

            // TODO(supabase):
            // Insert the assignment into the database.
          }}
        />
      )}
    </div>
  );
}