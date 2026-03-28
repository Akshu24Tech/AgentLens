from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid

class SpanCreate(BaseModel):
    span_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trace_id: str
    parent_id: Optional[str] = None
    name: str # e.g. "ResearchAgent", "GoogleSearchTool"
    type: str # "agent", "tool", "llm", "chain", "workflow"
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    state_before: Optional[Dict[str, Any]] = None
    state_after: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

class TraceCreate(BaseModel):
    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    project_id: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
