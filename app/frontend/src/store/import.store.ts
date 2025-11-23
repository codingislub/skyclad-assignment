import { create } from 'zustand';
import { CreateCaseDto, ValidationError } from '@/types';

export interface ImportRow extends CreateCaseDto {
  _rowIndex: number;
  _isValid: boolean;
  _errors: ValidationError[];
  _isDirty: boolean;
}

interface ImportState {
  filename: string;
  rows: ImportRow[];
  selectedRows: Set<number>;
  isProcessing: boolean;
  columnMapping: Record<string, string>;
  
  setFilename: (filename: string) => void;
  setRows: (rows: ImportRow[]) => void;
  updateRow: (rowIndex: number, data: Partial<ImportRow>) => void;
  updateCell: (rowIndex: number, field: keyof CreateCaseDto, value: any) => void;
  deleteRow: (rowIndex: number) => void;
  toggleRowSelection: (rowIndex: number) => void;
  selectAllRows: (select: boolean) => void;
  setColumnMapping: (mapping: Record<string, string>) => void;
  applyBulkEdit: (field: keyof CreateCaseDto, value: any, rowIndices?: number[]) => void;
  applyAutoFix: (type: 'trim' | 'title-case' | 'normalize-phone' | 'normalize-email') => void;
  clearImport: () => void;
  removeInvalidRows: () => void;
  getValidRows: () => ImportRow[];
  getInvalidRows: () => ImportRow[];
  getSelectedRows: () => ImportRow[];
}

export const useImportStore = create<ImportState>((set, get) => ({
  filename: '',
  rows: [],
  selectedRows: new Set(),
  isProcessing: false,
  columnMapping: {},

  setFilename: (filename) => set({ filename }),

  setRows: (rows) => set({ rows, selectedRows: new Set() }),

  updateRow: (rowIndex, data) =>
    set((state) => ({
      rows: state.rows.map((row, idx) =>
        idx === rowIndex ? { ...row, ...data, _isDirty: true } : row
      ),
    })),

  updateCell: (rowIndex, field, value) =>
    set((state) => ({
      rows: state.rows.map((row, idx) => {
        if (idx === rowIndex) {
          const updated = { ...row, [field]: value, _isDirty: true };
          // Re-validate the row would happen here
          return updated;
        }
        return row;
      }),
    })),

  deleteRow: (rowIndex) =>
    set((state) => {
      const newSelectedRows = new Set(state.selectedRows);
      newSelectedRows.delete(rowIndex);
      return {
        rows: state.rows.filter((_, idx) => idx !== rowIndex),
        selectedRows: newSelectedRows,
      };
    }),

  toggleRowSelection: (rowIndex) =>
    set((state) => {
      const newSelectedRows = new Set(state.selectedRows);
      if (newSelectedRows.has(rowIndex)) {
        newSelectedRows.delete(rowIndex);
      } else {
        newSelectedRows.add(rowIndex);
      }
      return { selectedRows: newSelectedRows };
    }),

  selectAllRows: (select) =>
    set((state) => ({
      selectedRows: select ? new Set(state.rows.map((_, idx) => idx)) : new Set(),
    })),

  setColumnMapping: (mapping) => set({ columnMapping: mapping }),

  applyBulkEdit: (field, value, rowIndices) =>
    set((state) => {
      const indices = rowIndices || Array.from(state.selectedRows);
      return {
        rows: state.rows.map((row, idx) =>
          indices.includes(idx) ? { ...row, [field]: value, _isDirty: true } : row
        ),
      };
    }),

  applyAutoFix: (type) =>
    set((state) => {
      const rows = state.rows.map((row) => {
        const updated = { ...row, _isDirty: true };
        
        switch (type) {
          case 'trim':
            if (updated.applicantName) {
              updated.applicantName = updated.applicantName.trim().replace(/\s+/g, ' ');
            }
            break;
          case 'title-case':
            if (updated.applicantName) {
              updated.applicantName = updated.applicantName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            }
            break;
          case 'normalize-phone':
            if (updated.phone) {
              updated.phone = updated.phone.replace(/[^\d+]/g, '');
            }
            break;
          case 'normalize-email':
            if (updated.email) {
              updated.email = updated.email.trim().toLowerCase();
            }
            break;
        }
        
        return updated;
      });
      
      return { rows };
    }),

  clearImport: () =>
    set({
      filename: '',
      rows: [],
      selectedRows: new Set(),
      columnMapping: {},
    }),

  removeInvalidRows: () =>
    set((state) => ({
      rows: state.rows.filter((row) => row._isValid),
      selectedRows: new Set(),
    })),

  getValidRows: () => get().rows.filter((row) => row._isValid),

  getInvalidRows: () => get().rows.filter((row) => !row._isValid),

  getSelectedRows: () => {
    const { rows, selectedRows } = get();
    return rows.filter((_, idx) => selectedRows.has(idx));
  },
}));
