import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CreateCaseDto } from '../cases/dto/create-case.dto';
import { UserRole } from '@prisma/client';

@Controller('imports')
@UseGuards(JwtAuthGuard)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCSV(@UploadedFile() file: Express.Multer.File, @Req() _req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are allowed');
    }

    const records = await this.importsService.parseCSV(file);
    const validation = await this.importsService.validateAndTransform(records);

    return {
      filename: file.originalname,
      totalRows: records.length,
      validRows: validation.valid.length,
      invalidRows: validation.invalid.length,
      validData: validation.valid,
      errors: validation.invalid,
    };
  }

  @Post('submit')
  async submitImport(@Body() body: { filename: string; cases: CreateCaseDto[] }, @Req() req: any) {
    const userId = req.user.sub;

    // Create import record
    const importRecord = await this.importsService.createImport(
      body.filename,
      body.cases.length,
      userId,
    );

    // Process cases in batches
    const results = await this.importsService.processBatch(
      body.cases,
      userId,
      importRecord.id,
      100,
    );

    return {
      importId: importRecord.id,
      ...results,
    };
  }

  @Public()
  @Post('oneschema/session')
  async createOneSchemaSession(@Body() body: { templateKey?: string; userEmail?: string }) {
    const templateKey = body?.templateKey || 'cases';
    return this.importsService.createOneSchemaSession(templateKey, body?.userEmail);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = req.user.role === UserRole.OPERATOR ? req.user.sub : undefined;
    return this.importsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importsService.findOne(id);
  }
}
