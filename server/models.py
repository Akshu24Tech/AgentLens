from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    metadata_json = Column(JSON, default={})
    
    traces = relationship("Trace", back_populates="project")

class Trace(Base):
    __tablename__ = "traces"
    
    trace_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    project_id_name = Column(String, ForeignKey("projects.name"))
    start_time = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(JSON, default={})
    tags = Column(JSON, default=[])
    
    project = relationship("Project", back_populates="traces")
    spans = relationship("Span", back_populates="trace")

class Span(Base):
    __tablename__ = "spans"
    
    span_id = Column(String, primary_key=True, index=True)
    trace_id = Column(String, ForeignKey("traces.trace_id"))
    parent_id = Column(String, nullable=True)
    name = Column(String)
    type = Column(String) # agent, tool, llm, etc.
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    input_json = Column(JSON, nullable=True)
    output_json = Column(JSON, nullable=True)
    metadata_json = Column(JSON, default={})
    state_before = Column(JSON, nullable=True)
    state_after = Column(JSON, nullable=True)
    error = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, success, failure
    tags = Column(JSON, default=[])
    
    trace = relationship("Trace", back_populates="spans")

class Organisation(Base):
    __tablename__ = "organisations"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    status = Column(String, default="PENDING")
    org_type = Column(String)
    # Additional fields can be added as JSON for now to match the complex request DTO
    details = Column(JSON, default={})
