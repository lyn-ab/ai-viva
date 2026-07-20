import type { VivaQuestion, VivaSessionContext } from "@/lib/viva-types";
import { mockQuestionBank } from "@/lib/mock-questions";

// The UI only ever depends on this interface, never on how questions are
// actually produced. Swapping MockQuestionService for a FastAPI-backed
// implementation later is a one-line change at the bottom of this file —
// no component or page needs to change.
export interface QuestionService {
  getQuestions(context: VivaSessionContext): Promise<VivaQuestion[]>;
}

export class MockQuestionService implements QuestionService {
  async getQuestions(context: VivaSessionContext): Promise<VivaQuestion[]> {
    // TODO(ai): replace this body with a real call, e.g.
    //   const res = await fetch("/api/generate-questions", {
    //     method: "POST",
    //     body: JSON.stringify({ context }),
    //   });
    //   return res.json();
    // Signature (context in, Promise<VivaQuestion[]> out) stays identical,
    // so no caller needs to change when this swap happens.
    return mockQuestionBank.slice(0, context.config.questionCount);
  }
}

export class FastApiQuestionService implements QuestionService {
  async getQuestions(context: VivaSessionContext): Promise<VivaQuestion[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: context.sessionId,
        submissionId: context.submissionId,
        studentId: context.student.id,
        studentName: context.student.fullName,
        assignmentTitle: context.assignment.title,
        assignmentDescription: context.assignment.description,
        rubric: context.assignment.rubric,
        focusNotes: context.assignment.focusNotes,
        mode: context.assignment.mode,
        // Prefer reportUrl (backend extracts server-side via document_service).
        // Falls back to submissionText if the report was already extracted
        // client-side, or for local testing without a real uploaded file.
        reportUrl: context.reportUrl,
        submissionText: context.submissionText,
        questionCount: context.config.questionCount,
      }),
    });

    if (!res.ok) {
      throw new Error(`Question generation failed: ${res.status}`);
    }

    const data = await res.json();
    return data.questions as VivaQuestion[];
  }
}

// Single instance the app imports. Swapping the data source later means
// changing this one line (e.g. `new FastApiQuestionService()`), not any
// call site.
export const questionService: QuestionService = new FastApiQuestionService();