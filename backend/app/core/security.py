import jwt
import bcrypt
from datetime import datetime, timedelta
from flask import request, jsonify
from functools import wraps
from typing import Dict, Any, Union

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import User

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"detail": "Token is missing!"}), 401
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload["sub"]
        except jwt.ExpiredSignatureError:
            return jsonify({"detail": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"detail": "Token is invalid!"}), 401

        db = SessionLocal()
        try:
            current_user = db.query(User).filter(User.id == user_id).first()
            if not current_user:
                return jsonify({"detail": "User not found!"}), 401
            # Add user to request context
            request.current_user = current_user
        finally:
            db.close()
            
        return f(*args, **kwargs)
    return decorated
