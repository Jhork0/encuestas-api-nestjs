import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateSurveyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
