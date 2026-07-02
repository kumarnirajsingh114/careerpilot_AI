from flask import Blueprint, request, jsonify
from app.core.database import SessionLocal
from app.core.security import hash_password, verify_password, create_access_token, token_required
from app.models.models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name")

    if not email or not password:
        return jsonify({"detail": "Email and password are required"}), 400

    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            return jsonify({"detail": "User with this email already exists"}), 400

        hashed = hash_password(password)
        new_user = User(email=email, hashed_password=hashed, full_name=full_name)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return jsonify({
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Registration failed: {str(e)}"}), 500
    finally:
        db.close()

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"detail": "Email and password are required"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.hashed_password):
            return jsonify({"detail": "Incorrect email or password"}), 401

        token = create_access_token(user.id)
        return jsonify({"access_token": token, "token_type": "bearer"}), 200
    finally:
        db.close()

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me():
    user = request.current_user
    return jsonify({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }), 200
