import os
import json
import logging
import google.generativeai as genai
from typing import List, Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY is not set. The application will run in MOCK mode.")

def get_embedding(text: str) -> List[float]:
    """
    Generate 768-dimensional text embeddings using Gemini text-embedding-004.
    If no API key is available, returns a mock vector.
    """
    if not settings.GEMINI_API_KEY:
        # Return a mock 768-dimensional vector
        import random
        random.seed(hash(text))
        return [random.uniform(-0.1, 0.1) for _ in range(768)]
    
    try:
        # Limit text length to avoid token limits
        truncated_text = text[:8000]
        response = genai.embed_content(
            model="models/text-embedding-004",
            content=truncated_text,
            task_type="retrieval_document"
        )
        return response['embedding']
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        # Fallback vector
        import random
        random.seed(hash(text))
        return [random.uniform(-0.1, 0.1) for _ in range(768)]

def parse_resume_text(text: str) -> Dict[str, Any]:
    """
    Parses resume text and extracts a structured JSON profile using Gemini.
    """
    prompt = f"""
You are an expert ATS (Applicant Tracking System) parser and Profile Analyzer Agent.
Analyze the following resume text and extract the candidate's professional profile.

Extract:
1. Summary (A professional summary)
2. Skills (A list of technical and soft skills, estimating their level as 'Beginner', 'Intermediate', or 'Advanced' based on details, and years of experience if possible)
3. Experience (Work history, company names, job titles, start/end dates, description, and key achievement highlights)
4. Education (Degrees, fields of study, institutions, graduation years)

You MUST respond strictly with a JSON object following this exact schema:
{{
  "summary": "Professional summary here...",
  "skills": [
    {{"name": "Skill Name", "level": "Advanced", "years_experience": 5.0}}
  ],
  "experience": [
    {{
      "job_title": "Software Engineer",
      "company": "Tech Corp",
      "start_date": "Jan 2020",
      "end_date": "Present",
      "description": "Short description of role...",
      "highlights": ["Achieved X by doing Y", "Led Z project"]
    }}
  ],
  "education": [
    {{
      "degree": "Bachelor of Science",
      "field_of_study": "Computer Science",
      "institution": "State University",
      "graduation_year": 2019
    }}
  ]
}}

Ensure the output is valid JSON and nothing else. Do not wrap it in markdown code blocks.

Resume Text:
{text}
"""
    
    if not settings.GEMINI_API_KEY:
        # Mocked parsed resume
        return {
            "summary": "Experienced software developer with a strong foundation in backend systems and cloud architectures.",
            "skills": [
                {"name": "Python", "level": "Advanced", "years_experience": 4.0},
                {"name": "FastAPI", "level": "Advanced", "years_experience": 2.0},
                {"name": "PostgreSQL", "level": "Intermediate", "years_experience": 3.0},
                {"name": "React", "level": "Intermediate", "years_experience": 2.0},
                {"name": "Docker", "level": "Intermediate", "years_experience": 2.0}
            ],
            "experience": [
                {
                    "job_title": "Full Stack Developer",
                    "company": "Innovate Solutions",
                    "start_date": "2024-01",
                    "end_date": "Present",
                    "description": "Building modern web applications and scaling serverless APIs.",
                    "highlights": [
                        "Designed and built core API using FastAPI, cutting latency by 35%.",
                        "Migrated legacy database to Postgres, improving query response times."
                    ]
                },
                {
                    "job_title": "Junior Developer",
                    "company": "Code Labs",
                    "start_date": "2022-06",
                    "end_date": "2023-12",
                    "description": "Assisted in code maintenance and front-end development using React.",
                    "highlights": [
                        "Optimized page rendering by resolving React hook dependencies.",
                        "Wrote unit tests for 15+ backend endpoints."
                    ]
                }
            ],
            "education": [
                {
                    "degree": "Bachelor of Science",
                    "field_of_study": "Computer Science",
                    "institution": "Tech University",
                    "graduation_year": 2022
                }
            ]
        }
        
    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        logger.error(f"Error parsing resume: {e}")
        # Return fallback parse
        return {"summary": "Failed to parse resume text.", "skills": [], "experience": [], "education": []}

def generate_tailored_resume(
    resume_json: Dict[str, Any], target_job_title: str, target_job_description: str
) -> str:
    """
    Tailors the candidate's resume for a specific target job using Gemini.
    Returns tailored resume in Markdown.
    """
    prompt = f"""
You are an expert Resume Tailor Agent.
Compare the user's resume profile with the target job details. Your objective is to optimize the resume details for ATS systems and human recruiters while keeping the data authentic.

Target Job: {target_job_title}
Job Description:
{target_job_description}

Candidate Profile (JSON):
{json.dumps(resume_json, indent=2)}

Task:
1. Revise professional summary to align with the target role, highlighting relevant matches.
2. Rewrite work experience highlights using action verbs and quantifiable results (STAR method) where possible, emphasizing skills needed by the target job.
3. Highlight/prioritize skills matching the job description.
4. Output the result in a clean, professional Markdown resume format.

Constraints:
- Do not fabricate experiences, job titles, companies, or educational degrees.
- Return ONLY the tailordered resume in Markdown. Do not write any conversational intro/outro text.
"""
    if not settings.GEMINI_API_KEY:
        return f"""# Tailored Resume: Candidate Profile

## Professional Summary
Dedicated Software Developer customized for **{target_job_title}**. Experienced in Python, cloud technologies, and database design.

## Professional Experience
### Full Stack Developer | Innovate Solutions
*   Architected robust API layers matching **{target_job_title}** core requirements, decreasing latency by 35%.
*   Engineered PostgreSQL schemas to support high throughput operations.

### Junior Developer | Code Labs
*   Delivered reusable UI modules matching frontend standards.
*   Implemented automated verification checks, achieving 80% test coverage.

## Core Skills
*   Languages: Python, JavaScript, SQL
*   Frameworks: FastAPI, React, Node.js
*   Infrastructure: Docker, Git, RESTful APIs

## Education
*   B.S. in Computer Science | Tech University (2022)
"""

    try:
        model = genai.GenerativeModel("models/gemini-1.5-pro")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error tailoring resume: {e}")
        return "Error occurred while tailoring the resume. Please check API settings."

def generate_interview_question(
    job_title: str, job_description: str, resume_json: Dict[str, Any], chat_history: List[Dict[str, Any]]
) -> str:
    """
    Generates a mock interview question based on the job description, resume, and chat history.
    """
    history_formatted = ""
    for turn in chat_history:
        history_formatted += f"{turn['speaker']}: {turn['transcript']}\n"

    prompt = f"""
You are an expert interviewer simulating a mock interview for the position of **{job_title}**.
You have the candidate's resume and the chat history of the interview.

Target Job Description:
{job_description}

Candidate Resume:
{json.dumps(resume_json, indent=2)}

Interview Chat History so far:
{history_formatted}

Task:
Generate the NEXT single interview question.
- Make it realistic (can be behavioral, structural, or technical based on the history).
- If this is the start of the interview, ask a warm-up or introductory technical/behavioral question.
- Do NOT generate multiple questions at once.
- Output ONLY the interview question text. No conversational meta-commentary.
"""
    if not settings.GEMINI_API_KEY:
        if not chat_history:
            return f"Welcome! Let's start the interview for {job_title}. Can you walk me through your experience building backend APIs and how you've optimized them in the past?"
        else:
            return "That's interesting. Can you tell me how you handle conflicts in team projects, specifically when designing database schemas?"

    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error generating question: {e}")
        return "Could you describe your experience with scalable system design?"

def grade_interview_answer(
    question: str, answer: str, job_title: str, job_description: str
) -> Dict[str, Any]:
    """
    Grades the user's answer to a specific interview question and returns feedback and score.
    """
    prompt = f"""
You are an expert Interview Coach Agent.
Evaluate the candidate's answer to the given question for a **{job_title}** position.

Question: {question}
Candidate Answer: {answer}
Job Description: {job_description}

Task:
Assess the answer based on:
1. STAR structure (Situation, Task, Action, Result) for behavioral, or technical accuracy for technical.
2. Completeness.
3. Clarity and communication skill.

Provide a numerical score between 1 and 100, and constructive markdown feedback.
Return strictly a JSON object with keys:
- "score": (integer out of 100)
- "feedback": (markdown string detailing strengths, areas of improvement, and how to rewrite it)

Do not wrap it in markdown code blocks.
"""
    if not settings.GEMINI_API_KEY:
        return {
            "score": 85,
            "feedback": """### Strengths
*   Clear description of the optimization task and tools used.
*   Good logic in explaining database migration constraints.

### Areas for Improvement
*   **STAR structure:** You mentioned actions, but missed the quantitative result. What was the exact performance gain?
*   **Alternative phrasing:** "To improve, you could say: *'I led the database migration to PostgreSQL, which improved query response times by 35% and supported 5x current traffic.'*"
"""
        }

    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        logger.error(f"Error grading answer: {e}")
        return {"score": 70, "feedback": "Good attempt. Try to include more quantifiable metrics."}

def generate_career_roadmap(
    current_role: str, target_role: str, profile_json: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generates a step-by-step career transition roadmap from current_role to target_role.
    """
    profile_str = json.dumps(profile_json) if profile_json else "No profile provided"
    
    prompt = f"""
You are an expert Career Path Planner Agent.
Map out a transition plan for a professional moving from their current role to a target role.

Current Role: {current_role}
Target Role: {target_role}
Candidate Current Profile:
{profile_str}

Task:
Create a step-by-step career path roadmap. Divide it into logical sequential milestones (3 to 5 milestones).
For each milestone:
1. Sequence order (1-indexed)
2. Milestone title
3. Detailed explanation/description of what to achieve
4. Estimated timeline (e.g., 'Month 1-3')
5. Recommended courses or learning topics (Include title, provider like Coursera/Udemy/YouTube, and skill covered)

You MUST respond strictly with a JSON object following this exact structure:
{{
  "milestones": [
    {{
      "sequence_order": 1,
      "milestone_title": "Title here",
      "description": "Details here...",
      "estimated_timeline": "1-2 Months",
      "recommended_courses": [
        {{
          "course_title": "Course Name",
          "provider": "Coursera",
          "url": "https://coursera.org/example",
          "skill_covered": "Skill Name"
        }}
      ]
    }}
  ]
}}

Ensure output is valid JSON. Do not wrap in markdown code blocks.
"""
    if not settings.GEMINI_API_KEY:
        return {
            "milestones": [
                {
                    "sequence_order": 1,
                    "milestone_title": "Core Language Mastery",
                    "description": "Master advanced aspects of Python and asynchronous programming to prepare for high-performance servers.",
                    "estimated_timeline": "Month 1",
                    "recommended_courses": [
                        {
                            "course_title": "Asynchronous Programming in Python",
                            "provider": "YouTube",
                            "url": "https://youtube.com",
                            "skill_covered": "AsyncIO"
                        }
                    ]
                },
                {
                    "sequence_order": 2,
                    "milestone_title": "API Design & Scaling",
                    "description": "Learn schema validation, performance optimization, and containerization using FastAPI and Docker.",
                    "estimated_timeline": "Month 2-3",
                    "recommended_courses": [
                        {
                            "course_title": "FastAPI Web Development",
                            "provider": "Udemy",
                            "url": "https://udemy.com",
                            "skill_covered": "FastAPI, SQLModel"
                        }
                    ]
                },
                {
                    "sequence_order": 3,
                    "milestone_title": "Cloud Services & CI/CD Deployment",
                    "description": "Gain hands-on knowledge deploy pipelines and managing PostgreSQL instances in cloud providers.",
                    "estimated_timeline": "Month 4",
                    "recommended_courses": [
                        {
                            "course_title": "AWS Cloud Practitioner",
                            "provider": "Coursera",
                            "url": "https://coursera.org",
                            "skill_covered": "Cloud, Devops"
                        }
                    ]
                }
            ]
        }

    try:
        model = genai.GenerativeModel("models/gemini-1.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        logger.error(f"Error generating roadmap: {e}")
        return {"milestones": []}
