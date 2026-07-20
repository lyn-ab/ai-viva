"use client";

import { useParams } from "next/navigation";
import {
  mockAssignments,
  mockCourses,
  mockSections,
} from "@/lib/mock-data";
import AssignmentDetail from "@/components/assignment/assignment-detail";

export default function AssignmentDetailPage() {
  const params = useParams<{
    id: string;
    assignmentId: string;
  }>();

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

  return (
    <AssignmentDetail
      course={course}
      assignment={assignment}
      section={section}
    />
  );
}