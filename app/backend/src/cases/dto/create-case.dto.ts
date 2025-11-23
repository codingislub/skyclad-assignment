import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';
import { CaseCategory, CasePriority } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  caseId: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  applicantName: string;

  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be in E.164 format (e.g., +14155552671)',
  })
  phone?: string;

  @IsEnum(CaseCategory)
  @IsNotEmpty()
  category: CaseCategory;

  @IsEnum(CasePriority)
  @IsOptional()
  priority?: CasePriority;

  @IsString()
  @IsOptional()
  notes?: string;
}
