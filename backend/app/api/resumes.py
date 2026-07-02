from flask import Blueprint, request, jsonify
from app.core.database import SessionLocal
from app.core.security import token_required
from app.models.models import Resume, TailoredResume
from app.services.parser import parse_document
from app.services import agents

resumes_bp = Blueprint("resumes", __name__)

@resumes_bp.route("/upload", methods=["POST"])
@token_required
def upload_resume():
    if "file" not in request.files:
        return jsonify({"detail": "No file part in the request"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"detail": "No selected file"}), 400

    try:
        file_bytes = file.read()
        parsed_text = parse_document(file.filename, file_bytes)
        
        if not parsed_text.strip():
            return jsonify({"detail": "Could not extract text from document"}), 400

        # Trigger Resume Analysis Agent
        json_profile = agents.analyze_resume(parsed_text)
        
        db = SessionLocal()
        try:
            new_resume = Resume(
                user_id=request.current_user.id,
                filename=file.filename,
                parsed_text=parsed_text,
                parsed_json_profile=json_profile
            )
            db.add(new_resume)
            db.commit()
            db.refresh(new_resume)
            
            return jsonify({
                "id": new_resume.id,
                "filename": new_resume.filename,
                "parsed_json_profile": new_resume.parsed_json_profile,
                "created_at": new_resume.created_at.isoformat()
            }), 201
        finally:
            db.close()
            
    except Exception as e:
        return jsonify({"detail": f"Resume upload failed: {str(e)}"}), 500

@resumes_bp.route("", methods=["GET"])
@token_required
def get_resumes():
    db = SessionLocal()
    try:
        resumes = db.query(Resume).filter(Resume.user_id == request.current_user.id).order_by(Resume.created_at.desc()).all()
        return jsonify([{
            "id": r.id,
            "filename": r.filename,
            "parsed_json_profile": r.parsed_json_profile,
            "created_at": r.created_at.isoformat()
        } for r in resumes]), 200
    finally:
        db.close()

@resumes_bp.route("/tailor", methods=["POST"])
@token_required
def tailor_resume():
    data = request.get_json() or {}
    resume_id = data.get("resume_id")
    target_job_title = data.get("target_job_title")
    target_job_description = data.get("target_job_description")

    if not resume_id or not target_job_title or not target_job_description:
        return jsonify({"detail": "Missing resume_id, target_job_title or target_job_description"}), 400

    db = SessionLocal()
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == request.current_user.id).first()
        if not resume:
            return jsonify({"detail": "Resume not found"}), 404

        # 1. Trigger ATS Score Agent & Skill Gap Analysis Agent
        ats_results = agents.analyze_ats_and_gaps(
            resume_json=resume.parsed_json_profile,
            job_title=target_job_title,
            job_desc=target_job_description
        )

        # 2. Trigger Resume Improvement Agent & Cover Letter Generator & Job Matching Agent
        tailored_results = agents.generate_tailored_profile(
            resume_json=resume.parsed_json_profile,
            target_job_title=target_job_title,
            target_job_description=target_job_description
        )

        # Combine results to save
        tailored_resume = TailoredResume(
            resume_id=resume.id,
            target_job_title=target_job_title,
            target_job_description=target_job_description,
            tailored_text_markdown=tailored_results.get("tailored_experience_markdown"),
            cover_letter_markdown=tailored_results.get("cover_letter_markdown"),
            ats_score=ats_results.get("ats_score", tailored_results.get("job_match_score", 70)),
            feedback_json=ats_results  # Save raw gap recommendations & keyword info
        )
        
        db.add(tailored_resume)
        db.commit()
        db.refresh(tailored_resume)

        return jsonify({
            "id": tailored_resume.id,
            "resume_id": tailored_resume.resume_id,
            "target_job_title": tailored_resume.target_job_title,
            "tailored_text_markdown": tailored_resume.tailored_text_markdown,
            "cover_letter_markdown": tailored_resume.cover_letter_markdown,
            "ats_score": tailored_resume.ats_score,
            "feedback": tailored_resume.feedback_json,
            "created_at": tailored_resume.created_at.isoformat()
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Failed to tailor resume: {str(e)}"}), 500
    finally:
        db.close()
