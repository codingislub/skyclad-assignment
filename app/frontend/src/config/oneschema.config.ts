/**
 * OneSchema Configuration
 * 
 * This file defines the schema template for CSV imports.
 * It maps CSV columns to your case data structure.
 */

export const oneSchemaConfig = {
  clientId: import.meta.env.VITE_ONESCHEMA_CLIENT_ID || '',
  templateKey: import.meta.env.VITE_ONESCHEMA_TEMPLATE_KEY || '',
  enabled: import.meta.env.VITE_ONESCHEMA_ENABLED === 'true',
};

/**
 * OneSchema Template Schema
 * This should match your template configuration in OneSchema dashboard
 */
export const caseImportTemplate = {
  columns: [
    {
      key: 'caseId',
      label: 'Case ID',
      description: 'Unique identifier for the case',
      validation_rules: [
        {
          rule_type: 'required',
        },
        {
          rule_type: 'unique',
        },
      ],
    },
    {
      key: 'applicantName',
      label: 'Applicant Name',
      description: 'Full name of the applicant',
      validation_rules: [
        {
          rule_type: 'required',
        },
      ],
    },
    {
      key: 'dob',
      label: 'Date of Birth',
      description: 'Date of birth in YYYY-MM-DD format',
      validation_rules: [
        {
          rule_type: 'required',
        },
        {
          rule_type: 'regex',
          regex: '^\\d{4}-\\d{2}-\\d{2}$',
          error_message: 'Must be in YYYY-MM-DD format',
        },
      ],
    },
    {
      key: 'email',
      label: 'Email',
      description: 'Email address of the applicant',
      validation_rules: [
        {
          rule_type: 'regex',
          regex: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          error_message: 'Must be a valid email address',
        },
      ],
    },
    {
      key: 'phone',
      label: 'Phone',
      description: 'Phone number in E.164 format (e.g., +14155552671)',
      validation_rules: [
        {
          rule_type: 'regex',
          regex: '^\\+?[1-9]\\d{1,14}$',
          error_message: 'Must be in E.164 format',
        },
      ],
    },
    {
      key: 'category',
      label: 'Category',
      description: 'Case category (TAX, LICENSE, or PERMIT)',
      validation_rules: [
        {
          rule_type: 'required',
        },
        {
          rule_type: 'select_options',
          options: ['TAX', 'LICENSE', 'PERMIT'],
        },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      description: 'Priority level (LOW, MEDIUM, or HIGH)',
      validation_rules: [
        {
          rule_type: 'select_options',
          options: ['LOW', 'MEDIUM', 'HIGH'],
        },
      ],
    },
    {
      key: 'notes',
      label: 'Notes',
      description: 'Additional notes or comments',
      validation_rules: [],
    },
  ],
};

export default oneSchemaConfig;
