import {
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';
export class CreateSurveyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}
