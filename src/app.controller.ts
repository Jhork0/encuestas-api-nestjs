import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './Guards/auth.guard';
import { AuthenticatedRequest } from './auth/interface/authenticated-request.interface';

@UseGuards(AuthGuard)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  protectedRoute(@Req() req: AuthenticatedRequest) {
    return { mensaje: 'Accessed Recourse', userId: req.userId };
  }
}
