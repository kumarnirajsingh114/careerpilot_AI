from flask import Blueprint, request, jsonify
from app.core.database import SessionLocal
from app.core.security import token_required
from app.models.models import Resume, JobApplication, TailoredResume
from app.services import agents

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("/applications", methods=["POST"])
@token_required
def create_application():
    data = request.get_json() or {}
    job_title = data.get("job_title")
    company = data.get("company")
    salary_range = data.get("salary_range")
    status = data.get("status", "Applied")
    tailored_resume_id = data.get("tailored_resume_id")

    if not job_title or not company:
        return jsonify({"detail": "Missing job_title or company"}), 400

    db = SessionLocal()
    try:
        new_app = JobApplication(
            user_id=request.current_user.id,
            tailored_resume_id=tailored_resume_id,
            job_title=job_title,
            company=company,
            salary_range=salary_range,
            status=status
        )
        db.add(new_app)
        db.commit()
        db.refresh(new_app)

        return jsonify({
            "id": new_app.id,
            "job_title": new_app.job_title,
            "company": new_app.company,
            "salary_range": new_app.salary_range,
            "status": new_app.status,
            "applied_at": new_app.applied_at.isoformat()
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Failed to create application tracking card: {str(e)}"}), 500
    finally:
        db.close()

@jobs_bp.route("/applications", methods=["GET"])
@token_required
def get_applications():
    db = SessionLocal()
    try:
        apps = db.query(JobApplication).filter(JobApplication.user_id == request.current_user.id).order_by(JobApplication.applied_at.desc()).all()
        return jsonify([{
            "id": a.id,
            "job_title": a.job_title,
            "company": a.company,
            "salary_range": a.salary_range,
            "status": a.status,
            "applied_at": a.applied_at.isoformat()
        } for a in apps]), 200
    finally:
        db.close()

@jobs_bp.route("/applications/<app_id>", methods=["PATCH"])
@token_required
def update_application(app_id):
    data = request.get_json() or {}
    status = data.get("status")
    salary_range = data.get("salary_range")

    db = SessionLocal()
    try:
        app = db.query(JobApplication).filter(JobApplication.id == app_id, JobApplication.user_id == request.current_user.id).first()
        if not app:
            return jsonify({"detail": "Application card not found"}), 404

        if status:
            app.status = status
        if salary_range:
            app.salary_range = salary_range

        db.commit()
        db.refresh(app)
        
        return jsonify({
            "id": app.id,
            "job_title": app.job_title,
            "company": app.company,
            "salary_range": app.salary_range,
            "status": app.status,
            "applied_at": app.applied_at.isoformat()
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Failed to update application card: {str(e)}"}), 500
    finally:
        db.close()

@jobs_bp.route("/match-score", methods=["GET"])
@token_required
def get_job_match_score():
    job_description = request.args.get("job_description")
    if not job_description:
        return jsonify({"detail": "Missing job_description query param"}), 400

    db = SessionLocal()
    try:
        latest_resume = db.query(Resume).filter(Resume.user_id == request.current_user.id).order_by(Resume.created_at.desc()).first()
        if not latest_resume:
            return jsonify({"detail": "Please upload a resume first to run compatibility matching"}), 400

        # Trigger Job Matching Agent
        # Reuse analyze_ats_and_gaps to do a clean matched score return
        match_result = agents.analyze_ats_and_gaps(
            resume_json=latest_resume.parsed_json_profile,
            job_title="Target Position",
            job_desc=job_description
        )

        score = match_result.get("ats_score", 70)
        
        if score >= 80:
            rating = "Strong Match"
            feedback = "Excellent alignment! Your profile matches the key technical requirements and background skills requested in this description."
        elif score >= 60:
            rating = "Good Match"
            feedback = "Solid alignment, though there are minor skill gaps. Review the description to identify missing tools or frameworks."
        else:
            rating = "Low Match"
            feedback = "Significant skill gaps identified. Consider tailoring your resume or working on the recommended milestones before applying."

        return jsonify({
            "score": score,
            "rating": rating,
            "feedback": feedback
        }), 200
    finally:
        db.close()
