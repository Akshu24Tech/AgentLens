import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[AgentLens API]', err.message);
    return Promise.reject(err);
  }
);

export const getWebSocket = (project_id: string): WebSocket => {
  return new WebSocket(`${WS_BASE_URL}/ws/${project_id}`);
};

export interface Span {
  span_id: string;
  trace_id: string;
  parent_id?: string;
  name: string;
  type: string;
  start_time: string;
  end_time?: string;
  status: string;
  state_before?: Record<string, unknown>;
  state_after?: Record<string, unknown>;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  tags?: string[];
  error?: string;
}

export interface Trace {
  trace_id: string;
  name: string;
  project_id: string;
  start_time: string;
  metadata: Record<string, unknown>;
  tags?: string[];
}

export interface ProjectMetrics {
  total_traces: number;
  total_spans: number;
  avg_duration: number;
  failure_rate: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects');
  return response.data;
};

export const getProjectDetails = async (name: string): Promise<{ project: Project; metrics: ProjectMetrics }> => {
  const response = await api.get(`/projects/${name}`);
  return response.data;
};

export const getTraces = async (projectId?: string): Promise<Trace[]> => {
  const response = await api.get('/traces', { params: { project_id: projectId } });
  return response.data;
};

export const getTraceDetail = async (traceId: string): Promise<{ trace: Trace; spans: Span[] }> => {
  const response = await api.get(`/traces/${traceId}`);
  return response.data;
};

export const searchTraces = async (params: {
  q?: string;
  project_id?: string;
  tag?: string;
  status?: string;
}): Promise<Trace[]> => {
  const response = await api.get('/search', { params });
  return response.data;
};

export const getTags = async (): Promise<string[]> => {
  const response = await api.get('/tags');
  return response.data;
};
