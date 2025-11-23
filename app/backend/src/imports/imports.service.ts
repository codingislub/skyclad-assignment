import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';
import { CasesService } from '../cases/cases.service';
import { ValidationService } from './validation.service';
import { CreateCaseDto } from '../cases/dto/create-case.dto';
import { ImportStatus } from '@prisma/client';

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly casesService: CasesService,
    private readonly validationService: ValidationService,
  ) {}

  async parseCSV(file: Express.Multer.File) {
    try {
      const content = file.buffer.toString('utf-8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records;
    } catch (error) {
      throw new BadRequestException('Failed to parse CSV file: ' + error.message);
    }
  }

  async validateAndTransform(records: any[]) {
    const validatedRecords = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +2 because row 1 is header
      const record = records[i];

      const validation = await this.validationService.validateRow(record, rowNumber);

      if (validation.isValid) {
        validatedRecords.push(validation.data);
      } else {
        errors.push({
          row: rowNumber,
          data: record,
          errors: validation.errors,
        });
      }
    }

    return {
      valid: validatedRecords,
      invalid: errors,
    };
  }

  async createImport(filename: string, totalRows: number, userId: string) {
    return this.prisma.import.create({
      data: {
        filename,
        totalRows,
        createdById: userId,
        status: ImportStatus.PROCESSING,
      },
    });
  }

  async processBatch(
    cases: CreateCaseDto[],
    userId: string,
    importId: string,
    batchSize: number = 100,
  ) {
    const results: {
      successful: any[];
      failed: any[];
      totalProcessed: number;
    } = {
      successful: [],
      failed: [],
      totalProcessed: 0,
    };

    // Process in chunks
    for (let i = 0; i < cases.length; i += batchSize) {
      const batch = cases.slice(i, i + batchSize);

      const batchResult = await this.casesService.createMany(batch, userId, importId);

      results.successful.push(...batchResult.successful);
      results.failed.push(...batchResult.failed);
      results.totalProcessed += batch.length;
    }

    // Update import status
    const status =
      results.failed.length === 0
        ? ImportStatus.COMPLETED
        : results.successful.length === 0
          ? ImportStatus.FAILED
          : ImportStatus.PARTIAL;

    await this.prisma.import.update({
      where: { id: importId },
      data: {
        status,
        successCount: results.successful.length,
        failureCount: results.failed.length,
        errorDetails: results.failed.length > 0 ? { errors: results.failed } : undefined,
      },
    });

    return results;
  }

  async findAll(userId?: string) {
    const where = userId ? { createdById: userId } : {};

    const imports = await this.prisma.import.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            cases: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return imports;
  }

  async findOne(id: string) {
    const importRecord = await this.prisma.import.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        cases: {
          take: 100,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return importRecord;
  }
}
