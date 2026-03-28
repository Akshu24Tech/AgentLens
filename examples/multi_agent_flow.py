import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "sdk"))

from agentlens import trace, client
import time

# Simulation of a shared state object used in LangGraph/CrewAI
app_state = {
    "query": "Future of Robotics",
    "research_notes": [],
    "critique": None,
    "final_report": None
}

@trace(name="Web Search", type="tool", state_key="state")
def search_step(state: dict):
    print("--- Searching for information ---")
    state["research_notes"].append("Found: Boston Dynamics is leading bipeds.")
    state["research_notes"].append("Found: Tesla Optimus is scaling fast.")
    time.sleep(0.5)
    return "Search completed"

@trace(name="Writer Agent", type="agent", state_key="state")
def write_step(state: dict):
    print("--- Writing summary ---")
    notes = " ".join(state["research_notes"])
    state["final_report"] = f"Robotics Report: {notes}"
    time.sleep(0.5)
    return "Report written"

@trace(name="Robotics Multi-Agent Workflow", type="workflow", state_key="state")
def run_workflow(state: dict):
    client.create_trace(name="Robotics Research Run", metadata={"version": "1.0"})
    
    search_step(state=state)
    write_step(state=state)
    
    return "Workflow complete"

if __name__ == "__main__":
    print("Starting multi-agent workflow...")
    run_workflow(state=app_state)
    client.flush()
    print("\nWorkflow finished! State was successfully tracked across steps.")
    print(f"Final State: {app_state}")
