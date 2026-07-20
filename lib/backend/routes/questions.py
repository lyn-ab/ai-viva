from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lib.backend.services.document_service import extract_text_from_url
from lib.backend.services.student_context_service import get_group_context
from lib.backend.services.rubric_service import generate_rubric_for_student

router = APIRouter()


class RubricCriterion(BaseModel):
    criterion: str
    weight: float


class GenerateQuestionsRequest(BaseModel):
    sessionId: str
    submissionId: str
    studentId: str
    studentName: str
    assignmentTitle: str
    assignmentDescription: str
    rubric: list[RubricCriterion] = []
    focusNotes: str = ""
    mode: str = "individual"
    questionCount: int = 5

    # One of these two must resolve to actual text. reportUrl is preferred —
    # it lets document_service handle PDF/DOCX/etc extraction server-side.
    # submissionText is a fallback for callers that already have plain text
    # (e.g. local/mock testing) and don't want to round-trip through a URL.
    reportUrl: Optional[str] = None
    submissionText: Optional[str] = None


@router.post("/generate-questions")
def generate_questions(req: GenerateQuestionsRequest):
    # --- Step 1: resolve report text ---
    if req.reportUrl:
        report_text = extract_text_from_url(req.reportUrl)
    else:
        report_text = req.submissionText or ""

    if not report_text:
        raise HTTPException(
            422,
            "No report text available — provide reportUrl or submissionText.",
        )

    # --- Step 2: group/course context + anti-collusion (existing questions) ---
    # Falls back to sane defaults if Supabase isn't reachable or the student
    # has no group yet (see student_context_service.get_group_context).
    ctx = get_group_context(req.submissionId, req.studentId)

    # --- Step 3: generate the rubric + questions via GPT ---
    rubric = generate_rubric_for_student(
        submission_id=req.submissionId,
        student_id=req.studentId,
        report_text=report_text,
        student_name=ctx["student_name"] or req.studentName,
        course_name=ctx["course_name"] or req.assignmentTitle,
        group_name=ctx["group_name"],
        other_members_str=", ".join(ctx["other_members"]) or "none",
        existing_qs_str="\n".join(ctx["existing_questions"]) or "none",
        num_questions=req.questionCount,
    )

    # --- Step 4: reshape into the VivaQuestion[] contract the frontend expects ---
    questions = [
        {
            "id": f"{req.submissionId}_{req.studentId}_{qid}",
            "index": i + 1,
            "text": entry["question"],
            "expectedDuration": 120,
        }
        for i, (qid, entry) in enumerate(rubric.items())
    ]

    # rubric is included too — useful later for scoring/review, not just display.
    return {"questions": questions, "rubric": rubric}