import json
import logging
import google.generativeai as genai
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not configured. Running in MOCK Mode.")

def query_gemini(prompt: str, is_json: bool = False, model_name: str = "models/gemini-1.5-flash") -> str:
    """
    Helper to run generation against Gemini models. Returns response string.
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("Gemini API key missing.")
    
    try:
        model = genai.GenerativeModel(model_name)
        generation_config = {}
        if is_json:
            generation_config = {"response_mime_type": "application/json"}
            
        response = model.generate_content(prompt, generation_config=generation_config)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API Error: {str(e)}")
        raise e

# --- 1. Resume Analysis Agent ---
def analyze_resume(text: str) -> Dict[str, Any]:
    """
    Parses resume text and returns structured user profile details in JSON.
    """
    prompt = f"""
You are the Resume Analysis Agent. Extract the following profile details from the resume:
1. Summary (Brief professional summary)
2. Skills (A list of technical/soft tools, including estimated expertise level as 'Beginner', 'Intermediate', or 'Advanced')
3. Experience (Work history, company, role title, dates, and bullet highlights)
4. Education (Degree, major, university, graduation year)

You MUST respond with a valid JSON matching this schema:
{{
  "summary": "Professional summary...",
  "skills": [
    {{"name": "Python", "level": "Advanced"}}
  ],
  "experience": [
    {{
      "job_title": "Software Engineer",
      "company": "Tech Corp",
      "start_date": "Jan 2021",
      "end_date": "Present",
      "description": "Short summary...",
      "highlights": ["Built backend APIs", "Improved database performance"]
    }}
  ],
  "education": [
    {{
      "degree": "B.S.",
      "field_of_study": "Computer Science",
      "institution": "State University",
      "graduation_year": 2020
    }}
  ]
}}
Do not add conversational text or wrap in markdown blocks.

Resume Text:
{text}
"""
    if not settings.GEMINI_API_KEY:
        # Mock Response
        return {
            "summary": "Experienced software developer skilled in building web APIs and managing databases.",
            "skills": [
                {"name": "Python", "level": "Advanced"},
                {"name": "SQL", "level": "Advanced"},
                {"name": "Flask", "level": "Intermediate"},
                {"name": "React", "level": "Intermediate"}
              ],
              "experience": [
                {
                  "job_title": "Software Engineer",
                  "company": "Enterprise Solved",
                  "start_date": "2024-01",
                  "end_date": "Present",
                  "description": "Full stack application development and cloud hosting.",
                  "highlights": [
                    "Created core endpoints using Flask, reducing query times by 20%.",
                    "Led database design migrations to SQLite and PostgreSQL."
                  ]
                }
              ],
              "education": [
                {
                  "degree": "Bachelor of Science",
                  "field_of_study": "Computer Science",
                  "institution": "National Institute of Tech",
                  "graduation_year": 2023
                }
              ]
        }
    
    try:
        res = query_gemini(prompt, is_json=True)
        return json.loads(res)
    except Exception:
        return {"summary": "Failed to parse profile.", "skills": [], "experience": [], "education": []}

# --- 2. ATS Score Agent & 3. Skill Gap Analysis Agent ---
def analyze_ats_and_gaps(resume_json: Dict[str, Any], job_title: str, job_desc: str) -> Dict[str, Any]:
    """
    Computes ATS score, details missing keywords, and performs skill gap analysis.
    """
    prompt = f"""
You are the ATS Score and Skill Gap Analysis Agent.
Compare the candidate's resume profile with the target job details:

Job Title: {job_title}
Job Description:
{job_desc}

Candidate Resume Profile (JSON):
{json.dumps(resume_json, indent=2)}

Task:
1. Estimate a numerical ATS score out of 100 representing compatibility.
2. List missing keywords and technologies in the resume.
3. List skills that the candidate has (Matched Skills) and those that are missing (Missing Skills).
4. Provide customized recommendations to bridge the gap.

You MUST respond strictly with a valid JSON matching this schema:
{{
  "ats_score": 85,
  "missing_keywords": ["Kubernetes", "Redis", "TypeScript"],
  "matched_skills": ["Python", "Flask", "SQL"],
  "missing_skills": ["Docker orchestration", "Cloud hosting"],
  "gap_recommendations": "Suggest actions to bridge the gaps..."
}}
Do not write other text or markdown blocks.
"""
    if not settings.GEMINI_API_KEY:
        # Mock Response
        return {
            "ats_score": 75,
            "missing_keywords": ["Docker", "Redis", "Git CI/CD", "TypeScript"],
            "matched_skills": ["Python", "SQL", "Flask", "React"],
            "missing_skills": ["Containerization", "Caching layers", "DevOps"],
            "gap_recommendations": "Add Docker containers to your personal projects and study Redis caching."
        }
        
    try:
        res = query_gemini(prompt, is_json=True)
        return json.loads(res)
    except Exception:
        return {
            "ats_score": 50,
            "missing_keywords": [],
            "matched_skills": [],
            "missing_skills": [],
            "gap_recommendations": "Error computing ATS feedback. Please verify job description inputs."
        }

# --- 4. Career Recommendation Agent ---
def generate_career_roadmap(current_role: str, target_role: str, resume_json: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Generates transition milestones and course recommendations.
    """
    profile_str = json.dumps(resume_json) if resume_json else "No profile parsed"
    prompt = f"""
You are the Career Recommendation Agent. Map out a step-by-step transition roadmap.

Current Role: {current_role}
Target Role: {target_role}
Candidate Profile:
{profile_str}

Task:
Produce 3 to 4 sequential milestones.
For each milestone:
1. sequence_order (Integer index)
2. milestone_title
3. description of what to achieve
4. estimated_timeline (e.g. '1 Month')
5. recommended_courses (Course Title, Provider e.g. Udemy/Coursera, Url, Skill covered)

You MUST respond strictly with a JSON object matching this schema:
{{
  "milestones": [
    {{
      "sequence_order": 1,
      "milestone_title": "Learn AWS Cloud Basics",
      "description": "Gain familiarity with core hosting services...",
      "estimated_timeline": "Month 1",
      "recommended_courses": [
        {{
          "course_title": "AWS Certified Cloud Practitioner",
          "provider": "Coursera",
          "url": "https://coursera.org",
          "skill_covered": "Cloud computing"
        }}
      ]
    }}
  ]
}}
Ensure output is valid JSON and nothing else.
"""
    if not settings.GEMINI_API_KEY:
        return {
            "milestones": [
                {
                    "sequence_order": 1,
                    "milestone_title": "Advanced Python & Frameworks",
                    "description": "Deepen backend skills by building REST servers with Flask and FastAPI.",
                    "estimated_timeline": "Weeks 1-4",
                    "recommended_courses": [
                        {
                            "course_title": "Python Web Developer Bootcamp",
                            "provider": "Udemy",
                            "url": "https://udemy.com",
                            "skill_covered": "Flask/SQL"
                        }
                    ]
                },
                {
                    "sequence_order": 2,
                    "milestone_title": "DevOps & Infrastructure basics",
                    "description": "Learn to containerize Python apps and run basic pipelines.",
                    "estimated_timeline": "Weeks 5-8",
                    "recommended_courses": [
                        {
                            "course_title": "Docker and Kubernetes Fundamentals",
                            "provider": "Coursera",
                            "url": "https://coursera.org",
                            "skill_covered": "Docker"
                        }
                    ]
                }
            ]
        }
        
    try:
        res = query_gemini(prompt, is_json=True)
        return json.loads(res)
    except Exception:
        return {"milestones": []}

# --- 5. Resume Improvement Agent & 6. Cover Letter Generator & 8. Job Matching Agent ---
def generate_tailored_profile(
    resume_json: Dict[str, Any], target_job_title: str, target_job_description: str
) -> Dict[str, Any]:
    """
    Tailors the resume highlights, generates a matching cover letter, and computes match rating.
    """
    prompt = f"""
You are the Resume Improvement and Cover Letter Generator Agent.
Compare the user profile with the job specs:

Job Title: {target_job_title}
Job Description:
{target_job_description}

Candidate Profile (JSON):
{json.dumps(resume_json, indent=2)}

Task:
1. Tailor the professional summary to align with the target role.
2. Provide tailored resume experience points (in clean Markdown format) highlighting matching achievements.
3. Generate a complete, polished, target-specific cover letter.
4. Estimate a final Job Match score (percentage out of 100).

You MUST respond strictly with a valid JSON matching this schema:
{{
  "tailored_summary": "Tailored summary statement...",
  "tailored_experience_markdown": "### Experiences\\n* Revised experience bullet points...",
  "cover_letter_markdown": "Dear Hiring Team,\\n\\nI am writing to express my interest...",
  "job_match_score": 85
}}
Do not write other conversational text.
"""
    if not settings.GEMINI_API_KEY:
        return {
            "tailored_summary": f"Targeted developer prepared to step into the **{target_job_title}** role.",
            "tailored_experience_markdown": f"### Work Highlights\\n* Developed backend applications matching **{target_job_title}** requirements.\\n* Optimized database schema indexing.",
            "cover_letter_markdown": f"Dear Hiring Team,\\n\\nI am highly excited to apply for the **{target_job_title}** position. My experience in full stack software engineering aligns perfectly with the requirements...",
            "job_match_score": 80
        }
        
    try:
        res = query_gemini(prompt, is_json=True)
        return json.loads(res)
    except Exception:
        return {
            "tailored_summary": "Failed to tailor summary.",
            "tailored_experience_markdown": "Error occurred.",
            "cover_letter_markdown": "Error generating cover letter.",
            "job_match_score": 50
        }

# --- 7. Interview Preparation Agent ---
def generate_interview_question(
    job_title: str, job_description: str, resume_json: Dict[str, Any], chat_history: List[Dict[str, Any]]
) -> str:
    """
    Generates a mock interview question based on chat history.
    """
    history_formatted = ""
    for turn in chat_history:
        history_formatted += f"{turn['speaker']}: {turn['transcript']}\n"

    prompt = f"""
You are the Interview Preparation Agent simulating an interviewer for: **{job_title}**.

Job Description:
{job_description}

Candidate Profile:
{json.dumps(resume_json, indent=2)}

Chat history:
{history_formatted}

Task:
Generate ONLY the NEXT single question to ask the candidate. Do not output anything else.
"""
    if not settings.GEMINI_API_KEY:
        if not chat_history:
            return f"Welcome! Let's start the mock interview for {job_title}. Can you walk me through a major coding feature you implemented recently?"
        else:
            return "That's standard. How do you ensure your backend API handles high concurrent traffic safely?"
            
    try:
        return query_gemini(prompt)
    except Exception:
        return "Could you elaborate on how you structured your database designs?"

def grade_interview_turn(question: str, answer: str, job_title: str) -> Dict[str, Any]:
    """
    Grades user answer turn and gives feedback score.
    """
    prompt = f"""
You are the Interview Preparation Agent acting as an Interview Coach.
Grade the candidate's answer for **{job_title}**:

Question: {question}
Candidate Answer: {answer}

Task:
1. Provide a score between 1 and 100.
2. Provide bullet-point feedback (Strengths and Improvements).

You MUST respond strictly with a valid JSON matching this schema:
{{
  "score": 80,
  "feedback": "### Strengths\\n* Good details\\n\\n### Improvements\\n* Apply the STAR method..."
}}
Do not write other conversational text.
"""
    if not settings.GEMINI_API_KEY:
        return {
            "score": 85,
            "feedback": "### Strengths\n* Clear answer.\n\n### Improvements\n* Mention database indices specifically."
        }
        
    try:
        res = query_gemini(prompt, is_json=True)
        return json.loads(res)
    except Exception:
        return {"score": 70, "feedback": "Good attempt. Add details."}
