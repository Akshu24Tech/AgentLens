import time
import uuid
from datetime import datetime
import sys
import os

# Add parent dir to path for sdk import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sdk.agentlens import AgentLensClient

def run_stress_test():
    client = AgentLensClient(project_id="stress-test-project")
    
    print("🚀 Starting real-time WebSocket stress test...")
    
    with client.trace("Real-time Autonomous Flow") as trace:
        # 1. Initial Planning
        with trace.span("Strategic Planner", type="agent") as agent:
            agent.set_metadata("strategy", "breadth-first-search")
            time.sleep(1)
            
            # 2. Parallel research spans
            for i in range(10):
                span_name = f"Research Batch {i+1}"
                print(f"  Sending span: {span_name}")
                with agent.span(span_name, type="tool") as tool:
                    tool.set_input({"query": f"parameter {i}"})
                    time.sleep(0.5) # Fast updates
                    tool.set_output({"result": f"found data for {i}"})
                
                # Small delay to see it grow in UI
                time.sleep(0.2)

        # 3. Final Summary
        with trace.span("Synthesizer", type="llm") as llm:
            llm.set_input({"data": "all research results"})
            time.sleep(1)
            llm.set_output({"summary": "Stress test successful. UI update confirmed."})

    # Ensure all background threads finish sending telemetry
    client.flush()
    print("✅ Stress test complete. Check your dashboard on Port 3000!")

if __name__ == "__main__":
    run_stress_test()
