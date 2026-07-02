# mcp/job_search_server.py
# Implements a Job Search tool provider server using Model Context Protocol (MCP)

import os
import json
import httpx
from typing import Dict, Any, List

class JobSearchMCPServer:
    """
    Exposes Job Searching tools to LLM Agents via standard MCP JSON-RPC protocol.
    """
    def __init__(self):
        self.api_url = "https://serpapi.com/search"  # Example search endpoint
        self.api_key = os.environ.get("SERPAPI_API_KEY", "")

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "search_live_jobs",
                "description": "Query Google Jobs API to find active positions matching job titles and location.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "keywords": {"type": "string", "description": "Job title or key technology (e.g. FastAPI, React)"},
                        "location": {"type": "string", "description": "Target geographic location (e.g. Remote, Austin TX)"}
                    },
                    "required": ["keywords"]
                }
            }
        ]

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        if tool_name != "search_live_jobs":
            raise ValueError(f"Unknown tool name: {tool_name}")

        keywords = arguments.get("keywords")
        location = arguments.get("location", "Remote")

        # Mock query return for demo integration, or query if API key is present
        if not self.api_key:
            return json.dumps([
                {
                    "title": f"Senior {keywords} Engineer",
                    "company": "TechInnovate Inc.",
                    "location": location,
                    "salary_range": "$115,000 - $140,000",
                    "url": "https://example.com/apply/1",
                    "description": "Looking for a seasoned developer to scale agent pipelines."
                },
                {
                    "title": f"Lead {keywords} Developer",
                    "company": "Apex Analytics",
                    "location": location,
                    "salary_range": "$135,000 - $160,000",
                    "url": "https://example.com/apply/2",
                    "description": "Develop full-stack web architectures and databases."
                }
            ], indent=2)

        # Real API request
        async with httpx.AsyncClient() as client:
            try:
                params = {
                    "engine": "google_jobs",
                    "q": f"{keywords} in {location}",
                    "api_key": self.api_key
                }
                res = await client.get(self.api_url, params=params)
                data = res.json()
                return json.dumps(data.get("jobs_results", [])[:5], indent=2)
            except Exception as e:
                return json.dumps({"error": f"Failed to query job search engine: {str(e)}"})

# Server Entrypoint loop
if __name__ == "__main__":
    import asyncio
    print("Job Search MCP Server started over Stdin/Stdout interface...")
    # Standard stdin communication loops are managed by the MCP SDK wrapper in production.
