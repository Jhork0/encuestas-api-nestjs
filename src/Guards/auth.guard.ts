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

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    this.logger.log('🛡️ AuthGuard ejecutándose...'); // Debug log
    
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    this.logger.log(`Token extraído: ${token ? 'Sí' : 'No'}`); // Debug log
    
    if (!token) {
      this.logger.warn('❌ No se encontró token');
      throw new UnauthorizedException('Token inválido');
    }

    try {
      this.logger.log('🔍 Verificando token...');
      const payload = this.jwtService.verify(token);
      this.logger.log(`✅ Token válido, userId: ${payload.userId}`);
      request.userId = payload.userId;
    } catch (error) {
      this.logger.error('❌ Error verificando token:', error.message);
      throw new UnauthorizedException('Token inválido');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    this.logger.log(`Authorization header: ${authHeader}`); // Debug log
    return authHeader?.split(' ')[1];
  }
}