import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { CreateCaseDto, ValidationError, CaseCategory, CasePriority } from '@/types';

export const validateCase = (caseData: Partial<CreateCaseDto>): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Case ID validation
  if (!caseData.caseId || caseData.caseId.trim() === '') {
    errors.push({
      field: 'caseId',
      message: 'Case ID is required',
    });
  }

  // Applicant name validation
  if (!caseData.applicantName || caseData.applicantName.trim() === '') {
    errors.push({
      field: 'applicantName',
      message: 'Applicant name is required',
    });
  }

  // DOB validation
  if (!caseData.dob) {
    errors.push({
      field: 'dob',
      message: 'Date of birth is required',
    });
  } else {
    const dobDate = new Date(caseData.dob);
    const minDate = new Date('1900-01-01');
    const today = new Date();

    if (isNaN(dobDate.getTime())) {
      errors.push({
        field: 'dob',
        message: 'Invalid date format',
        value: caseData.dob,
      });
    } else if (dobDate < minDate) {
      errors.push({
        field: 'dob',
        message: 'Date of birth cannot be before 1900',
        value: caseData.dob,
      });
    } else if (dobDate > today) {
      errors.push({
        field: 'dob',
        message: 'Date of birth cannot be in the future',
        value: caseData.dob,
      });
    }
  }

  // Email validation (optional but must be valid if provided)
  if (caseData.email && caseData.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(caseData.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        value: caseData.email,
      });
    }
  }

  // Phone validation (optional but must be valid if provided)
  if (caseData.phone && caseData.phone.trim() !== '') {
    try {
      if (!isValidPhoneNumber(caseData.phone)) {
        errors.push({
          field: 'phone',
          message: 'Phone must be in E.164 format (e.g., +14155552671)',
          value: caseData.phone,
        });
      }
    } catch (error) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format',
        value: caseData.phone,
      });
    }
  }

  // Category validation
  if (!caseData.category) {
    errors.push({
      field: 'category',
      message: 'Category is required',
    });
  } else if (!Object.values(CaseCategory).includes(caseData.category as CaseCategory)) {
    errors.push({
      field: 'category',
      message: 'Category must be TAX, LICENSE, or PERMIT',
      value: caseData.category,
    });
  }

  // Priority validation (optional but must be valid if provided)
  if (caseData.priority && !Object.values(CasePriority).includes(caseData.priority as CasePriority)) {
    errors.push({
      field: 'priority',
      message: 'Priority must be LOW, MEDIUM, or HIGH',
      value: caseData.priority,
    });
  }

  return errors;
};

export const normalizeApplicantName = (name: string): string => {
  if (!name) return name;
  
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const normalizeEmail = (email: string): string | undefined => {
  if (!email) return undefined;
  return email.trim().toLowerCase();
};

export const normalizePhone = (phone: string): string | undefined => {
  if (!phone) return undefined;

  try {
    const parsed = parsePhoneNumber(phone);
    if (parsed) {
      return parsed.format('E.164');
    }
  } catch (error) {
    // If parsing fails, try basic normalization
    let normalized = phone.replace(/[^\d+]/g, '');

    if (/^\d/.test(normalized)) {
      if (normalized.length === 10) {
        normalized = '+1' + normalized;
      } else if (normalized.length === 11 && normalized.startsWith('1')) {
        normalized = '+' + normalized;
      } else if (normalized.length === 12 && normalized.startsWith('91')) {
        normalized = '+' + normalized;
      }
    }

    return normalized;
  }

  return phone;
};

export const getAutoFixSuggestions = (caseData: Partial<CreateCaseDto>) => {
  const suggestions: Array<{
    field: string;
    original: any;
    suggested: any;
    type: string;
  }> = [];

  if (caseData.applicantName) {
    const normalized = normalizeApplicantName(caseData.applicantName);
    if (normalized !== caseData.applicantName) {
      suggestions.push({
        field: 'applicantName',
        original: caseData.applicantName,
        suggested: normalized,
        type: 'normalize_name',
      });
    }
  }

  if (caseData.email) {
    const normalized = normalizeEmail(caseData.email);
    if (normalized !== caseData.email) {
      suggestions.push({
        field: 'email',
        original: caseData.email,
        suggested: normalized,
        type: 'normalize_email',
      });
    }
  }

  if (caseData.phone) {
    const normalized = normalizePhone(caseData.phone);
    if (normalized !== caseData.phone) {
      suggestions.push({
        field: 'phone',
        original: caseData.phone,
        suggested: normalized,
        type: 'normalize_phone',
      });
    }
  }

  return suggestions;
};
