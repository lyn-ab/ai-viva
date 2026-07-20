"use client";

// components/course/course-detail.tsx  — TARGET SHAPE (skeleton)
// Holds the shared state; each tab is its own component. The heavy assignment
// editing (files/groups/viva) moved to the assignment detail page.
// (Illustrative — the modals/handlers are trimmed to show the structure.)

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, ClipboardList, CalendarClock, FolderOpen } from "lucide-react";
import {
  type Course,
  mockSections,
  mockAssignments,
  mockProjectGroups,
  mockGroupMembers,
  getStudentsInSection,
} from "@/lib/mock-data";

import StudentsTab from "@/components/course/students-tab"; //work on this component
import AssignmentsTab from "@/components/course/assignments-tab";
import VivaScheduleTab from "@/components/course/viva-schedule-tab";
import CourseMaterialsTab from "@/components/course/course-materials-tab"; //work on this component
import AssignmentBuilder from "@/components/assignment/assignment-builder"; //work on this component

type Tab = "students" | "assignments" | "viva" | "materials";

const TABS = [
  { id: "students", label: "Students", icon: Users },
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  { id: "viva", label: "Viva schedule", icon: CalendarClock },
  { id: "materials", label: "Materials", icon: FolderOpen },
] as const;

export default function CourseDetail({ course }: { course: Course }) {
  const sections = useMemo(
    () => mockSections.filter((s) => s.courseId === course.id),
    [course.id],
  );

  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<Tab>("students");
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);

  const enrolled = getStudentsInSection(sectionId);
  const section = sections.find((s) => s.id === sectionId);

  return (
    <div>
      {/* header */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Courses
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{course.name}</h1>
        <span className="rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {course.code}
        </span>
      </div>

      {/* section switcher */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Section</span>
        {sections.map((s) => {
          const on = s.id === sectionId;
          return (
            <button
              key={s.id}
              onClick={() => setSectionId(s.id)}
              className={
                "rounded-full px-3 py-1 text-xs " +
                (on ? "text-primary" : "border bg-muted text-muted-foreground")
              }
              style={on ? { backgroundColor: "hsl(var(--primary) / 0.14)" } : undefined}
            >
              {s.name.replace("Section ", "")}
            </button>
          );
        })}
      </div>

      {/* tab nav */}
      <div className="mt-5 flex gap-5 border-b">
        {TABS.map((t) => {
          const on = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={
                "flex items-center gap-1.5 pb-2.5 text-sm " +
                (on ? "font-medium text-foreground" : "text-muted-foreground")
              }
              style={on ? { borderBottom: "2px solid hsl(var(--primary))" } : undefined}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* tab panels */}
      <div className="mt-5">
        {activeTab === "students" && section && (
          <StudentsTab section={section} enrolled={enrolled} />
        )}

        {activeTab === "assignments" && (
          <AssignmentsTab
            courseId={course.id}
            assignments={mockAssignments.filter((a) => a.sectionId === sectionId)}
            enrolled={enrolled}
            groups={mockProjectGroups}
            groupMembers={mockGroupMembers}
            expandedAssignmentId={expandedAssignmentId}
            onToggleExpanded={(id) =>
              setExpandedAssignmentId((cur) => (cur === id ? null : id))
            }
            onCreate={() => setBuilderOpen(true)}
          />
        )}

        {activeTab === "viva" && section && <VivaScheduleTab sectionId={sectionId} />}

        {activeTab === "materials" && <CourseMaterialsTab courseId={course.id} />}
      </div>

      {/* create-assignment modal */}
      {builderOpen && (
        <AssignmentBuilder
          sectionId={sectionId}
          onClose={() => setBuilderOpen(false)}
          onCreated={() => setBuilderOpen(false)}
        />
      )}
    </div>
  );
}