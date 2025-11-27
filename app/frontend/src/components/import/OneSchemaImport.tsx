import React, { useState } from 'react';
import OneSchemaImporter from '@oneschema/react';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';
import oneSchemaConfig from '../../config/oneschema.config';
import { importsService } from '../../services/imports.service';

interface OneSchemaImportProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const OneSchemaImport: React.FC<OneSchemaImportProps> = ({ onSuccess, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userJwt, setUserJwt] = useState<string | undefined>(undefined);

  const handleLaunch = async () => {
    if (!oneSchemaConfig.enabled || !oneSchemaConfig.clientId) {
      toast.error('OneSchema is not configured. Please check your .env file.');
      return;
    }

    try {
      const data = await importsService.getOneSchemaSession(oneSchemaConfig.templateKey);
      
      if (data?.userJwt) {
        setUserJwt(data.userJwt);
        setIsOpen(true);
      } else {
        toast.error(data?.error || 'Failed to get OneSchema session token');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Could not connect to server');
    }
  };

  const handleSuccess = async (data: any) => {
    setIsOpen(false);
    setIsSubmitting(true);

    try {
      const rows = data?.records || [];
      
      if (rows.length === 0) {
        toast.error('No data received from OneSchema');
        setIsSubmitting(false);
        return;
      }

      const transformedData = rows.map((row: any) => ({
        caseId: row.case_id,
        applicantName: row.applicant_name,
        dob: row.dob,
        email: row.email || undefined,
        phone: row.phone || undefined,
        category: row.category,
        priority: row.priority || 'LOW',
        notes: row.notes || undefined,
      }));

      const result = await importsService.submitImport({
        filename: data.sheet_metadata?.original_file_name || 'oneschema-import.csv',
        cases: transformedData,
      });
      
      const successCount = result.successful?.length || 0;
      const failedCount = result.failed?.length || 0;

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} cases!`);
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} cases failed to import`);
      }

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import cases');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleError = (error: any) => {
    toast.error('An error occurred during import');
    setIsOpen(false);
    
    if (onError) {
      onError(error);
    }
  };

  return (
    <div>
      <button
        onClick={handleLaunch}
        disabled={isSubmitting}
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <Upload className="mr-2 h-5 w-5" />
        {isSubmitting ? 'Importing...' : 'Import with OneSchema'}
      </button>

      {oneSchemaConfig.clientId && userJwt && (
        <OneSchemaImporter
          isOpen={isOpen}
          onRequestClose={handleCancel}
          clientId={oneSchemaConfig.clientId}
          userJwt={userJwt}
          templateKey={oneSchemaConfig.templateKey}
          importConfig={{ type: 'local' }}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onError={handleError}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1000,
          }}
          devMode={import.meta.env.DEV}
        />
      )}
    </div>
  );
};


export default OneSchemaImport;
