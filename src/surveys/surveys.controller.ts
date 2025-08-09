import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  Get,
  UseGuards,
  Headers,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { AuthGuard } from '../Guards/auth.guard';
import { Req } from '@nestjs/common';
import { AuthenticatedRequest } from 'src/auth/interface/authenticated-request.interface';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveyService: SurveysService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createSurveyController(
    @Body() dataLogedSurvey: CreateSurveyDto,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.surveyService.createSurvey(
      dataLogedSurvey,
      request.userId,
      image,
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async editSurvey(
    @Param('id') SurveyId: string,
    @Body() DataSurveyGeted: UpdateSurveyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.surveyService.editSurvey(
      SurveyId,
      DataSurveyGeted,
      request.userId,
    );
  }
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteSurvey(
    @Param('id') SurveyId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.surveyService.deleteSurvey(SurveyId, request.userId);
  }

  @Get()
  async getSurveys(@Headers('authorization') authHeader?: string) {
    const surveys = await this.surveyService.showSurveys(authHeader);
    return surveys;
  }

  @Get(':id')
  async getOneSurvey(@Param('id') surveyId: string) {
    const survey = await this.surveyService.showSpecificSurvey(surveyId);
    return {
      success: true,
      data: survey,
    };
  }

  @UseGuards(AuthGuard)
  @Post(':surveyId/questions')
  async InsertQuestionInSurvey(
    @Param('surveyId') surveyId: string,
    @Body() question: CreateQuestionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.surveyService.createQuestionWithIdSurvey(
      surveyId,
      question,
      request.userId,
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':surveyId/questions/:questionId')
  async delete(
    @Param('surveyId') surveyId: string,
    @Req() request: AuthenticatedRequest,
    @Param('questionId') questionId: string,
  ) {
    return this.surveyService.deleteQuestionWithIdSurvey(
      surveyId,
      request.userId,
      questionId,
    );
  }

  @UseGuards(AuthGuard)
  @Put(':surveyId/questions/:questionId')
  async editQuestion(
    @Param('surveyId') surveyId: string,
    @Req() request: AuthenticatedRequest,
    @Param('questionId') questionId: string,
    @Body() Newquestion: UpdateQuestionDto,
  ) {
    return this.surveyService.editQuestionWithIdSurvey(
      surveyId,
      request.userId,
      questionId,
      Newquestion,
    );
  }

  @UseGuards(AuthGuard)
  @Get(':surveyId/results')
  async getResultsSurvey(
    @Param('surveyId') surveyId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.surveyService.ResultOfOneSurvey(surveyId, request.userId);
  }

  // Controller
  @Post(':surveyId/answer')
  async respondSurvey(
    @Param('surveyId') surveyId: string,
    @Body() submitAnswers,
  ) {
    return this.surveyService.AnswerSurvey(surveyId, submitAnswers);
  }
}
