import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class registerDTO {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[0-9])/, {
    message: 'La contraseña debe tener al menos un número.',
  })
  password: string;
}
