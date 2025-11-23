export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
}

export enum CaseCategory {
  TAX = 'TAX',
  LICENSE = 'LICENSE',
  PERMIT = 'PERMIT',
}

export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum CaseStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum ImportStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Case {
  id: string;
  caseId: string;
  applicantName: string;
  dob: string;
  email?: string;
  phone?: string;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  notes?: string;
  createdBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  import?: {
    id: string;
    filename: string;
    createdAt: string;
  };
  history?: CaseHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseHistoryItem {
  id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: any;
  createdAt: string;
}

export interface CreateCaseDto {
  caseId: string;
  applicantName: string;
  dob: string;
  email?: string;
  phone?: string;
  category: CaseCategory;
  priority?: CasePriority;
  notes?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface CaseValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

export interface CSVRow {
  case_id: string;
  applicant_name: string;
  dob: string;
  email?: string;
  phone?: string;
  category: string;
  priority?: string;
  [key: string]: any;
}

export interface ParsedCSV {
  data: CSVRow[];
  errors: any[];
}

export interface ImportData {
  id: string;
  filename: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  status: ImportStatus;
  errorDetails?: any;
  createdBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CaseQueryParams {
  page?: number;
  limit?: number;
  status?: CaseStatus;
  category?: CaseCategory;
  priority?: CasePriority;
  startDate?: string;
  endDate?: string;
  createdById?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ImportResult {
  importId: string;
  successful: Case[];
  failed: Array<{
    case: CreateCaseDto;
    error: string;
  }>;
  totalProcessed: number;
}

export interface CaseStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}
