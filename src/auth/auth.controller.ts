import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDTO } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { RefreshTokenDTO } from './dto/resfhes-tokens.dto.ts';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dataLoged: RegisterDTO) {
    return this.authService.register(dataLoged);
  }

  @Post('login')
  async login(@Body() credencial: LoginDTO) {
    return this.authService.login(credencial);
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDTO: RefreshTokenDTO) {
    return this.authService.refreshTokensFuntion(refreshTokenDTO.refreshToken);
  }
}
