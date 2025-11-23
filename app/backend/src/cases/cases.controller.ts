import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { QueryCasesDto } from './dto/query-cases.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  create(@Body() createCaseDto: CreateCaseDto, @Req() req: any) {
    return this.casesService.create(createCaseDto, req.user.sub);
  }

  @Get()
  findAll(@Query() query: QueryCasesDto, @Req() req: any) {
    const userId = req.user.role === UserRole.OPERATOR ? req.user.sub : undefined;
    return this.casesService.findAll(query, userId);
  }

  @Get('stats')
  getStats(@Req() req: any) {
    const userId = req.user.role === UserRole.OPERATOR ? req.user.sub : undefined;
    return this.casesService.getStats(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateCaseDto: UpdateCaseDto, @Req() req: any) {
    return this.casesService.update(id, updateCaseDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.casesService.remove(id);
  }
}
