import { PartialType } from '@nestjs/mapped-types';
import { CreateCaseDto } from './create-case.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { CaseStatus } from '@prisma/client';

export class UpdateCaseDto extends PartialType(CreateCaseDto) {
  @IsEnum(CaseStatus)
  @IsOptional()
  status?: CaseStatus;
}
