import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { registerDTO } from './dto/register.dto';
import { loginDTO } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './schemas/refresh-token.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModule: Model<User>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModule: Model<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async register(dataLogedRegister: registerDTO) {
    const { email, password, name } = dataLogedRegister;
    const emailInUse = await this.UserModule.findOne({
      email: email,
    });
    if (emailInUse) {
      throw new ConflictException('Email ya ha sido registrado');
    }
    const hashedPass = await bcrypt.hash(password, 10);

    await this.UserModule.create({
      name,
      email,
      password: hashedPass,
    });
  }

  async login(dataLogedRegister: loginDTO) {
    const { email, password } = dataLogedRegister;

    const user = await this.UserModule.findOne({
      email,
    });

    if (!user) {
      throw new UnauthorizedException('Email no registrado');
    }
    const passwordMatched = await bcrypt.compare(password, user.password);

    if (!passwordMatched) {
      throw new UnauthorizedException('Contrasña incorrecta');
    }

    return this.generateUserToken(user._id);
  }

  async generateUserToken(userId) {
    const accessToken = this.jwtService.sign({ userId });
    const refreshToken = uuidv4();

    await this.storeRefreshTokem(refreshToken, userId);

    return { accessToken, refreshToken };
  }

  async storeRefreshTokem(token: string, userId) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.RefreshTokenModule.create({
      token,
      userId,
      expiryDate,
    });
  }
}
