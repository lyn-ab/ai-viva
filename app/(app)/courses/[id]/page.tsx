"use client";

import { useParams } from "next/navigation";
import { mockCourses, getCurrentUser } from "@/lib/mock-data";
import CourseDetail from "@/components/course/course-detail";
import StudentCourseDetail from "@/components/course/student-course-detail";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const user = getCurrentUser();
  const course = mockCourses.find((item) => item.id === params.id);

  if (!course) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Course not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No course matches id: {params.id}
        </p>
      </div>
    );
  }

  return user.role === "teacher" ? (
    <CourseDetail course={course} />
  ) : (
    <StudentCourseDetail course={course} />
  );
}