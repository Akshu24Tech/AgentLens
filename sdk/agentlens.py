import requests
import uuid
import time
import functools
import threading
from datetime import datetime
from typing import Any, Dict, Optional, List
from contextvars import ContextVar

# Context variables for trace and span IDs
_current_trace_id: ContextVar[Optional[str]] = ContextVar("_current_trace_id", default=None)
_current_span_id: ContextVar[Optional[str]] = ContextVar("_current_span_id", default=None)

class AgentLensClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.active_threads = []

    def _send_ingest_request(self, endpoint: str, data: Dict[str, Any]):
        # Async-ish: send in background to avoid blocking agent
        def run():
            try:
                requests.post(f"{self.base_url}/ingest/{endpoint}", json=data, timeout=5)
            except Exception as e:
                print(f"AgentLens Ingestion Error: {e}")
        
        t = threading.Thread(target=run)
        self.active_threads.append(t)
        t.start()

    def flush(self):
        """Wait for all pending ingestion requests to complete."""
        for t in self.active_threads:
            if t.is_alive():
                t.join()
        self.active_threads = []

    def create_trace(self, name: str, project_id: str = "default", metadata: Dict[str, Any] = {}) -> str:
        trace_id = str(uuid.uuid4())
        _current_trace_id.set(trace_id)
        
        data = {
            "trace_id": trace_id,
            "name": name,
            "project_id": project_id,
            "start_time": datetime.utcnow().isoformat(),
            "metadata": metadata
        }
        self._send_ingest_request("trace", data)
        return trace_id

    def create_span(self, name: str, type: str = "agent", parent_id: Optional[str] = None, 
                    input: Optional[Dict[str, Any]] = None, 
                    metadata: Dict[str, Any] = {},
                    state_before: Optional[Dict[str, Any]] = None) -> str:
        
        trace_id = _current_trace_id.get()
        if not trace_id:
            trace_id = self.create_trace(name=f"auto_{name}")
            
        span_id = str(uuid.uuid4())
        parent_id = parent_id or _current_span_id.get()
        
        data = {
            "span_id": span_id,
            "trace_id": trace_id,
            "parent_id": parent_id,
            "name": name,
            "type": type,
            "start_time": datetime.utcnow().isoformat(),
            "input": input,
            "metadata": metadata,
            "state_before": state_before
        }
        self._send_ingest_request("span", data)
        return span_id

    def end_span(self, span_id: str, output: Optional[Dict[str, Any]] = None, 
                 error: Optional[str] = None, state_after: Optional[Dict[str, Any]] = None):
        data = {
            "span_id": span_id,
            "trace_id": _current_trace_id.get(),
            "end_time": datetime.utcnow().isoformat(),
            "output": output,
            "error": error,
            "state_after": state_after
        }
        # In this simple MVP, we just send a "patch" or a full span again
        self._send_ingest_request("span", data)

# Global client
client = AgentLensClient()

def trace(name: Optional[str] = None, type: str = "agent", state_key: Optional[str] = None):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            span_name = name or func.__name__
            
            # Capture state before (if state_key provided in kwargs)
            state_before = None
            if state_key and state_key in kwargs:
                import copy
                try:
                    state_before = copy.deepcopy(kwargs[state_key])
                except:
                    state_before = str(kwargs[state_key])
            
            # Capture inputs
            input_data = {}
            if args: input_data["args"] = str(args)
            if kwargs: input_data["kwargs"] = {k:v for k,v in kwargs.items() if k != state_key}
            
            # Start span
            span_id = client.create_span(
                name=span_name, 
                type=type, 
                input=input_data,
                state_before=state_before
            )
            token = _current_span_id.set(span_id)
            
            try:
                result = func(*args, **kwargs)
                
                # Capture state after
                state_after = None
                if state_key and state_key in kwargs:
                    try:
                        state_after = copy.deepcopy(kwargs[state_key])
                    except:
                        state_after = str(kwargs[state_key])

                client.end_span(span_id, output={"result": str(result)}, state_after=state_after)
                return result
            except Exception as e:
                client.end_span(span_id, error=str(e))
                raise
            finally:
                _current_span_id.reset(token)
                
        return wrapper
    return decorator
