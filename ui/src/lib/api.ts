import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface Span {
  span_id: str;
  trace_id: str;
  parent_id?: str;
  name: str;
  start_time: string;
  end_time?: string;
  status: str;
  state_before?: any;
  state_after?: any;
  metadata: Record<string, any>;
}

export interface Trace {
  trace_id: str;
  name: str;
  project_id: str;
  start_time: string;
  metadata: Record<string, any>;
}

export const getTraces = async (): Promise<Trace[]> => {
  const response = await api.get('/traces');
  return response.data;
};

export const getTraceDetail = async (traceId: string): Promise<{ trace: Trace; spans: Span[] }> => {
  const response = await api.get(`/traces/${traceId}`);
  return response.data;
};
