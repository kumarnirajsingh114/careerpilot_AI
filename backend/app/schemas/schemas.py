from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

# --- Token & Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[UUID] = None

class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Resume & Profile Schemas ---
class SkillItem(BaseModel):
    name: str
    level: str = "Intermediate"  # Beginner, Intermediate, Advanced
    years_experience: Optional[float] = None

class ExperienceItem(BaseModel):
    job_title: str
    company: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    highlights: List[str] = []

class EducationItem(BaseModel):
    degree: str
    field_of_study: Optional[str] = None
    institution: str
    graduation_year: Optional[int] = None

class ParsedProfile(BaseModel):
    summary: Optional[str] = None
    skills: List[SkillItem] = []
    experience: List[ExperienceItem] = []
    education: List[EducationItem] = []

class ResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    resume_url: Optional[str] = None
    parsed_json_profile: Optional[ParsedProfile] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Resume Tailoring Schemas ---
class ResumeTailorRequest(BaseModel):
    resume_id: UUID
    target_job_title: str
    target_job_description: str

class TailoredResumeResponse(BaseModel):
    id: UUID
    resume_id: UUID
    target_job_title: str
    target_job_description: str
    tailored_text_markdown: Optional[str] = None
    pdf_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Job Application Schemas ---
class JobApplicationCreate(BaseModel):
    job_title: str
    company: str
    salary_range: Optional[str] = None
    job_description: Optional[str] = None
    status: str = "Applied"  # Applied, Interviewing, Offer, Rejected
    tailored_resume_id: Optional[UUID] = None

class JobApplicationUpdate(BaseModel):
    status: Optional[str] = None
    salary_range: Optional[str] = None
    job_description: Optional[str] = None

class JobApplicationResponse(BaseModel):
    id: UUID
    user_id: UUID
    tailored_resume_id: Optional[UUID] = None
    job_title: str
    company: str
    salary_range: Optional[str] = None
    job_description: Optional[str] = None
    status: str
    applied_at: datetime

    class Config:
        from_attributes = True

# --- Interview Session Schemas ---
class InterviewSessionCreate(BaseModel):
    job_title: str
    job_description: str
    resume_id: UUID

class InterviewTurnCreate(BaseModel):
    answer_text: str

class InterviewTurnResponse(BaseModel):
    id: UUID
    session_id: UUID
    speaker: str
    transcript: str
    feedback_markdown: Optional[str] = None
    score_out_of_100: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewSessionStartResponse(BaseModel):
    session_id: UUID
    first_question: str

class InterviewTurnSubmitResponse(BaseModel):
    turn_score: Optional[int] = None
    feedback: Optional[str] = None
    next_question: Optional[str] = None
    is_completed: bool

class InterviewSessionReport(BaseModel):
    session_id: UUID
    job_title: str
    overall_score: int
    feedback_summary: str
    turns: List[InterviewTurnResponse]

# --- Career Path Schemas ---
class CareerRoadmapRequest(BaseModel):
    current_role: str
    target_role: str

class RecommendedCourseResponse(BaseModel):
    id: UUID
    milestone_id: UUID
    course_title: str
    provider: str
    url: Optional[str] = None
    skill_covered: Optional[str] = None

    class Config:
        from_attributes = True

class CareerMilestoneResponse(BaseModel):
    id: UUID
    sequence_order: int
    milestone_title: str
    description: str
    estimated_timeline: Optional[str] = None
    recommended_courses: List[RecommendedCourseResponse] = []

    class Config:
        from_attributes = True

class CareerPathResponse(BaseModel):
    id: UUID
    user_id: UUID
    current_role: str
    target_role: str
    created_at: datetime
    milestones: List[CareerMilestoneResponse] = []

    class Config:
        from_attributes = True
