import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { CasesModule } from '../cases/cases.module';
import { ValidationService } from './validation.service';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    CasesModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  ],
  providers: [ImportsService, ValidationService],
  controllers: [ImportsController],
})
export class ImportsModule {}
