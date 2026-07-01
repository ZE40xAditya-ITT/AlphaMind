import api from './api';

export interface ResearchCandidate {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  score: number;
  recommendation: string;
  confidence: string;
  key_strengths: string[];
  pe?: number;
  roe?: number;
  debt_equity?: number;
}

export interface ResearchReport {
  id: number;
  query: string;
  status: string;
  candidates: ResearchCandidate[];
  generated_report: string;
  created_at: string;
}

export interface PipelineStage {
  stage: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  message: string;
  report_id?: number;
  candidates?: ResearchCandidate[];
}

export const startResearch = (query: string) =>
  api.post<{ report_id: number; query: string; status: string }>('/research/run', { query }).then(r => r.data);

export const getResearchReport = (id: number) =>
  api.get<ResearchReport>(`/research/${id}`).then(r => r.data);

export const getResearchHistory = () =>
  api.get('/research/history').then(r => r.data);

export const createSSEConnection = (reportId: number, token: string): EventSource => {
  const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
  return new EventSource(`${baseUrl}/research/${reportId}/stream?token=${token}`);
};
