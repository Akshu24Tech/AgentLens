import time
from agentlens import AgentLens

# Initialize local AgentLens
al = AgentLens(project_id="phase5-test")

def test_phase5():
    print("🚀 Starting Phase 5 Verification...")
    
    # 1. Capture a trace with specific tags
    with al.trace("Research Agent", tags=["autonomous", "v5-verified"]) as t:
        with t.span("Search Query", type="tool", tags=["search"]) as s:
            s.input = {"query": "advanced agentic coding"}
            s.output = "Found 42 results"
            
        with t.span("Synthesis", type="llm", tags=["reasoning"]) as s:
            s.output = "The future is agentic."
            
    trace_id = t.trace_id
    print(f"✅ Captured Trace: {trace_id}")

    # 2. Verify via REST Search
    import requests
    
    print("\n🔍 Testing Backend Search...")
    
    # Search by global query
    resp = requests.get("http://localhost:8001/search?q=Research&project_id=phase5-test")
    results = resp.json()
    assert any(tr['trace_id'] == trace_id for tr in results), "Failed to find trace by query"
    print("  - Search by query: PASSED")
    
    # Search by tag
    resp = requests.get("http://localhost:8001/search?tag=v5-verified&project_id=phase5-test")
    results = resp.json()
    assert any(tr['trace_id'] == trace_id for tr in results), "Failed to find trace by tag"
    print("  - Search by tag: PASSED")
    
    # Check all tags
    resp = requests.get("http://localhost:8001/tags")
    tags = resp.json()
    assert "v5-verified" in tags, "Tag missing from global list"
    assert "reasoning" in tags, "Span tag missing from global list"
    print("  - Global tag list: PASSED")
    
    print("\n🎉 Phase 5 Verification COMPLETED SUCCESS")

if __name__ == "__main__":
    test_phase5()
