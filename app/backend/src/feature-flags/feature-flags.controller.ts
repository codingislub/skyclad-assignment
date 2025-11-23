import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureFlagsService } from './feature-flags.service';

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getFlags(@Req() req: any) {
    return this.featureFlagsService.getAllFlags({
      userId: req.user.sub,
      userRole: req.user.role,
    });
  }
}
