"use client";

// components/course/student-course-detail.tsx
// Student-facing course shell: header + tabs (Assignments | Viva schedule |
// Materials). No Students tab (not a student concern) and no section
// switcher — a student only ever sees their own section within the course.

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FolderOpen,
} from "lucide-react";
import {
  type Course,
  getCurrentUser,
  getAssignmentsForSection,
  mockSections,
  mockSectionEnrollments,
} from "@/lib/mock-data";
import StudentAssignmentsTab from "@/components/course/students-assignments-tab";
import StudentVivaTab from "@/components/course/student-viva-tab";
import CourseMaterialsTab from "@/components/course/course-materials-tab";

type Tab = "assignments" | "viva" | "materials";

const TABS = [
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  { id: "viva", label: "Viva schedule", icon: CalendarClock },
  { id: "materials", label: "Materials", icon: FolderOpen },
] as const;

export default function StudentCourseDetail({ course }: { course: Course }) {
  const student = getCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>("assignments");

  const mySectionIds = new Set(
    mockSectionEnrollments
      .filter((e) => e.studentId === student.id)
      .map((e) => e.sectionId),
  );
  const section = mockSections.find(
    (s) => s.courseId === course.id && mySectionIds.has(s.id),
  );

  if (!section) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h1 className="text-xl font-semibold">{course.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;re not enrolled in a section of this course yet.
        </p>
      </section>
    );
  }

  const sectionAssignments = getAssignmentsForSection(section.id);

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Courses
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{course.name}</h1>
          <span className="rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            {course.code}
          </span>
          <span className="rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            {section.name}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Your assignments, viva schedule and course materials.
        </p>
      </header>

      <nav className="mt-7 flex gap-6 overflow-x-auto border-b">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                "relative flex items-center gap-1.5 whitespace-nowrap pb-3 text-sm transition-colors " +
                (active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {active && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
            </button>
          );
        })}
      </nav>

      <div className="mt-5">
        {activeTab === "assignments" && (
          <StudentAssignmentsTab
            courseId={course.id}
            assignments={sectionAssignments}
            studentId={student.id}
          />
        )}

        {activeTab === "viva" && (
          <StudentVivaTab sectionId={section.id} studentId={student.id} />
        )}

        {activeTab === "materials" && (
          <CourseMaterialsTab courseId={course.id} readOnly />
        )}
      </div>
    </div>
  );
}
