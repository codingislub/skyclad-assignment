import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCaseDto } from '../cases/dto/create-case.dto';

@Injectable()
export class ValidationService {
  async validateRow(record: any, rowNumber: number) {
    const errors = [];

    // Transform and normalize data
    const transformedData: any = {
      caseId: record.case_id?.trim(),
      applicantName: this.normalizeApplicantName(record.applicant_name),
      dob: record.dob,
      email: this.normalizeEmail(record.email),
      phone: this.normalizePhone(record.phone),
      category: record.category?.toUpperCase(),
      priority: record.priority?.toUpperCase() || 'LOW',
    };

    // Validate using class-validator
    const dto = plainToClass(CreateCaseDto, transformedData);
    const validationErrors = await validate(dto);

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => {
        const constraints = error.constraints || {};
        Object.values(constraints).forEach((message) => {
          errors.push({
            field: error.property,
            message,
            value: error.value,
          });
        });
      });
    }

    // Additional custom validations
    if (transformedData.dob) {
      const dobValidation = this.validateDateOfBirth(transformedData.dob);
      if (!dobValidation.isValid) {
        errors.push({
          field: 'dob',
          message: dobValidation.error,
          value: transformedData.dob,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      data: dto,
      errors,
    };
  }

  normalizeApplicantName(name: string): string {
    if (!name) return name;

    return name
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  normalizeEmail(email: string): string | undefined {
    if (!email) return undefined;
    return email.trim().toLowerCase();
  }

  normalizePhone(phone: string): string | undefined {
    if (!phone) return undefined;

    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '');

    // If it starts with a digit, try to add country code
    if (/^\d/.test(normalized)) {
      // Common patterns
      if (normalized.length === 10) {
        // Assume US number
        normalized = '+1' + normalized;
      } else if (normalized.length === 11 && normalized.startsWith('1')) {
        normalized = '+' + normalized;
      } else if (normalized.length === 12 && normalized.startsWith('91')) {
        // India
        normalized = '+' + normalized;
      }
    }

    return normalized;
  }

  validateDateOfBirth(dob: string): { isValid: boolean; error?: string } {
    try {
      const date = new Date(dob);
      const minDate = new Date('1900-01-01');
      const today = new Date();

      if (isNaN(date.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
      }

      if (date < minDate) {
        return { isValid: false, error: 'Date of birth cannot be before 1900' };
      }

      if (date > today) {
        return { isValid: false, error: 'Date of birth cannot be in the future' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid date format' };
    }
  }

  getAutoFixSuggestions(record: any) {
    const suggestions = [];

    if (record.applicant_name) {
      const normalized = this.normalizeApplicantName(record.applicant_name);
      if (normalized !== record.applicant_name) {
        suggestions.push({
          field: 'applicant_name',
          original: record.applicant_name,
          suggested: normalized,
          type: 'normalize_name',
        });
      }
    }

    if (record.email) {
      const normalized = this.normalizeEmail(record.email);
      if (normalized !== record.email) {
        suggestions.push({
          field: 'email',
          original: record.email,
          suggested: normalized,
          type: 'normalize_email',
        });
      }
    }

    if (record.phone) {
      const normalized = this.normalizePhone(record.phone);
      if (normalized !== record.phone) {
        suggestions.push({
          field: 'phone',
          original: record.phone,
          suggested: normalized,
          type: 'normalize_phone',
        });
      }
    }

    return suggestions;
  }
}
