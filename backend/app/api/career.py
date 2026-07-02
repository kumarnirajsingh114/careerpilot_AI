from flask import Blueprint, request, jsonify
from app.core.database import SessionLocal
from app.core.security import token_required
from app.models.models import Resume, CareerPath, CareerMilestone, RecommendedCourse
from app.services import agents

career_bp = Blueprint("career", __name__)

@career_bp.route("/roadmap", methods=["POST"])
@token_required
def generate_roadmap():
    data = request.get_json() or {}
    current_role = data.get("current_role")
    target_role = data.get("target_role")

    if not current_role or not target_role:
        return jsonify({"detail": "Missing current_role or target_role"}), 400

    db = SessionLocal()
    try:
        latest_resume = db.query(Resume).filter(Resume.user_id == request.current_user.id).order_by(Resume.created_at.desc()).first()
        resume_profile = latest_resume.parsed_json_profile if latest_resume else None

        # Call Career Recommendation Agent
        roadmap_data = agents.generate_career_roadmap(
            current_role=current_role,
            target_role=target_role,
            resume_json=resume_profile
        )

        new_path = CareerPath(
            user_id=request.current_user.id,
            current_role=current_role,
            target_role=target_role
        )
        db.add(new_path)
        db.commit()

        for m in roadmap_data.get("milestones", []):
            milestone = CareerMilestone(
                career_path_id=new_path.id,
                sequence_order=m.get("sequence_order"),
                milestone_title=m.get("milestone_title"),
                description=m.get("description"),
                estimated_timeline=m.get("estimated_timeline")
            )
            db.add(milestone)
            db.commit()

            for c in m.get("recommended_courses", []):
                course = RecommendedCourse(
                    milestone_id=milestone.id,
                    course_title=c.get("course_title"),
                    provider=c.get("provider", "Coursera"),
                    url=c.get("url"),
                    skill_covered=c.get("skill_covered")
                )
                db.add(course)
            db.commit()

        # Build response manually to avoid circular dependencies issues
        db.refresh(new_path)
        return jsonify(serialize_career_path(new_path, db)), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Failed to plan roadmap: {str(e)}"}), 500
    finally:
        db.close()

@career_bp.route("/roadmaps", methods=["GET"])
@token_required
def get_roadmaps():
    db = SessionLocal()
    try:
        paths = db.query(CareerPath).filter(CareerPath.user_id == request.current_user.id).order_by(CareerPath.created_at.desc()).all()
        return jsonify([serialize_career_path(p, db) for p in paths]), 200
    finally:
        db.close()

@career_bp.route("/roadmaps/<path_id>", methods=["GET"])
@token_required
def get_roadmap_details(path_id):
    db = SessionLocal()
    try:
        path = db.query(CareerPath).filter(CareerPath.id == path_id, CareerPath.user_id == request.current_user.id).first()
        if not path:
            return jsonify({"detail": "Roadmap not found"}), 404
        return jsonify(serialize_career_path(path, db)), 200
    finally:
        db.close()

def serialize_career_path(path, db):
    milestones = db.query(CareerMilestone).filter(CareerMilestone.career_path_id == path.id).order_by(CareerMilestone.sequence_order.asc()).all()
    serialized_milestones = []
    
    for m in milestones:
        courses = db.query(RecommendedCourse).filter(RecommendedCourse.milestone_id == m.id).all()
        serialized_milestones.append({
            "id": m.id,
            "sequence_order": m.sequence_order,
            "milestone_title": m.milestone_title,
            "description": m.description,
            "estimated_timeline": m.estimated_timeline,
            "recommended_courses": [{
                "id": c.id,
                "course_title": c.course_title,
                "provider": c.provider,
                "url": c.url,
                "skill_covered": c.skill_covered
            } for c in courses]
        })

    return {
        "id": path.id,
        "current_role": path.current_role,
        "target_role": path.target_role,
        "created_at": path.created_at.isoformat() if path.created_at else None,
        "milestones": serialized_milestones
    }
