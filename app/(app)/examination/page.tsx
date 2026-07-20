"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Pause,
  Play,
  SkipForward,
  RotateCcw,
  Clock,
  MessageSquare,
} from "lucide-react";
import { VivaSessionManager } from "@/lib/services/viva-session";
import { questionService } from "@/lib/services/question-service";
import {
  VivaSessionStatus,
  type VivaSessionContext,
} from "@/lib/viva-types";
import { getCurrentUser, mockAssignments } from "@/lib/mock-data";

// How many questions this session should have. This is session config, not
// question content — the actual questions come from questionService, never
// hardcoded here.
const QUESTION_COUNT = 3;

// TODO(supabase): build this from the actual booked viva slot / assignment /
// student instead of the first mock assignment + current user. This is a
// placeholder context just so VivaSessionManager has something to run on.
function buildMockContext(): VivaSessionContext {
  const user = getCurrentUser();
  const assignment = mockAssignments[0];

  return {
    sessionId: `session-${assignment.id}-${user.id}`,
    submissionId: `submission-${assignment.id}-${user.id}`,  
    student: {
      id: user.id,
      fullName: user.fullName,
    },
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description ?? "",
      rubric: assignment.rubric ?? [],
      focusNotes: assignment.focusNotes,
      mode: assignment.mode,
    },
    config: {
      questionCount: QUESTION_COUNT,
      maxSecondsPerAnswer: 120,
      allowParaphrase: true,
    },
  };
}

function formatSeconds(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PageHeader() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-base font-semibold">AI viva examination</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Answer questions clearly and confidently
      </p>
    </div>
  );
}

export default function ExaminationPage() {
  // context is stable for the life of the page — built once, not re-derived
  // on every render.
  const [context] = useState<VivaSessionContext>(() => buildMockContext());

  const [manager, setManager] = useState<VivaSessionManager | null>(null);
  const [state, setState] = useState<ReturnType<VivaSessionManager["getState"]> | null>(
    null
  );
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Local, presentation-only control state. Not wired to real audio or
  // avatar behavior yet — see TODOs on the handlers below.
  const [paused, setPaused] = useState(false);

  // Questions come from questionService. The manager can't be constructed
  // until they arrive, since VivaSessionManager takes its question list in
  // the constructor.
  useEffect(() => {
    let cancelled = false;

    questionService
      .getQuestions(context)
      .then((questions) => {
        if (cancelled) return;
        const mgr = new VivaSessionManager(context, questions);
        setManager(mgr);
        setState(mgr.getState());
      })
      .catch(() => {
        if (!cancelled) {
          setQuestionsError("Could not load viva questions. Please retry.");
        }
      })
      .finally(() => {
        if (!cancelled) setQuestionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [context]);

  // getState() returns the same mutated object every call, so spread into a
  // fresh object here to guarantee React sees a new reference and re-renders.
  function refresh() {
    if (!manager) return;
    setState({ ...manager.getState() });
  }

  function handleStart() {
    if (!manager) return;
    manager.startSession();
    setPaused(false);
    // TODO(avatar): send current question to avatar
    // TODO(whisper): begin streaming microphone audio
    refresh();
  }

  function handlePauseResume() {
    // TODO(whisper): actually pause/resume the microphone audio stream.
    // TODO(avatar): actually pause/resume avatar speech + the answer timer.
    setPaused((p) => !p);
  }

  function handleNext() {
    if (!manager) return;
    manager.nextQuestion();
    setPaused(false);
    // TODO(scoring): submit completed answer for evaluation
    // TODO(avatar): send next question to avatar
    refresh();
  }

  function handleRepeat() {
    // TODO(avatar): re-play the current question's audio/animation from the
    // avatar. This intentionally does not change session state — it only
    // replays the current question.
  }

  if (questionsLoading) {
    return (
      <div className="space-y-4">
        <PageHeader />
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Loading questions…</p>
        </div>
      </div>
    );
  }

  if (questionsError || !manager || !state) {
    return (
      <div className="space-y-4">
        <PageHeader />
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p
            className="text-sm font-medium"
            style={{ color: "hsl(var(--destructive))" }}
          >
            {questionsError ?? "Something went wrong loading this session."}
          </p>
        </div>
      </div>
    );
  }

  const { current, total } = manager.progress();
  const currentQuestion = manager.getCurrentQuestion();
  const progressPct = total > 0 ? Math.round((current / total) * 100) : 0;

  const notStarted = state.status === VivaSessionStatus.NOT_STARTED;
  const inProgress = state.status === VivaSessionStatus.IN_PROGRESS;
  const completed = state.status === VivaSessionStatus.COMPLETED;

  const nextDisabled = notStarted || completed;
  const repeatDisabled = notStarted || completed;

  // Presentational proxies only — not tied to a real media stream yet.
  const isRecording = inProgress && !paused;
  const isAudioActive = inProgress && !paused;

  const captionText = notStarted
    ? "Press start to begin your viva."
    : completed
    ? "Session completed. Thank you."
    : currentQuestion?.text ?? "-";

  const timeRemainingLabel = formatSeconds(context.config.maxSecondsPerAnswer);

  return (
    <div className="space-y-4">
      <PageHeader />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Avatar panel */}
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full"
              style={{ backgroundColor: "hsl(var(--primary) / 0.14)" }}
            >
              <Bot className="h-12 w-12 text-primary" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              Dr. AI Examiner
            </p>
            <p className="text-xs text-muted-foreground">AI viva examiner</p>

            {/* current question, shown as a caption bubble beneath the avatar */}
            <div className="mt-4 w-full rounded-lg border bg-muted p-4">
              <p className="text-sm text-foreground">{captionText}</p>
            </div>

            <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: isRecording
                      ? "hsl(var(--destructive))"
                      : "hsl(var(--muted-foreground) / 0.4)",
                  }}
                />
                Recording
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: isAudioActive
                      ? "hsl(var(--success))"
                      : "hsl(var(--muted-foreground) / 0.4)",
                  }}
                />
                Audio active
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {timeRemainingLabel} remaining
              </div>
            </div>

            <div className="mt-5 w-full">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Question {current} of {total}
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: controls + live transcript */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Controls panel */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">Controls</h2>
            <div className="mt-3 flex flex-col gap-2">
              {notStarted ? (
                <button
                  onClick={handleStart}
                  className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Play className="h-4 w-4" />
                  Start
                </button>
              ) : (
                <button
                  onClick={handlePauseResume}
                  disabled={completed}
                  className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paused ? (
                    <>
                      <Play className="h-4 w-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={nextDisabled}
                className="flex items-center justify-center gap-2 rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SkipForward className="h-4 w-4" />
                Next question
              </button>

              <button
                onClick={handleRepeat}
                disabled={repeatDisabled}
                className="flex items-center justify-center gap-2 rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Repeat question
              </button>
            </div>
          </div>

          {/* Live transcript panel */}
          <div className="flex flex-1 flex-col rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-base font-semibold">Live transcript</h2>
            </div>

            {/*
              Static placeholder shell only. This is NOT wired to the Web
              Speech API captioning test — that capability check lives only
              on the Camera Test page's Captioning Test panel. Production
              transcription here will come from the Whisper pipeline once a
              session is actually live.
              TODO(whisper): stream real transcript entries into this panel.
            */}
            <div className="mt-3 flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                Transcript will appear here once your viva starts.
              </p>
              {inProgress && !paused && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full"
                    style={{ backgroundColor: "hsl(var(--primary))" }}
                  />
                  Currently speaking...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}