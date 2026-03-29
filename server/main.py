from fastapi import FastAPI, HTTPException, status, Response, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import json
from sqlalchemy.orm import Session

from database import engine, SessionLocal, get_db
import models
import schemas

# Create the database tables
models.Base.metadata.create_all(bind=engine)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: str):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)

    def disconnect(self, websocket: WebSocket, project_id: str):
        if project_id in self.active_connections:
            self.active_connections[project_id].remove(websocket)

    async def broadcast_to_project(self, project_id: str, message: dict):
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                await connection.send_json(message)

manager = ConnectionManager()

app = FastAPI(title="AgentLens Ingestion Server")

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
async def ingest_trace(trace: schemas.TraceCreate, db: Session = Depends(get_db)):
    # Check if project exists, auto-create if not
    db_project = db.query(models.Project).filter(models.Project.name == trace.project_id).first()
    if not db_project:
        db_project = models.Project(name=trace.project_id, description="Auto-created via ingestion")
        db.add(db_project)
        db.commit()
        db.refresh(db_project)

    # Check if trace exists
    db_trace = db.query(models.Trace).filter(models.Trace.trace_id == trace.trace_id).first()
    if db_trace:
        return {"status": "exists", "trace_id": trace.trace_id}
    
    new_trace = models.Trace(
        trace_id=trace.trace_id,
        name=trace.name,
        project_id_name=trace.project_id,
        start_time=trace.start_time,
        metadata_json=trace.metadata,
        tags=trace.metadata.get("tags", []) # Support tags in metadata or explicit
    )
    db.add(new_trace)
    db.commit()
    
    # Broadcast update
    await manager.broadcast_to_project(trace.project_id, {
        "type": "trace_created",
        "data": {
            "trace_id": trace.trace_id,
            "name": trace.name,
            "project_id": trace.project_id,
            "start_time": trace.start_time.isoformat() if trace.start_time else None,
            "metadata": trace.metadata
        }
    })
    
    return {"status": "success", "trace_id": trace.trace_id}

@app.post("/ingest/span", status_code=status.HTTP_201_CREATED)
async def ingest_span(span: schemas.SpanCreate, db: Session = Depends(get_db)):
    # Ensure trace exists
    db_trace = db.query(models.Trace).filter(models.Trace.trace_id == span.trace_id).first()
    if not db_trace:
        # Create auto-trace if missing
        db_trace = models.Trace(
            trace_id=span.trace_id,
            name=f"Auto-Trace-{span.trace_id[:8]}",
            project_id_name="default",
            start_time=datetime.utcnow(),
            metadata_json={}
        )
        db.add(db_trace)
        db.commit()

    # Check if span exists (for updates)
    db_span = db.query(models.Span).filter(models.Span.span_id == span.span_id).first()
    
    if db_span:
        # Update existing span
        if span.end_time: db_span.end_time = span.end_time
        if span.output: db_span.output_json = span.output
        if span.state_before: db_span.state_before = span.state_before
        if span.state_after: db_span.state_after = span.state_after
        if span.error: 
            db_span.error = span.error
            db_span.status = "failure"
        elif span.end_time: # If finished without error
            db_span.status = "success"
        
        db.commit()
        
        # Broadcast update for existing span
        await manager.broadcast_to_project(db_trace.project_id_name, {
            "type": "span_updated",
            "data": {
                "span_id": db_span.span_id,
                "trace_id": db_span.trace_id,
                "parent_id": db_span.parent_id,
                "name": db_span.name,
                "type": db_span.type,
                "status": db_span.status
            }
        })
        
        return {"status": "updated", "span_id": span.span_id}

    # Create new span
    new_span = models.Span(
        span_id=span.span_id,
        trace_id=span.trace_id,
        parent_id=span.parent_id,
        name=span.name,
        type=span.type,
        start_time=span.start_time,
        end_time=span.end_time,
        input_json=span.input,
        output_json=span.output,
        metadata_json=span.metadata,
        state_before=span.state_before,
        state_after=span.state_after,
        error=span.error,
        status="success" if span.end_time and not span.error else "failure" if span.error else "pending",
        tags=span.tags
    )
    db.add(new_span)
    db.commit()
    
    # Broadcast update (for both new and updated spans)
    span_data = {
        "span_id": span.span_id,
        "trace_id": span.trace_id,
        "parent_id": span.parent_id,
        "name": span.name,
        "type": span.type,
        "status": "success" if span.end_time and not span.error else "failure" if span.error else "pending"
    }
    
    await manager.broadcast_to_project(db_trace.project_id_name, {
        "type": "span_updated",
        "data": span_data
    })

    return {"status": "success", "span_id": span.span_id}

@app.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    await manager.connect(websocket, project_id)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)

@app.get("/projects")
async def get_projects(db: Session = Depends(get_db)):
    projects = db.query(models.Project).all()
    return projects

@app.get("/projects/{name}")
async def get_project_details(name: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.name == name).first()
    if not project:
        # Auto-create if it's the first time we see it
        project = models.Project(name=name, description="Auto-created project")
        db.add(project)
        db.commit()
        db.refresh(project)
    
    # Calculate some basic metrics
    trace_ids = [t.trace_id for t in project.traces]
    spans = db.query(models.Span).filter(models.Span.trace_id.in_(trace_ids)).all() if trace_ids else []
    
    total_spans = len(spans)
    total_traces = len(project.traces)
    
    # Calculate average duration for successful spans
    durations = [
        (s.end_time - s.start_time).total_seconds()
        for s in spans if s.end_time and s.start_time
    ]
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    failure_rate = len([s for s in spans if s.status == "failure"]) / total_spans if total_spans > 0 else 0

    return {
        "project": project,
        "metrics": {
            "total_traces": total_traces,
            "total_spans": total_spans,
            "avg_duration": round(avg_duration, 2),
            "failure_rate": round(failure_rate, 4)
        }
    }

@app.get("/traces")
async def get_traces(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Trace)
    if project_id:
        query = query.filter(models.Trace.project_id_name == project_id)
    
    traces = query.all()
    # Format for UI compatibility
    return [
        {
            "trace_id": t.trace_id,
            "name": t.name,
            "project_id": t.project_id_name,
            "start_time": t.start_time,
            "metadata": t.metadata_json
        } for t in traces
    ]

@app.get("/traces/{trace_id}")
async def get_trace_detail(trace_id: str, db: Session = Depends(get_db)):
    db_trace = db.query(models.Trace).filter(models.Trace.trace_id == trace_id).first()
    if not db_trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    
    db_spans = db.query(models.Span).filter(models.Span.trace_id == trace_id).all()
    
    # Format for UI
    return {
        "trace": {
            "trace_id": db_trace.trace_id,
            "name": db_trace.name,
            "project_id": db_trace.project_id_name,
            "start_time": db_trace.start_time,
            "metadata": db_trace.metadata_json
        },
        "spans": [
            {
                "span_id": s.span_id,
                "trace_id": s.trace_id,
                "parent_id": s.parent_id,
                "name": s.name,
                "type": s.type,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "input": s.input_json,
                "output": s.output_json,
                "metadata": s.metadata_json,
                "state_before": s.state_before,
                "state_after": s.state_after,
                "error": s.error,
                "status": s.status
            } for s in db_spans
        ]
    }

@app.get("/search")
async def search_traces(
    q: Optional[str] = None, 
    project_id: Optional[str] = None,
    tag: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Trace)
    
    if project_id:
        query = query.filter(models.Trace.project_id_name == project_id)
    
    if q:
        query = query.filter(models.Trace.name.contains(q) | models.Trace.trace_id.contains(q))
    
    if tag:
        # Simplistic JSON tag search for SQLite
        query = query.filter(models.Trace.tags.contains(tag))
        
    traces = query.order_by(models.Trace.start_time.desc()).limit(50).all()
    
    return [
        {
            "trace_id": t.trace_id,
            "name": t.name,
            "project_id": t.project_id_name,
            "start_time": t.start_time,
            "metadata": t.metadata_json,
            "tags": t.tags
        } for t in traces
    ]

@app.get("/tags")
async def get_all_tags(db: Session = Depends(get_db)):
    # This is a bit expensive in SQLite without a separate tags table, but works for early stages
    trace_tags = db.query(models.Trace.tags).all()
    span_tags = db.query(models.Span.tags).all()
    
    unique_tags = set()
    for t_list in trace_tags:
        if t_list[0]: unique_tags.update(t_list[0])
    for s_list in span_tags:
        if s_list[0]: unique_tags.update(s_list[0])
        
    return sorted(list(unique_tags))

@app.post("/organisations", status_code=status.HTTP_201_CREATED)
async def create_organisation(org: schemas.OrganisationOtherOrgsCreationRequest, db: Session = Depends(get_db)):
    org_id = str(uuid.uuid4())
    new_org = models.Organisation(
        id=org_id,
        name=org.name,
        status=org.status,
        org_type=org.org_type,
        details=org.dict()
    )
    db.add(new_org)
    db.commit()
    return {"status": "success", "organisation_id": org_id}

@app.patch("/organisations/{org_id}", status_code=status.HTTP_200_OK)
async def update_organisation(org_id: str, updates: Dict[str, Any], db: Session = Depends(get_db)):
    db_org = db.query(models.Organisation).filter(models.Organisation.id == org_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organisation not found")
    
    # Update logic (simplistic update of details for now)
    new_details = db_org.details.copy()
    new_details.update(updates)
    db_org.details = new_details
    db.commit()
    return {"status": "success", "organisation_id": org_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
