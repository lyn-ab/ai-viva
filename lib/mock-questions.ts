import type { VivaQuestion } from "@/lib/viva-types";

// TODO(fastapi): this static bank goes away once QuestionService calls
// POST /generate-questions — kept here (not inline in a component) so the
// swap only touches question-service.ts, never the UI.
export const mockQuestionBank: VivaQuestion[] = [
  { id: "1", index: 1, text: "Introduce your project.", expectedDuration: 120 },
  { id: "2", index: 2, text: "Explain your methodology.", expectedDuration: 120 },
  { id: "3", index: 3, text: "Describe the architecture.", expectedDuration: 120 },
  { id: "4", index: 4, text: "What were the biggest technical challenges?", expectedDuration: 120 },
  { id: "5", index: 5, text: "How would you extend this project further?", expectedDuration: 120 },
];