from app.core.database import engine, Base
# Import models to register them
from app.models.models import User, Resume, TailoredResume, JobApplication, InterviewSession, InterviewTurn, CareerPath, CareerMilestone, RecommendedCourse

def init_db():
    print("Initializing SQLite Database...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
