
def process_exam_submission(exam_id, student_id):
    """
    V3: Called after all videos have been uploaded and processed.
    Looks for windowed CSVs + answer-row JSONs in data/exam_videos/{exam_id}/
    and runs the GRU+RF inference pipeline on them.

    A session with fewer than 5 complete answers is never sent to
    inference. GRU requires the full 5-question sequence, and predicting
    on a partial session would be meaningless. Such sessions are saved as
    "pending_video" instead, same as before.
    """
    print(f"Running pipeline for exam {exam_id}...")
    try:
        db = get_firestore()
        if not db:
            return

        result_ref = db.collection("results").document(exam_id)

        # Find windowed CSVs + answer-row JSONs for this exam
        exam_dir = Path(UPLOAD_DIR) / exam_id
        csv_paths = []
        answer_rows = []
        quality_flags = []
        missing = []

        for q_idx in range(1, 6):   # Q1 to Q5
            question_id = f"q{q_idx}"
            csv_file = exam_dir / f"{question_id}_windowed.csv"
            answer_row_file = exam_dir / f"{question_id}_answer_row.json"

            if csv_file.exists() and answer_row_file.exists():
                csv_paths.append(str(csv_file))
                with open(str(answer_row_file), "r", encoding="utf-8") as f:
                    answer_row = json.load(f)
                answer_rows.append(answer_row)
                quality_flags.append(bool(answer_row.get("needs_live_review", False)))
            else:
                missing.append(question_id)
                print(f"  WARNING: Missing data for {question_id.upper()}")

        # Completeness gate: inference cannot run on a partial session
        if len(csv_paths) < 5:
            result_ref.set({
                "studentId":      student_id,
                "submissionId":   exam_id.split("_")[0] if "_" in exam_id else exam_id,
                "prediction":     None,
                "authenticProb":  None,
                "confidence":     None,
                "freeRiderFlag":  False,
                "pipelineStatus": "pending_video",
                "missingQuestions": missing,
                "createdAt":      firestore.SERVER_TIMESTAMP,
            })
            print(
                f"WARNING: Only {len(csv_paths)}/5 answers ready for "
                f"{exam_id}: saved pending placeholder, missing: {missing}"
            )
            return

        print(f"  All 5 answers ready, running inference...")

        from inference import VivaAIPredictor
        predictor = VivaAIPredictor()
        result = predictor.predict_student(
            csv_paths, answer_rows=answer_rows, quality_flags=quality_flags
        )

        # Read per-question transcripts saved by feature_extractor
        transcripts_by_q = {}
        combined_transcript = ""
        for q_idx in range(1, 6):
            txt_file = exam_dir / f"q{q_idx}_transcript.txt"
            if txt_file.exists():
                try:
                    raw = txt_file.read_text(encoding="utf-8")
                    marker = "--- FULL TRANSCRIPT ---"
                    plain  = raw.split(marker)[1].split("--- SEGMENTS ---")[0].strip() if marker in raw else raw.strip()
                    if plain:
                        transcripts_by_q[f"q{q_idx}"] = plain
                        combined_transcript += f"[Q{q_idx}] {plain}\n\n"
                except Exception as e:
                    print(f"WARNING: Could not read transcript Q{q_idx}: {e}")

        result_ref.set({
            "studentId":          student_id,
            "submissionId":       exam_id.split("_")[0] if "_" in exam_id else exam_id,
            # Primary decision: GRU's own call, per the two-model
            # architecture (GRU decides, RF is a disagreement check only).
            # This is what review_page.html's banner/pill show. It's
            # always GRU's own call, independent of freeRiderFlag below.
            "prediction":         result["gru_prediction"],
            "authenticProb":      result["gru_probability"],
            "confidence":         result["confidence"],
            # "Flagged" (shown on the dashboard's Flagged Students page)
            # means a RESOLVED, confident free-rider call. GRU says
            # free-rider AND RF agrees AND it's not a gray-zone case.
            # A GRU-alone free-rider lean that still needs manual review
            # should NOT show up here; it belongs in the review queue
            # until an instructor confirms it (via Confirm Flag / Final
            # Decision, which sets this field directly in review_page.html).
            "freeRiderFlag":      (
                result["gru_prediction"] == "free_rider"
                and not result["mandatory_review"]
            ),
            # Second-model comparison, used only for the review trigger.
            "rfProbability":      result["rf_probability"],
            "rfPrediction":       result["rf_prediction"],
            "modelsAgree":        result["models_agree"],
            # Three-trigger mandatory review policy.
            "modelDisagreement":  result["model_disagreement"],
            "grayZone":           result["gray_zone"],
            "qualityFlag":        result["quality_flag"],
            "mandatoryReview":    result["mandatory_review"],
            "featuresUsed":       result["features_used"],
            "pipelineStatus":     "complete",
            "transcript":         combined_transcript.strip(),
            "transcriptByQ":      transcripts_by_q,
            "createdAt":          firestore.SERVER_TIMESTAMP,
        })
        print(
            f"Result saved for {exam_id}: GRU={result['gru_prediction']} "
            f"(prob={result['gru_probability']:.3f}) | "
            f"RF={result['rf_prediction']} (prob={result['rf_probability']:.3f}) | "
            f"review={'YES' if result['mandatory_review'] else 'no'}"
        )

    except Exception as e:
        print(f"ERROR: Pipeline failed for {exam_id}: {e}")
        traceback.print_exc()
        try:
            db = get_firestore()
            if db:
                db.collection("results").document(exam_id).set({
                    "studentId":      student_id,
                    "submissionId":   exam_id.split("_")[0] if "_" in exam_id else exam_id,
                    "prediction":     None,
                    "authenticProb":  None,
                    "confidence":     None,
                    "freeRiderFlag":  False,
                    "pipelineStatus": "error",
                    "errorMessage":   str(e),
                    "createdAt":      firestore.SERVER_TIMESTAMP,
                }, merge=True)
        except Exception as save_err:
            print(f"ERROR: Could not save error status for {exam_id}: {save_err}")


def process_video():
    """
    V3: Called after a single video has been uploaded and processed.
    Checks if all 5 answers are ready, and if so, runs the inference pipeline.
    """
    # Extract exam_id and student_id from the video filename
    # Expected format: {exam_id}_q{question_number}_{student_id}.mp4
    # Example: "exam123_q1_student456.mp4"
    try:
        filename = Path(request.files['video'].filename).stem
        parts = filename.split('_')
        if len(parts) < 3:
            raise ValueError("Invalid video filename format.")
        exam_id = parts[0]
        student_id = parts[2]
        run_pipeline_for_exam(exam_id, student_id)
    except Exception as e:
        print(f"ERROR: Could not process video: {e}")


def run_inference_pipeline(exam_id, student_id):
    """
    V3: Public API endpoint to trigger the inference pipeline for a given exam and student.
    This can be called after all videos have been uploaded and processed.
    """
    try:
        run_pipeline_for_exam(exam_id, student_id)
        return {"status": "success", "message": f"Inference pipeline triggered for {exam_id}."}
    except Exception as e:
        print(f"ERROR: Could not run inference pipeline for {exam_id}: {e}")
        return {"status": "error", "message": str(e)}