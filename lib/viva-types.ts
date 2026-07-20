export enum VivaSessionStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export interface VivaQuestion {
  id: string;
  index: number;
  text: string;
  expectedDuration: number;
}

export interface VivaSessionContext {
  sessionId: string;

  // Needed by the backend to look up group/course context (student_context_service)
  // and, for reportUrl, to extract the report text server-side (document_service).
  submissionId: string;
  reportUrl?: string;

  student: {
    id: string;
    fullName: string;
  };

  assignment: {
    id: string;
    title: string;
    description: string;

    rubric: {
      criterion: string;
      weight: number;
    }[];

    focusNotes: string;

    mode: "individual" | "group";
  };

  submissionText?: string;

  config: {
    questionCount: number;
    maxSecondsPerAnswer: number;
    allowParaphrase: boolean;
    voiceName?: string;
    voiceRate?: number;
  };
}

export interface VivaAnswerRecord {
  questionIndex: number;

  questionText: string;

  transcript: string;

  startedAt?: string;

  endedAt?: string;

  liveFeedback?: string[];
}

export interface VivaReport {
  sessionId: string;

  studentId: string;

  overallScore: number;

  answers: VivaAnswerRecord[];

  transcript: string;

  strengths: string[];

  weaknesses: string[];

  recommendations: string[];

  createdAt: string;
}

export interface VivaSessionState {
  status: VivaSessionStatus;

  context: VivaSessionContext;

  questions: VivaQuestion[];

  currentQuestionIndex: number;

  answers: VivaAnswerRecord[];

  startedAt?: string;

  completedAt?: string;
}