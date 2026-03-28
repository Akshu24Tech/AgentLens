import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "sdk"))

from agentlens import trace, client
import time

# Create a trace for the session
client.create_trace(name="Research Project", project_id="test-project")

@trace(name="Search Engine", type="tool")
def search_tool(query: str):
    time.sleep(1) # Simulate search latency
    return f"Results for {query}: [AgentLens is cool, LangSmith vs AgentLens]"

@trace(name="Research Agent", type="agent")
def main_agent(topic: str):
    print(f"Agent starts researching {topic}...")
    results = search_tool(topic)
    print(f"Agent found: {results}")
    return {"summary": f"Research on {topic} completed.", "sources": [results]}

if __name__ == "__main__":
    # Ingesting the agent execution
    try:
        main_agent("Next-gen AI Observability")
        client.flush() # Wait for all background requests to finish
        print("\nTrace completed! Check your AgentLens server.")
    except Exception as e:
        print(f"Execution failed: {e}")
