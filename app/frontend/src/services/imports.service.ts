import api from '@/lib/axios';
import { ImportData, CreateCaseDto, ImportResult } from '@/types';

export interface UploadCSVResponse {
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  validData: CreateCaseDto[];
  errors: Array<{
    row: number;
    data: any;
    errors: Array<{
      field: string;
      message: string;
      value?: any;
    }>;
  }>;
}

export const importsService = {
  async uploadCSV(formData: FormData): Promise<UploadCSVResponse> {
    const response = await api.post<UploadCSVResponse>('/imports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async submitImport(data: { filename: string; cases: CreateCaseDto[] }): Promise<ImportResult> {
    const response = await api.post<ImportResult>('/imports/submit', data);
    return response.data;
  },

  async getImports(): Promise<ImportData[]> {
    const response = await api.get<ImportData[]>('/imports');
    return response.data;
  },

  async getImport(id: string): Promise<ImportData> {
    const response = await api.get<ImportData>(`/imports/${id}`);
    return response.data;
  },
};
