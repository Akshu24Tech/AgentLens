# AgentLens

A self-hosted observability platform for AI agents. Instrument any Python agent framework, visualize execution traces as interactive DAGs, and inspect state transitions in real time.

![AgentLens Dashboard](https://img.shields.io/badge/stack-FastAPI%20%7C%20Next.js%2016%20%7C%20ReactFlow-6366f1?style=flat-square)
![Python](https://img.shields.io/badge/python-3.9%2B-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## What it does

- Captures traces and spans from any Python agent (CrewAI, LangGraph, Google ADK, custom)
- Streams updates to the dashboard in real time via WebSocket
- Renders agent execution as a directed acyclic graph (DAG)
- Shows `state_before` / `state_after` diffs for every step
- Supports tags, search, and per-project metrics

---

## Project Structure

```
AgentLens/
├── sdk/                  # Python instrumentation library
│   └── agentlens.py
├── server/               # FastAPI backend (port 8001)
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── database.py
├── ui/                   # Next.js 16 dashboard (port 3000)
│   └── src/
│       ├── app/
│       ├── components/
│       └── lib/
└── examples/
    ├── multi_agent_flow.py
    ├── test_agent.py
    └── test_websocket_stream.py
```

---

## Quick Start

### 1. Start the backend

```bash
cd server
pip install fastapi uvicorn sqlalchemy pydantic
python main.py
```

Server runs at `http://localhost:8001`.

### 2. Start the dashboard

```bash
cd ui
npm install
npm run dev
```

Dashboard runs at `http://localhost:3000`.

### 3. Run a demo trace

```bash
pip install requests
python examples/multi_agent_flow.py
```

Open the dashboard and watch the trace appear live.

---

## SDK Usage

### Decorator (simplest)

```python
from sdk.agentlens import trace, client

client.create_trace(name="My Run", project_id="my-project")

@trace(name="Search Tool", type="tool")
def search(query: str):
    return f"Results for {query}"

@trace(name="Research Agent", type="agent")
def agent(topic: str):
    return search(topic)

agent("AI observability")
client.flush()
```

### Context managers (full control)

```python
from sdk.agentlens import AgentLensClient

client = AgentLensClient(project_id="my-project")
trace_id = client.create_trace(name="Deep Research")

with client.create_span(name="Planner", type="agent") as planner:
    # nested spans automatically become children
    with client.create_span(name="Web Search", type="tool") as search:
        search.end_span(output={"results": ["Paper A", "Paper B"]})

    planner.end_span(output={"plan": "done"})

client.flush()
```

### State snapshots

Capture how a shared state object changes across steps:

```python
@trace(name="Writer Agent", type="agent", state_key="state")
def writer(topic: str, state: dict):
    state["draft"] = f"Article about {topic}"
    return state
```

The SDK automatically records `state_before` and `state_after` for the decorated function.

---

## SDK Reference

### `AgentLensClient`

| Method | Description |
|---|---|
| `create_trace(name, project_id, metadata, tags)` | Start a new trace session, returns `trace_id` |
| `create_span(name, type, parent_id, input, metadata, tags)` | Start a span, returns `SpanContext` |
| `end_span(span_id, trace_id, output, error, state_after)` | Close a span |
| `flush()` | Wait for all background ingestion threads to finish |

### `@trace` decorator

```python
@trace(
    name="optional display name",   # defaults to function name
    type="agent|tool|llm|chain",    # span type
    state_key="kwarg_name"          # kwarg to snapshot before/after
)
```

### Span types

| Type | Color in UI | Use for |
|---|---|---|
| `agent` | Blue | Autonomous reasoning steps |
| `tool` | Orange | External calls, search, APIs |
| `llm` | Purple | LLM inference calls |

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/ingest/trace` | POST | Ingest a new trace |
| `/ingest/span` | POST | Ingest or update a span |
| `/traces` | GET | List traces, filter by `project_id` |
| `/traces/{trace_id}` | GET | Full trace with all spans |
| `/projects` | GET | List all projects |
| `/projects/{name}` | GET | Project detail + metrics |
| `/search` | GET | Search by `q`, `tag`, `status`, `project_id` |
| `/tags` | GET | All unique tags across traces and spans |
| `/ws/{project_id}` | WebSocket | Real-time trace/span events |

---

## Dashboard Features

- **Project switcher** — switch between projects from the top nav
- **Live sidebar** — new traces appear instantly via WebSocket
- **DAG view** — click any trace to see its full execution graph
- **Node inspector** — click any node to inspect inputs, outputs, state diffs, tags, and timing
- **Search & filter** — filter traces by name, tag, or status
- **Metrics overview** — total traces, spans, avg latency, failure rate per project
- **Top agents & tools** — derived from real span data across recent traces

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8001` | Backend URL for the UI |

---

## Tech Stack

| Layer | Technology |
|---|---|
| SDK | Python, `requests`, `threading`, `contextvars` |
| Backend | FastAPI, SQLAlchemy, SQLite, Uvicorn |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4 |
| Graph | ReactFlow, Dagre |
| UI Components | Radix UI, Lucide Icons, Framer Motion |

---

## Examples

| File | Description |
|---|---|
| `examples/multi_agent_flow.py` | Multi-agent simulation with nested spans (Planner → Browser → Writer) |
| `examples/test_agent.py` | Simple decorator-based usage |
| `examples/test_websocket_stream.py` | Stress test with 10 parallel spans to verify real-time UI updates |
