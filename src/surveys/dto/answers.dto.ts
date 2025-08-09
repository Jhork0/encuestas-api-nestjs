import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class AnswerDto {
  @IsNotEmpty()
  @IsString()
  questionId: string;

  @IsString()
  @IsOptional()
  textAnswer?: string;

  @IsString()
  @IsOptional()
  optionId?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  optionIds?: string[];
}

export class SubmitAnswersDto {
  @IsMongoId()
  @IsNotEmpty()
  questionId: string;

  @IsMongoId()
  @IsNotEmpty()
  optionId: string;
}
