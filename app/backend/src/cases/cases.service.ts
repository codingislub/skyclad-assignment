import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { QueryCasesDto } from './dto/query-cases.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCaseDto: CreateCaseDto, userId: string, importId?: string) {
    // Check if case_id already exists
    const existing = await this.prisma.case.findUnique({
      where: { caseId: createCaseDto.caseId },
    });

    if (existing) {
      throw new ConflictException(`Case with ID ${createCaseDto.caseId} already exists`);
    }

    const caseData = await this.prisma.case.create({
      data: {
        ...createCaseDto,
        dob: new Date(createCaseDto.dob),
        createdById: userId,
        importId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create history entry
    await this.prisma.caseHistory.create({
      data: {
        caseId: caseData.id,
        action: 'CREATED',
        metadata: { source: importId ? 'import' : 'manual' },
      },
    });

    return caseData;
  }

  async createMany(cases: CreateCaseDto[], userId: string, importId?: string) {
    const results: {
      successful: any[];
      failed: { case: CreateCaseDto; error: string }[];
    } = {
      successful: [],
      failed: [],
    };

    for (const caseDto of cases) {
      try {
        const created = await this.create(caseDto, userId, importId);
        results.successful.push(created);
      } catch (error) {
        results.failed.push({
          case: caseDto,
          error: error.message,
        });
      }
    }

    return results;
  }

  async findAll(query: QueryCasesDto, operatorUserId?: string) {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      priority,
      startDate,
      endDate,
      createdById,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CaseWhereInput = {};

    // Operators can only see cases assigned to them
    if (operatorUserId) {
      where.createdById = operatorUserId;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    if (createdById) {
      where.createdById = createdById;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { caseId: { contains: search, mode: 'insensitive' } },
        { applicantName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [cases, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.case.count({ where }),
    ]);

    return {
      data: cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const caseData = await this.prisma.case.findUnique({
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
        import: {
          select: {
            id: true,
            filename: true,
            createdAt: true,
          },
        },
        history: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
      },
    });

    if (!caseData) {
      throw new NotFoundException(`Case with ID ${id} not found`);
    }

    return caseData;
  }

  async update(id: string, updateCaseDto: UpdateCaseDto, userId: string) {
    const existingCase = await this.findOne(id);

    const updatedCase = await this.prisma.case.update({
      where: { id },
      data: updateCaseDto,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create history entries for changed fields
    const changes = Object.keys(updateCaseDto) as (keyof UpdateCaseDto)[];
    for (const field of changes) {
      const oldVal = (existingCase as any)[field];
      const newVal = updateCaseDto[field];
      if (oldVal !== newVal) {
        await this.prisma.caseHistory.create({
          data: {
            caseId: id,
            action: 'UPDATED',
            field: String(field),
            oldValue: oldVal != null ? String(oldVal) : null,
            newValue: newVal != null ? String(newVal) : null,
          },
        });
      }
    }

    return updatedCase;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.case.delete({
      where: { id },
    });

    return { message: 'Case deleted successfully' };
  }

  async getStats(userId?: string) {
    const where: Prisma.CaseWhereInput = userId ? { createdById: userId } : {};

    const [total, byStatus, byCategory, byPriority] = await Promise.all([
      this.prisma.case.count({ where }),
      this.prisma.case.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.case.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      this.prisma.case.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
