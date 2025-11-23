import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationService],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizeApplicantName', () => {
    it('should normalize names with multiple spaces', () => {
      const result = service.normalizeApplicantName('John  DOE');
      expect(result).toBe('John Doe');
    });

    it('should capitalize names correctly', () => {
      const result = service.normalizeApplicantName('maria-santos');
      expect(result).toBe('Maria-Santos');
    });

    it('should trim whitespace', () => {
      const result = service.normalizeApplicantName('  Alice Smith  ');
      expect(result).toBe('Alice Smith');
    });
  });

  describe('normalizeEmail', () => {
    it('should lowercase and trim email', () => {
      const result = service.normalizeEmail('  TEST@EXAMPLE.COM  ');
      expect(result).toBe('test@example.com');
    });

    it('should return undefined for empty email', () => {
      const result = service.normalizeEmail('');
      expect(result).toBeUndefined();
    });
  });

  describe('normalizePhone', () => {
    it('should normalize US 10-digit phone', () => {
      const result = service.normalizePhone('9876543210');
      expect(result).toBe('+19876543210');
    });

    it('should normalize Indian phone', () => {
      const result = service.normalizePhone('919876543210');
      expect(result).toBe('+919876543210');
    });

    it('should keep valid E.164 format', () => {
      const result = service.normalizePhone('+14155552671');
      expect(result).toBe('+14155552671');
    });

    it('should remove formatting characters', () => {
      const result = service.normalizePhone('(415) 555-2671');
      expect(result).toMatch(/^\+?\d+$/);
    });
  });

  describe('validateDateOfBirth', () => {
    it('should accept valid date', () => {
      const result = service.validateDateOfBirth('1990-01-01');
      expect(result.isValid).toBe(true);
    });

    it('should reject dates before 1900', () => {
      const result = service.validateDateOfBirth('1899-12-31');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('1900');
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = service.validateDateOfBirth(futureDate.toISOString());
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('future');
    });

    it('should reject invalid date format', () => {
      const result = service.validateDateOfBirth('not-a-date');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });
});
