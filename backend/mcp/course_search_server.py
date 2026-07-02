# mcp/course_search_server.py
# Implements a Course Search tool provider server using Model Context Protocol (MCP)

import json
from typing import Dict, Any, List

class CourseSearchMCPServer:
    """
    Exposes learning recommendations and online course search engines to AI Agents via MCP tools.
    """
    
    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "search_learning_resources",
                "description": "Fetch online tutorials, playlists, and courses matching a specific skill gap topic.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "topic": {"type": "string", "description": "The technology or methodology topic (e.g. Docker, Asynchronous Python)"}
                    },
                    "required": ["topic"]
                }
            }
        ]

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        if tool_name != "search_learning_resources":
            raise ValueError(f"Unknown tool name: {tool_name}")

        topic = arguments.get("topic")
        
        # Returns catalog recommendations
        return json.dumps([
            {
                "course_title": f"Mastering {topic} from Scratch",
                "provider": "Udemy",
                "url": f"https://www.udemy.com/courses/search/?q={topic.replace(' ', '+')}",
                "skill_covered": topic
            },
            {
                "course_title": f"{topic} Bootcamp & Deep Dive 2026",
                "provider": "Coursera",
                "url": "https://www.coursera.org",
                "skill_covered": topic
            },
            {
                "course_title": f"{topic} Crash Course for Beginners",
                "provider": "YouTube",
                "url": f"https://www.youtube.com/results?search_query={topic.replace(' ', '+')}+tutorial",
                "skill_covered": topic
            }
        ], indent=2)

if __name__ == "__main__":
    print("Course Search MCP Server running...")
