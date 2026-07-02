import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    job_applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    career_paths = relationship("CareerPath", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=True)
    parsed_text = Column(Text, nullable=True)
    parsed_json_profile = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="resumes")
    tailored_resumes = relationship("TailoredResume", back_populates="resume", cascade="all, delete-orphan")

class TailoredResume(Base):
    __tablename__ = "tailored_resumes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    target_job_title = Column(String(255), nullable=False)
    target_job_description = Column(Text, nullable=False)
    tailored_text_markdown = Column(Text, nullable=True)
    cover_letter_markdown = Column(Text, nullable=True)
    ats_score = Column(Integer, nullable=True)
    feedback_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume", back_populates="tailored_resumes")
    job_applications = relationship("JobApplication", back_populates="tailored_resume")

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tailored_resume_id = Column(String(36), ForeignKey("tailored_resumes.id", ondelete="SET NULL"), nullable=True)
    job_title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    salary_range = Column(String(100), nullable=True)
    status = Column(String(50), default="Applied")  # Applied, Interviewing, Offer, Rejected
    applied_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="job_applications")
    tailored_resume = relationship("TailoredResume", back_populates="job_applications")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_title = Column(String(255), nullable=False)
    job_description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="interview_sessions")
    turns = relationship("InterviewTurn", back_populates="session", cascade="all, delete-orphan")

class InterviewTurn(Base):
    __tablename__ = "interview_turns"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    speaker = Column(String(50), nullable=False)  # agent, user
    transcript = Column(Text, nullable=False)
    feedback = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="turns")

class CareerPath(Base):
    __tablename__ = "career_paths"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    current_role = Column(String(255), nullable=False)
    target_role = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="career_paths")
    milestones = relationship("CareerMilestone", back_populates="career_path", cascade="all, delete-orphan")

class CareerMilestone(Base):
    __tablename__ = "career_milestones"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    career_path_id = Column(String(36), ForeignKey("career_paths.id", ondelete="CASCADE"), nullable=False)
    sequence_order = Column(Integer, nullable=False)
    milestone_title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    estimated_timeline = Column(String(100), nullable=True)

    career_path = relationship("CareerPath", back_populates="milestones")
    recommended_courses = relationship("RecommendedCourse", back_populates="milestone", cascade="all, delete-orphan")

class RecommendedCourse(Base):
    __tablename__ = "recommended_courses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    milestone_id = Column(String(36), ForeignKey("career_milestones.id", ondelete="CASCADE"), nullable=False)
    course_title = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=False)  # Coursera, Udemy, YouTube, etc.
    url = Column(String(500), nullable=True)
    skill_covered = Column(String(255), nullable=True)

    milestone = relationship("CareerMilestone", back_populates="recommended_courses")
