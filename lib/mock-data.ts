export type Role = "teacher" | "student";

export type Profile = {
  id: string;              
  role: Role;
  fullName: string;
  institutionId: string;  
  email: string;
};

export type Course = {
  id: string;
  code: string;           
  name: string;
  teacherId: string;
};

export type Section = {
  id: string;
  courseId: string;
  name: string;
  joinCode: string;
};

export type SectionEnrollment = {
  sectionId: string;
  studentId: string;
};

export type Assignment = {
  id: string;
  sectionId: string;
  title: string;
  mode: "individual" | "group";
  dueDate: string;
  focusNotes: string;
  // added for the assignment builder form (optional → existing data stays valid):
  totalMarks?: number;
  description?: string;
  requiredMaterials?: ("report" | "code" | "slides")[];
  rubric?: RubricCriterion[];
  maxGroupSize?: number;
};

export type SubmissionStatus = "missing" | "pending" | "complete";

export type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  projectReport: SubmissionStatus;
  sourceCode: SubmissionStatus;
  slides: SubmissionStatus;
};

export type VivaSlot = {
  id: string;
  sectionId: string;
  assignmentId: string;
  startTime: string;       
  endTime: string;
  status: "open" | "pending" | "closed";
  bookedByStudentId?: string;
  bookedByGroupId?: string;
};

export type JoinRequest = {
  id: string;
  sectionId: string;
  fullName: string;
  email: string;
  requestedAt: string;        // ISO datetime
  isUniversityEmail: boolean;
};

export type RubricCriterion = {
  criterion: string;
  weight: number;             // percent, 0–100
};

export type ProjectGroup = {
  id: string;
  assignmentId: string;
  name: string;
  inviteCode: string;
  maxMembers: number;
  isOpen: boolean;
};

export type GroupMember = {
  groupId: string;
  studentId: string;
  joinedAt: string;
};

export type NotificationKind =
  | "student_enrolled"     // a student joined a course/section
  | "viva_booked"          // a student booked a viva slot
  | "ready_to_present"     // a student clicked "I'm ready" — teacher must act
  | "join_request"         // a pending enrolment request (non-auto-admitted)
  | "submission_received"  // a group/student submitted assignment files
  | "viva_activated"       // (student-facing) the teacher started your viva
  | "grade_posted";        // (student-facing) a grade/feedback is available

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  forRole: "teacher" | "student";
  title: string;
  detail?: string;
  createdAt: string;           // ISO datetime
  read: boolean;
  actionRequired?: boolean;
  studentId?: string;
  sectionId?: string;
  vivaSlotId?: string;
};

// GIVEN to the engine when a session starts:
export type VivaSessionContext = {
  sessionId: string;
  student: { id: string; fullName: string };
  assignment: {
    id: string;
    title: string;
    description: string;
    rubric: { criterion: string; weight: number }[];
    focusNotes: string;                 // teacher's focus areas for the examiner
    mode: "individual" | "group";
  };
  submissionText?: string;              // extracted text of the student's upload, for grounding questions
  config: {
    questionCount: number;
    maxSecondsPerAnswer: number;
    allowParaphrase: boolean;           // from Settings
    voiceName?: string;                 // TTS voice from Settings
    voiceRate?: number;
  };
  // NOTE: the live MediaStream (camera/mic) is provided at runtime via getUserMedia,
  // not inside this object.
};

// PRODUCED per question (stream these as the session runs):
export type VivaAnswerRecord = {
  questionIndex: number;
  questionText: string;
  transcript: string;
  startedAt: string;                    // ISO
  endedAt: string;                      // ISO
  scores: {
    technicalKnowledge: number;         // 0..100
    answerDepth: number;                // 0..100
    confidence: number;                 // 0..100, DERIVED from signals (not arbitrary)
  };
  signals: {                            // measurable freerider/behaviour signals
    pitchVariance?: number;
    pauseRatio?: number;
    speechEnergy?: number;
    blinkRate?: number;
    headPoseVariance?: number;
    gazeOnScreen?: number;
  };
  liveFeedback?: string[];              // e.g. ["maintain eye contact", "long pause"]
};

// PRODUCED at the end — this is what the Review page renders:
export type VivaReport = {
  sessionId: string;
  studentId: string;
  overallScore: number;                 // 0..100, weighted + explainable
  rubricScores: {
    technicalKnowledge: number;
    communicationClarity: number;
    answerDepth: number;
    confidenceLevel: number;
    freeriderRisk: number;              // higher = more risk
    aiAuthorshipRiskOral: number;       // from the oral signals
    aiAuthorshipRiskMaterial: number;   // from analysing the uploaded document
  };
  answers: VivaAnswerRecord[];
  transcript: string;                   // full session
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  createdAt: string;
};
// ---------------------------------------------------------------------------

export const mockTeacher: Profile = {
  id: "t-001",
  role: "teacher",
  fullName: "Dr. Sarah Chen",
  institutionId: "STAFF-4471",
  email: "s.chen@university.edu",
};

export const mockStudents: Profile[] = [
  {
    id: "s-001",
    role: "student",
    fullName: "Alice Johnson",
    institutionId: "2021001",
    email: "alice.j@university.edu",
  },
  {
    id: "s-002",
    role: "student",
    fullName: "Bob Smith",
    institutionId: "2021002",
    email: "bob.s@university.edu",
  },
  {
    id: "s-003",
    role: "student",
    fullName: "Carol Davis",
    institutionId: "2021003",
    email: "carol.d@university.edu",
  },
];

export const mockNotifications: AppNotification[] = [
  // --- teacher ---
  {
    id: "n-001",
    kind: "ready_to_present",
    forRole: "teacher",
    title: "Bob Smith is ready to present",
    detail: "Final project — E-commerce platform · CS101-B",
    createdAt: "2026-07-19T13:05:00",
    read: false,
    actionRequired: true,
    studentId: "s-002",
    sectionId: "sec-001",
    vivaSlotId: "v-005",
  },
  {
    id: "n-002",
    kind: "join_request",
    forRole: "teacher",
    title: "Omar Farouk requested to join CS101",
    detail: "omar.f@gmail.com · not a university email",
    createdAt: "2026-07-19T11:40:00",
    read: false,
    actionRequired: true,
    studentId: undefined,
    sectionId: "sec-001",
  },
  {
    id: "n-003",
    kind: "viva_booked",
    forRole: "teacher",
    title: "Alice Johnson booked a viva",
    detail: "Aug 20, 09:00 · CS101-A",
    createdAt: "2026-07-19T09:15:00",
    read: false,
    studentId: "s-001",
    sectionId: "sec-001",
    vivaSlotId: "v-001",
  },
  {
    id: "n-004",
    kind: "submission_received",
    forRole: "teacher",
    title: "Group A submitted Final project",
    detail: "Alice Johnson, Carol Davis · CS101-A",
    createdAt: "2026-07-18T16:20:00",
    read: true,
    sectionId: "sec-001",
  },
  {
    id: "n-005",
    kind: "student_enrolled",
    forRole: "teacher",
    title: "Nadia Hassan joined CS101",
    detail: "Section A",
    createdAt: "2026-07-18T10:00:00",
    read: true,
    sectionId: "sec-001",
  },

  // --- student ---
  {
    id: "n-101",
    kind: "viva_activated",
    forRole: "student",
    title: "Your viva has started",
    detail: "Join now — your examiner is waiting",
    createdAt: "2026-07-19T13:06:00",
    read: false,
    actionRequired: true,
    vivaSlotId: "v-001",
  },
  {
    id: "n-102",
    kind: "grade_posted",
    forRole: "student",
    title: "Your grade for Final project is available",
    detail: "CS101-A · view feedback",
    createdAt: "2026-07-17T14:30:00",
    read: true,
  },
];
// ---------------------------------------------------------------------------

export function getCurrentUser(): Profile {
  return mockTeacher;        // <-- swap to mockStudents[0] to view as a student
}

// ---------------------------------------------------------------------------

export const mockCourses: Course[] = [
  { id: "c-001", code: "CS101", name: "Intro to Software Engineering", teacherId: "t-001" },
  { id: "c-002", code: "CS204", name: "Database Systems", teacherId: "t-001" },
];

export const mockSections: Section[] = [
  { id: "sec-001", courseId: "c-001", name: "Section A", joinCode: "7X4Q" },
  { id: "sec-002", courseId: "c-001", name: "Section B", joinCode: "K2M9" },
];

export const mockSectionEnrollments: SectionEnrollment[] = [
  { sectionId: "sec-001", studentId: "s-001" }, // Alice
  { sectionId: "sec-001", studentId: "s-002" }, // Bob
  { sectionId: "sec-001", studentId: "s-003" }, // Carol
  // sec-002 (Section B) has no students yet — good for testing the empty state
];

export const mockAssignments: Assignment[] = [
  {
    id: "a-001",
    sectionId: "sec-001",
    title: "Final Project — E-Commerce Platform",
    mode: "group",
    dueDate: "2026-08-14",
    focusNotes: "Probe on architecture decisions and security implementation.",
    totalMarks: 100,
    description: "Build a full-stack e-commerce platform with authentication, product catalog, cart, and checkout.",
    requiredMaterials: ["report", "code", "slides"],
    rubric: [
      { criterion: "Technical implementation", weight: 40 },
      { criterion: "Architecture & design", weight: 30 },
      { criterion: "Documentation & report", weight: 30 },
    ],
    maxGroupSize: 4,
  },
];

export const mockProjectGroups: ProjectGroup[] = [
  {
    id: "group-001",
    assignmentId: "a-001",
    name: "Group A",
    inviteCode: "GA7K2",
    maxMembers: 4,
    isOpen: true,
  },
  {
    id: "group-002",
    assignmentId: "a-001",
    name: "Group B",
    inviteCode: "GB4M8",
    maxMembers: 4,
    isOpen: true,
  },
];

export const mockGroupMembers: GroupMember[] = [
  {
    groupId: "group-001",
    studentId: "s-001",
    joinedAt: "2026-07-10T10:00:00",
  },
  {
    groupId: "group-001",
    studentId: "s-003",
    joinedAt: "2026-07-10T10:05:00",
  },
  {
    groupId: "group-002",
    studentId: "s-002",
    joinedAt: "2026-07-11T09:30:00",
  },
];
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------

export const mockSubmissions: Submission[] = [
  {
    id: "sub-001",
    assignmentId: "a-001",
    studentId: "s-001",
    projectReport: "complete",
    sourceCode: "complete",
    slides: "complete",
  },
  {
    id: "sub-002",
    assignmentId: "a-001",
    studentId: "s-002",
    projectReport: "missing",
    sourceCode: "complete",
    slides: "pending",
  },
  
];


export const mockVivaSlots: VivaSlot[] = [
  {
    id: "v-001",
    sectionId: "sec-001",
    assignmentId: "a-001",
    startTime: "2026-08-20T09:00:00",
    endTime: "2026-08-20T09:20:00",
    status: "pending",
    bookedByStudentId: "s-001",
  },
  {
    id: "v-002",
    sectionId: "sec-001",
    assignmentId: "a-001",
    startTime: "2026-08-20T09:30:00",
    endTime: "2026-08-20T09:50:00",
    status: "open",
  },
  {
    id: "v-003",
    sectionId: "sec-001",
    assignmentId: "a-001",
    startTime: "2026-08-20T10:00:00",
    endTime: "2026-08-20T10:20:00",
    status: "closed",
  },
  {
    id: "v-004",
    sectionId: "sec-001",
    assignmentId: "a-001",
    startTime: "2026-08-20T09:30:00",
    endTime: "2026-08-20T09:50:00",
    status: "pending",
    bookedByStudentId: "s-003",   // Carol — ready → Activate button
  },
  {
    id: "v-005",
    sectionId: "sec-001",
    assignmentId: "a-001",
    startTime: "2026-08-20T10:30:00",
    endTime: "2026-08-20T10:50:00",
    status: "pending",
    bookedByStudentId: "s-002",   // Bob — incomplete → Not ready
  },
];
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------

export function getCoursesForTeacher(teacherId: string): Course[] {
  return mockCourses.filter((c) => c.teacherId === teacherId);
}

export function getStudentsInSection(sectionId: string): Profile[] {
  const ids = new Set(
    mockSectionEnrollments
      .filter((e) => e.sectionId === sectionId)
      .map((e) => e.studentId),
  );
  return mockStudents.filter((s) => ids.has(s.id));
}

export function getSubmissionForStudent(
  assignmentId: string,
  studentId: string,
): Submission | undefined {
  return mockSubmissions.find(
    (s) => s.assignmentId === assignmentId && s.studentId === studentId,
  );
}

export function getSlotsForSection(sectionId: string): VivaSlot[] {
  return mockVivaSlots.filter((s) => s.sectionId === sectionId);
}

export const mockJoinRequests: JoinRequest[] = [
  {
    id: "req-001",
    sectionId: "sec-001",
    fullName: "Nadia Hassan",
    email: "n.hassan@university.edu",
    requestedAt: "2026-07-19T07:00:00",
    isUniversityEmail: true,
  },
  {
    id: "req-002",
    sectionId: "sec-001",
    fullName: "Omar Farouk",
    email: "omar.f@gmail.com",
    requestedAt: "2026-07-19T04:00:00",
    isUniversityEmail: false,
  },
];

export function getJoinRequestsForSection(sectionId: string): JoinRequest[] {
  return mockJoinRequests.filter((r) => r.sectionId === sectionId);
}

export function getAssignmentsForSection(sectionId: string): Assignment[] {
  return mockAssignments.filter((a) => a.sectionId === sectionId);
}

export function getGroupsForAssignment(assignmentId: string): ProjectGroup[] {
  return mockProjectGroups.filter((group) => group.assignmentId === assignmentId);
}

export function getStudentsInGroup(groupId: string): Profile[] {
  const studentIds = new Set(
    mockGroupMembers
      .filter((member) => member.groupId === groupId)
      .map((member) => member.studentId),
  );

  return mockStudents.filter((student) => studentIds.has(student.id));
}

export function getVivaSlotsForAssignment(assignmentId: string): VivaSlot[] {
  return mockVivaSlots.filter((slot) => slot.assignmentId === assignmentId);
}

// "X / Y submitted" for the assignments tab:
// Y = students in the section, X = those who have a submission for this assignment
export function submissionCountForAssignment(assignmentId: string) {
  const asg = mockAssignments.find((a) => a.id === assignmentId);
  const sectionStudents = asg ? getStudentsInSection(asg.sectionId) : [];
  const submitted = sectionStudents.filter((st) =>
    mockSubmissions.some(
      (s) => s.assignmentId === assignmentId && s.studentId === st.id,
    ),
  ).length;
  return { submitted, total: sectionStudents.length };
}

export function getNotificationsFor(role: "teacher" | "student"): AppNotification[] {
  return mockNotifications
    .filter((n) => n.forRole === role)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first
}

export function unreadCount(role: "teacher" | "student"): number {
  return mockNotifications.filter((n) => n.forRole === role && !n.read).length;
}