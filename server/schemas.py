from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid

class ProjectCreate(BaseModel):
    name: str = Field(..., description="Unique name of the project")
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ProjectUpdate(BaseModel):
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

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

class OrgAttributeRequest(BaseModel):
    key: str
    value: Optional[str] = None

class ContactInformationCreationRequest(BaseModel):
    address_line1: str
    address_line2: Optional[str] = None
    address_line3: Optional[str] = None
    town_city: str
    county: Optional[str] = None
    country: str
    post_code: str

class UserCreationRequest(BaseModel):
    first_name: str
    last_name: str
    email: str

class OrganisationCreationRequest(BaseModel):
    name: str
    status: Optional[str] = "PENDING"
    sra_id: Optional[str] = None
    sra_regulated: Optional[bool] = None
    company_number: Optional[str] = None
    company_url: Optional[str] = None
    super_user: UserCreationRequest
    payment_account: List[str] = Field(default_factory=list)
    contact_information: List[ContactInformationCreationRequest] = Field(default_factory=list)

class OrganisationOtherOrgsCreationRequest(OrganisationCreationRequest):
    org_type: str
    org_attributes: List[OrgAttributeRequest] = Field(default_factory=list)
