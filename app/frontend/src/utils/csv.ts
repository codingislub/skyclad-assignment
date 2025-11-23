import Papa from 'papaparse';
import { CSVRow, ParsedCSV } from '@/types';

export const parseCSVFile = (file: File): Promise<ParsedCSV> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        resolve({
          data: results.data as CSVRow[],
          errors: results.errors,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadErrorCSV = (errors: any[], filename: string) => {
  const formattedErrors = errors.map((error) => ({
    row: error.row,
    ...error.data,
    errors: error.errors.map((e: any) => `${e.field}: ${e.message}`).join('; '),
  }));

  exportToCSV(formattedErrors, filename);
};
