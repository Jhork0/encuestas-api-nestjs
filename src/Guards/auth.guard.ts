import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { AuthenticatedRequest } from '../auth/interface/authenticated-request.interface';
import { JwtPayload } from '../auth/interface/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    this.logger.log('🛡️ AuthGuard ejecutándose...');

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    this.logger.log(`Token extraído: ${token ? 'Sí' : 'No'}`);

    if (!token) {
      this.logger.warn('❌ No se encontró token');
      throw new UnauthorizedException('Token inválido');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      request.userId = payload.userId;
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException('Token inválido' + error.message);
      }
      throw new UnauthorizedException('Token inválido');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    this.logger.log(`Authorization header: ${authHeader}`);
    return authHeader?.split(' ')[1];
  }
}
