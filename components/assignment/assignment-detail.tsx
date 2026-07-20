"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type {
  Assignment,
  Course,
  Section,
} from "@/lib/mock-data";

type AssignmentDetailProps = {
  course: Course;
  assignment: Assignment;
  section: Section;
};

export default function AssignmentDetail({
  course,
  assignment,
  section,
}: AssignmentDetailProps) {
  return (
    <div className="mx-auto max-w-[1500px]">
      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {course.code}
      </Link>

      <section className="mt-4 rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          {course.code} · {section.name}
        </p>

        <h1 className="mt-1 text-2xl font-semibold">
          {assignment.title}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The assignment-detail route is working.
        </p>
      </section>
    </div>
  );
}