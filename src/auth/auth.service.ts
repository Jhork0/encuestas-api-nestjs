import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './schemas/refresh-token.schema';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from './interface/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModule: Model<User>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModule: Model<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async register(dataLogedRegister: RegisterDTO) {
    const { email, password, name } = dataLogedRegister;
    const emailInUse = await this.UserModule.findOne({
      email: email,
    });
    if (emailInUse) {
      throw new ConflictException('Email ya ha sido registrado');
    }
    const hashedPass = await bcrypt.hash(password, 10);

    const userCreated = await this.UserModule.create({
      name,
      email,
      password: hashedPass,
    });
    return userCreated;
  }

  async login(dataLogedRegister: LoginDTO) {
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
  // Esta funcion es para cuando un usuario se logee con un JWT entonces este JWT se renueve
  async refreshTokensFuntion(refreshToken: string) {
    const token = await this.RefreshTokenModule.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('No se puede refrescar el JWT');
    }
    return this.generateUserToken(token.userId);
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

    await this.RefreshTokenModule.updateOne(
      {
        userId,
      },
      {
        $set: { expiryDate, token },
      },
      {
        upsert: true,
      },
    );
  }

  async getProfileWithToken(token: string) {
    try {
      // 1. Verificar y decodificar el JWT
      const decoded = this.jwtService.verify<JwtPayload>(token);
      const userId = decoded.userId;

      if (!userId) {
        throw new UnauthorizedException('Token inválido: sin userId');
      }

      const userProfile =
        await this.UserModule.findById(userId).select('-password');
      if (!userProfile) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return userProfile;
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException('Token inválido o expirado');
      }
      throw error;
    }
  }
}
