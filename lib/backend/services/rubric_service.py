import os
import json
from openai import OpenAI


def generate_rubric_for_student(submission_id, student_id, report_text,
                                 student_name, course_name, group_name,
                                 other_members_str, existing_qs_str,
                                 num_questions=5):
    """
    STAGE 1: Rubric creation.

    Generates a genuine grading rubric from the report: for each question,
    real grading criteria (not just "an answer"), including the specific
    facts/values a correct response must contain. This mirrors how the
    training rubric (rubric.json) was built, a deliberate answer key
    written before any keyword extraction happens, not a raw GPT answer
    mined for keywords after the fact.

    Returns a dict shaped like the training rubric's "questions" section:
        {
          "q1": {
            "question": "...",
            "reference_answer": "...",   # what a correct answer demonstrates
            "required_values": [...]     # specific facts/numbers/terms required
          },
          ...
        }
    """
    prompt = f"""You are a university oral exam examiner building a grading
rubric for an individual contribution assessment.

CONTEXT:
- Course: {course_name}
- Group: {group_name}
- Student being examined: {student_name}
- Other group members: {other_members_str}

PROJECT REPORT CONTENT (extracted text):
\"\"\"
{report_text}
\"\"\"

QUESTIONS ALREADY GIVEN TO OTHER GROUP MEMBERS (do NOT repeat these):
{existing_qs_str}

YOUR TASK:
Build a grading rubric with exactly {num_questions} oral exam questions for
{student_name}, based on SPECIFIC content from the report above.

For each question, write:
1. A question testing {student_name}'s PERSONAL contribution and DEEP
   understanding, not surface-level definitions. It must be unanswerable
   by someone who didn't actually do the work.
2. A "reference_answer": what a correct, complete answer must demonstrate,
   written as grading criteria (what the student needs to show they know),
   not as a script for the student to recite.
3. "required_values": the specific facts, numbers, technical terms, or
   named components from the report that MUST appear in a correct answer
   (e.g. "PID", "0.82", "transfer function", "settling time"). These are
   the concrete, checkable pieces of evidence a grader would look for.

Use one question of each type:
- Role: "What was your specific contribution to..."
- Technical: "Explain why you chose this specific approach for..."
- Understanding: "How does [specific component from report] work and why?"
- Challenge: "What was the hardest part of your work and how did you solve it?"
- Improvement: "If you had more time, what would you specifically improve?"

RETURN FORMAT: valid JSON only, no markdown, no extra text:
{{
  "questions": [
    {{
      "question": "the question text here",
      "reference_answer": "What a correct, complete answer must demonstrate.",
      "required_values": ["specific_term1", "specific_value2", "specific_term3"]
    }}
  ]
}}"""

    client  = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
    message = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    parsed = json.loads(raw)
    items  = parsed.get("questions", [])[:num_questions]

    rubric = {}
    for i, it in enumerate(items):
        qid = f"q{i+1}"
        rubric[qid] = {
            "question":         it.get("question", ""),
            "reference_answer": it.get("reference_answer", ""),
            "required_values":  it.get("required_values", []),
        }
    return rubric