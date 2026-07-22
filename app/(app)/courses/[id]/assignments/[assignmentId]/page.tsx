"use client";

import { useParams } from "next/navigation";
import {
  mockAssignments,
  mockCourses,
  mockSections,
  getCurrentUser,
} from "@/lib/mock-data";
import AssignmentDetail from "@/components/assignment/assignment-detail";
import StudentAssignmentDetail from "@/components/assignment/student-assignment-detail";

export default function AssignmentDetailPage() {
  const params = useParams<{
    id: string;
    assignmentId: string;
  }>();

  // NOTE: confirm this against the real `Profile.role` union in
  // mock-data.ts — branching on "student" here so an unrecognized/typo'd
  // role value falls back to the teacher view rather than silently hiding
  // a teacher's page.
  const user = getCurrentUser();

  const course = mockCourses.find(
    (item) => item.id === params.id,
  );

  const assignment = mockAssignments.find(
    (item) => item.id === params.assignmentId,
  );

  const section = assignment
    ? mockSections.find(
        (item) => item.id === assignment.sectionId,
      )
    : undefined;

  if (!course || !assignment || !section) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h1 className="text-xl font-semibold">
          Assignment not found
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The requested course or assignment could not be found.
        </p>
      </section>
    );
  }

  if (user.role === "student") {
    return (
      <StudentAssignmentDetail
        course={course}
        assignment={assignment}
        section={section}
      />
    );
  }

  return (
    <AssignmentDetail
      course={course}
      assignment={assignment}
      section={section}
    />
  );
}