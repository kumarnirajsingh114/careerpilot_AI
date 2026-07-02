import sys
import os

# Append current directory to path so imports resolve correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

if __name__ == "__main__":
    from app.core.init_db import init_db
    init_db()
    
    print("CareerPilot AI server launching at http://localhost:8000")
    app.run(host="0.0.0.0", port=8000, debug=True)
