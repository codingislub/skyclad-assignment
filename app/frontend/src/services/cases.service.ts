import api from '@/lib/axios';
import {
  Case,
  CreateCaseDto,
  CaseQueryParams,
  PaginationResponse,
  CaseStats,
} from '@/types';

export const casesService = {
  async getCases(params?: CaseQueryParams): Promise<PaginationResponse<Case>> {
    const response = await api.get<PaginationResponse<Case>>('/cases', { params });
    return response.data;
  },

  async getCase(id: string): Promise<Case> {
    const response = await api.get<Case>(`/cases/${id}`);
    return response.data;
  },

  async createCase(data: CreateCaseDto): Promise<Case> {
    const response = await api.post<Case>('/cases', data);
    return response.data;
  },

  async updateCase(id: string, data: Partial<CreateCaseDto>): Promise<Case> {
    const response = await api.patch<Case>(`/cases/${id}`, data);
    return response.data;
  },

  async deleteCase(id: string): Promise<void> {
    await api.delete(`/cases/${id}`);
  },

  async getStats(): Promise<CaseStats> {
    const response = await api.get<CaseStats>('/cases/stats');
    return response.data;
  },
};
