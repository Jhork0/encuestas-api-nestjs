import { IsString } from 'class-validator';

export class TokenDTO {
  @IsString()
  token: string;
}
