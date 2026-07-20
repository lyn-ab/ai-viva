import { getCurrentUser } from "@/lib/mock-data";
import InstructorDashboard from "@/components/dashboards/instructor-dashboard";
import StudentDashboard from "@/components/dashboards/student-dashboard";

export default function DashboardPage() {
  const user = getCurrentUser();
  return user.role === "teacher" ? <InstructorDashboard /> : <StudentDashboard />;
}