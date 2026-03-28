from fastapi import FastAPI, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

# In a real app, I'd use SQLAlchemy, for MVP, we'll store in-memory for speed, 
# then swap to Postgres/SQLite in the next hour.
from schemas import SpanCreate, TraceCreate, OrganisationOtherOrgsCreationRequest, ProjectUpdate

app = FastAPI(title="AgentLens Ingestion Server")

# Initialise data store
traces = {} # trace_id -> Trace
spans = [] # List of Spans
organisations = {} # org_id -> Organisation

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "message": "AgentLens API is ready to ingest traces."}

@app.post("/ingest/trace", status_code=status.HTTP_201_CREATED)
async def ingest_trace(trace: TraceCreate):
    traces[trace.trace_id] = trace.dict()
    return {"status": "success", "trace_id": trace.trace_id}

@app.post("/ingest/span", status_code=status.HTTP_201_CREATED)
async def ingest_span(span: SpanCreate):
    # Verify trace exists
    if span.trace_id not in traces:
        # Create a default trace if missing
        traces[span.trace_id] = {
            "trace_id": span.trace_id,
            "name": f"Auto-Trace-{span.trace_id[:8]}",
            "project_id": "default",
            "start_time": datetime.utcnow(),
            "metadata": {}
        }
    
    spans.append(span.dict())
    return {"status": "success", "span_id": span.span_id}

@app.get("/traces")
async def get_traces():
    return list(traces.values())

@app.get("/traces/{trace_id}")
async def get_trace_detail(trace_id: str):
    if trace_id not in traces:
        raise HTTPException(status_code=404, detail="Trace not found")
    
    trace_spans = [s for s in spans if s["trace_id"] == trace_id]
    
    # Return flattened spans (UI will build the tree)
    return {
        "trace": traces[trace_id],
        "spans": trace_spans
    }

@app.post("/organisations", status_code=status.HTTP_201_CREATED)
async def create_organisation(org: OrganisationOtherOrgsCreationRequest):
    org_id = str(uuid.uuid4())
    organisations[org_id] = org.dict()
    organisations[org_id]["id"] = org_id
    return {"status": "success", "organisation_id": org_id}

@app.patch("/organisations/{org_id}", status_code=status.HTTP_200_OK)
async def update_organisation(org_id: str, updates: Dict[str, Any]):
    if org_id not in organisations:
        raise HTTPException(status_code=404, detail="Organisation not found")
    
    organisations[org_id].update(updates)
    return {"status": "success", "organisation_id": org_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
