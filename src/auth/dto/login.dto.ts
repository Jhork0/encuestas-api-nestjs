import { IsEmail, IsString } from 'class-validator';

export class loginDTO {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
