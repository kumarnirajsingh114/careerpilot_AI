import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

from app.core.config import settings
from app.api.auth import auth_bp
from app.api.resumes import resumes_bp
from app.api.career import career_bp
from app.api.interviews import interviews_bp
from app.api.jobs import jobs_bp

# Compute absolute path to frontend static folder
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_dir = os.path.join(os.path.dirname(base_dir), "frontend")

app = Flask(__name__, static_folder=frontend_dir, static_url_path="")
CORS(app)

# Register API blueprints
app.register_blueprint(auth_bp, url_prefix=f"{settings.API_V1_STR}/auth")
app.register_blueprint(resumes_bp, url_prefix=f"{settings.API_V1_STR}/resumes")
app.register_blueprint(career_bp, url_prefix=f"{settings.API_V1_STR}/career")
app.register_blueprint(interviews_bp, url_prefix=f"{settings.API_V1_STR}/interview")
app.register_blueprint(jobs_bp, url_prefix=f"{settings.API_V1_STR}/jobs")

# --- UI Server Routing ---
@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/auth")
def serve_auth():
    return send_from_directory(app.static_folder, "auth.html")

@app.route("/dashboard")
def serve_dashboard():
    return send_from_directory(app.static_folder, "dashboard.html")

@app.route("/resume")
def serve_resume():
    return send_from_directory(app.static_folder, "resume.html")

@app.route("/career-path")
def serve_career():
    return send_from_directory(app.static_folder, "career.html")

@app.route("/interview")
def serve_interview():
    return send_from_directory(app.static_folder, "interview.html")

@app.route("/applications")
def serve_applications():
    return send_from_directory(app.static_folder, "applications.html")

# API Root Health Check
@app.route("/api/v1/health")
def healthcheck():
    return jsonify({"message": "Welcome to CareerPilot AI API", "status": "healthy"})

if __name__ == "__main__":
    # Create DB tables if not present
    from app.core.init_db import init_db
    init_db()
    
    app.run(host="0.0.0.0", port=8000, debug=True)
Base = None
