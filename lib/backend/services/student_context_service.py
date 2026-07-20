from lib.backend.services.document_service import get_supabase

def get_group_context(submission_id, student_id):
    context = {
        "course_name":        "Capstone Project",
        "group_name":         "Group",
        "student_name":       "Student",
        "other_members":      [],
        "existing_questions": []
    }
    try:
        supabase = get_supabase()
        if not supabase:
            return context

        # --- student name ---
        user_res = (
            supabase.table("users")
            .select("name")
            .eq("id", student_id)
            .maybe_single()
            .execute()
        )
        if user_res.data:
            context["student_name"] = user_res.data.get("name", "Student")

        # --- submission -> course_id ---
        sub_res = (
            supabase.table("submissions")
            .select("course_id")
            .eq("id", submission_id)
            .maybe_single()
            .execute()
        )
        if not sub_res.data:
            return context
        course_id = sub_res.data.get("course_id", "")

        # --- course name ---
        course_res = (
            supabase.table("courses")
            .select("name")
            .eq("id", course_id)
            .maybe_single()
            .execute()
        )
        if course_res.data:
            context["course_name"] = course_res.data.get("name", "Capstone Project")

        # --- find the group this student belongs to ---
        groups_res = (
            supabase.table("groups")
            .select("name, member_ids")
            .eq("course_id", course_id)
            .execute()
        )
        for group in groups_res.data or []:
            member_ids = group.get("member_ids") or []
            if student_id not in member_ids:
                continue

            context["group_name"] = group.get("name", "Group")
            other_ids = [uid for uid in member_ids if uid != student_id]

            if other_ids:
                # one query for all other members' names, instead of one per member
                members_res = (
                    supabase.table("users")
                    .select("id, name")
                    .in_("id", other_ids)
                    .execute()
                )
                id_to_name = {
                    u["id"]: u.get("name", u["id"]) for u in (members_res.data or [])
                }
                context["other_members"] = [
                    id_to_name.get(uid, uid) for uid in other_ids
                ]

                # one query for all other members' exams, instead of one per member
                exam_ids = [f"{submission_id}_{uid}" for uid in other_ids]
                exams_res = (
                    supabase.table("exams")
                    .select("questions")
                    .in_("id", exam_ids)
                    .execute()
                )
                for exam in exams_res.data or []:
                    context["existing_questions"].extend(exam.get("questions") or [])

            break

    except Exception as e:
        print(f"WARNING: Could not get group context: {e}")

    return context