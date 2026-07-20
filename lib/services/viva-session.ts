import {
  VivaQuestion,
  VivaSessionContext,
  VivaSessionState,
  VivaSessionStatus,
  VivaAnswerRecord,
} from "../viva-types";

export class VivaSessionManager {

  private state: VivaSessionState;

  constructor(
    context: VivaSessionContext,
    questions: VivaQuestion[],
  ) {

    this.state = {

      status: VivaSessionStatus.NOT_STARTED,

      context,

      questions,

      currentQuestionIndex: 0,

      answers: [],
    };
  }

  public getState(): VivaSessionState {
    return this.state;
  }

  public startSession(): void {

    if (this.state.status !== VivaSessionStatus.NOT_STARTED)
      return;

    this.state.status = VivaSessionStatus.IN_PROGRESS;

    this.state.startedAt = new Date().toISOString();
  }

  public completeSession(): void {

    if (this.state.status !== VivaSessionStatus.IN_PROGRESS)
      return;

    this.state.status = VivaSessionStatus.COMPLETED;

    this.state.completedAt = new Date().toISOString();
  }

  public getCurrentQuestion(): VivaQuestion | null {

    return (
      this.state.questions[
        this.state.currentQuestionIndex
      ] ?? null
    );
  }

  public nextQuestion(): VivaQuestion | null {

    if (
      this.state.currentQuestionIndex <
      this.state.questions.length - 1
    ) {

      this.state.currentQuestionIndex++;

      return this.getCurrentQuestion();
    }

    this.completeSession();

    return null;
  }

  public addAnswer(
    answer: VivaAnswerRecord,
  ): void {

    this.state.answers.push(answer);
  }

  public isComplete(): boolean {

    return (
      this.state.status ===
      VivaSessionStatus.COMPLETED
    );
  }

  public progress() {

    return {

      current:
        this.state.currentQuestionIndex + 1,

      total:
        this.state.questions.length,
    };
  }

}