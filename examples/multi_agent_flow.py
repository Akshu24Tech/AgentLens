import time
import random
from sdk.agentlens import AgentLensClient

def run_multi_agent_simulation():
    client = AgentLensClient(project_id="demo-project")
    
    # 1. Start Main Research Trace
    trace_id = client.create_trace(name="Deep Research: Quantum Computing")
    
    with client.create_span(name="Planner Agent", state_before={"task": "Research Quantum Computing"}) as planner:
        time.sleep(1)
        plan = ["Search for recent papers", "Summarize findings", "Generate report"]
        planner.end_span(state_after={"plan": plan, "status": "done"})
        
        # 2. Search Phase (Child Spans)
        with client.create_span(name="Browser Agent", parent_id=planner.span_id, state_before={"search_queries": plan[0]}) as browser:
            time.sleep(0.5)
            
            # Tool call inside browser
            with client.create_span(name="Google Search Tool", parent_id=browser.span_id, state_before={"query": "Quantum computing advances 2024"}) as search:
                time.sleep(1.5)
                results = ["Paper A: Error Mitigation", "Paper B: Topological Qubits"]
                search.end_span(state_after={"results": results})
            
            browser.end_span(state_after={"found_sources": len(results)})
            
        # 3. Summarization Phase
        with client.create_span(name="Writer Agent", parent_id=planner.span_id, state_before={"sources": results}) as writer:
            time.sleep(1)
            
            # Sub-task: LLM Call
            with client.create_span(name="GPT-4 Summarizer", parent_id=writer.span_id, state_before={"text": "..."}) as gpt:
                time.sleep(2)
                gpt.end_span(state_after={"summary": "Quantum computing is evolving rapidly with a focus on error correction."})
                
            writer.end_span(state_after={"document": "Final summary generated."})

    print(f"Simulation complete! Trace ID: {trace_id}")
    print("Check your dashboard at http://localhost:3000")

if __name__ == "__main__":
    run_multi_agent_simulation()
