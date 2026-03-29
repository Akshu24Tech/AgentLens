import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';
const WS_BASE_URL = 'ws://localhost:8001';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getWebSocket = (project_id: string) => {
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
  state_before?: any;
  state_after?: any;
  input?: any;
  output?: any;
  metadata: Record<string, any>;
  tags?: string[];
}

export interface Trace {
  trace_id: string;
  name: string;
  project_id: string;
  start_time: string;
  metadata: Record<string, any>;
  tags?: string[];
}

export const getTraces = async (projectId?: string): Promise<Trace[]> => {
  const response = await api.get('/traces', { params: { project_id: projectId } });
  return response.data;
};

export const getTraceDetail = async (traceId: string): Promise<{ trace: Trace; spans: Span[] }> => {
  const response = await api.get(`/traces/${traceId}`);
  return response.data;
};

export const searchTraces = async (params: { q?: string; project_id?: string; tag?: string; status?: string }): Promise<Trace[]> => {
  const response = await api.get('/search', { params });
  return response.data;
};

export const getTags = async (): Promise<string[]> => {
  const response = await api.get('/tags');
  return response.data;
};
