import { Body, Controller, Post } from '@nestjs/common';
import { registerDTO } from './dto/register.dto';
import { AuthService } from './auth.service';
import { loginDTO } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dataLoged: registerDTO) {
    return this.authService.register(dataLoged);
  }

  @Post('login')
  async login(@Body() credencial: loginDTO) {
    return this.authService.login(credencial);
  }
}
