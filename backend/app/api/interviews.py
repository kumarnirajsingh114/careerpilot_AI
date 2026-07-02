from flask import Blueprint, request, jsonify
from app.core.database import SessionLocal
from app.core.security import token_required
from app.models.models import Resume, InterviewSession, InterviewTurn
from app.services import agents

interviews_bp = Blueprint("interviews", __name__)

MAX_TURNS = 5

@interviews_bp.route("/sessions", methods=["POST"])
@token_required
def start_session():
    data = request.get_json() or {}
    resume_id = data.get("resume_id")
    job_title = data.get("job_title")
    job_description = data.get("job_description")

    if not resume_id or not job_title or not job_description:
        return jsonify({"detail": "Missing resume_id, job_title or job_description"}), 400

    db = SessionLocal()
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == request.current_user.id).first()
        if not resume:
            return jsonify({"detail": "Resume not found"}), 404

        session = InterviewSession(
            user_id=request.current_user.id,
            job_title=job_title,
            job_description=job_description
        )
        db.add(session)
        db.commit()

        # Trigger Interview Preparation Agent to generate the first question
        first_question = agents.generate_interview_question(
            job_title=job_title,
            job_description=job_description,
            resume_json=resume.parsed_json_profile,
            chat_history=[]
        )

        agent_turn = InterviewTurn(
            session_id=session.id,
            speaker="agent",
            transcript=first_question
        )
        db.add(agent_turn)
        db.commit()

        return jsonify({
            "session_id": session.id,
            "first_question": first_question
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Failed to start interview: {str(e)}"}), 500
    finally:
        db.close()

@interviews_bp.route("/sessions/<session_id>/turn", methods=["POST"])
@token_required
def submit_turn(session_id):
    data = request.get_json() or {}
    answer_text = data.get("answer_text")

    if not answer_text:
        return jsonify({"detail": "Missing answer_text"}), 400

    db = SessionLocal()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id, InterviewSession.user_id == request.current_user.id).first()
        if not session:
            return jsonify({"detail": "Session not found"}), 404

        turns = db.query(InterviewTurn).filter(InterviewTurn.session_id == session_id).order_by(InterviewTurn.created_at.asc()).all()
        if not turns:
            return jsonify({"detail": "No previous questions in interview"}), 400

        user_turns_count = sum(1 for t in turns if t.speaker == "user")
        if user_turns_count >= MAX_TURNS:
            return jsonify({
                "is_completed": True,
                "turn_score": None,
                "feedback": "Interview already completed.",
                "next_question": None
            }), 200

        last_turn = turns[-1]
        if last_turn.speaker != "agent":
            return jsonify({"detail": "Interviewer has not asked a question yet"}), 400

        # Grade the user turn
        turn_grading = agents.grade_interview_turn(
            question=last_turn.transcript,
            answer=answer_text,
            job_title=session.job_title
        )

        user_turn = InterviewTurn(
            session_id=session_id,
            speaker="user",
            transcript=answer_text,
            score=turn_grading.get("score"),
            feedback=turn_grading.get("feedback")
        )
        db.add(user_turn)
        db.commit()

        is_completed = (user_turns_count + 1) >= MAX_TURNS
        next_question = None

        if not is_completed:
            # Generate next question
            updated_turns = db.query(InterviewTurn).filter(InterviewTurn.session_id == session_id).order_by(InterviewTurn.created_at.asc()).all()
            history = [{"speaker": t.speaker, "transcript": t.transcript} for t in updated_turns]
            
            latest_resume = db.query(Resume).filter(Resume.user_id == request.current_user.id).order_by(Resume.created_at.desc()).first()
            resume_profile = latest_resume.parsed_json_profile if latest_resume else {}
            
            next_question = agents.generate_interview_question(
                job_title=session.job_title,
                job_description=session.job_description,
                resume_json=resume_profile,
                chat_history=history
            )

            next_agent_turn = InterviewTurn(
                session_id=session_id,
                speaker="agent",
                transcript=next_question
            )
            db.add(next_agent_turn)
            db.commit()

        return jsonify({
            "is_completed": is_completed,
            "turn_score": turn_grading.get("score"),
            "feedback": turn_grading.get("feedback"),
            "next_question": next_question
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Failed to submit turn: {str(e)}"}), 500
    finally:
        db.close()

@interviews_bp.route("/sessions/<session_id>/report", methods=["GET"])
@token_required
def get_report(session_id):
    db = SessionLocal()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id, InterviewSession.user_id == request.current_user.id).first()
        if not session:
            return jsonify({"detail": "Session not found"}), 404

        turns = db.query(InterviewTurn).filter(InterviewTurn.session_id == session_id).order_by(InterviewTurn.created_at.asc()).all()
        user_turns = [t for t in turns if t.speaker == "user"]
        
        overall_score = 0
        if user_turns:
            graded_turns = [t.score for t in user_turns if t.score is not None]
            if graded_turns:
                overall_score = int(sum(graded_turns) / len(graded_turns))

        if overall_score >= 80:
            summary = "Outstanding work! You answered technical specifics thoroughly and communicated with confidence."
        elif overall_score >= 60:
            summary = "Competent responses overall. Focus on restructuring answers using standard Action-Result details."
        else:
            summary = "Requires practice. Practice answering directly to the core skills requested."

        return jsonify({
            "session_id": session.id,
            "job_title": session.job_title,
            "overall_score": overall_score,
            "feedback_summary": summary,
            "turns": [{
                "id": t.id,
                "speaker": t.speaker,
                "transcript": t.transcript,
                "feedback": t.feedback,
                "score": t.score,
                "created_at": t.created_at.isoformat()
            } for t in turns]
        }), 200
    finally:
        db.close()
