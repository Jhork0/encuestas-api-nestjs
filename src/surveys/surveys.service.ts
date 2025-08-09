import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { Survey } from './schemas/surveys.schema';
import { JwtService } from '@nestjs/jwt';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { JwtPayload } from '../auth/interface/jwt-payload.interface';
import { UploadService } from '../upload/upload.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Types } from 'mongoose';
import { SubmitAnswersDto } from './dto/answers.dto';
@Injectable()
export class SurveysService {
  constructor(
    @InjectModel(Survey.name) private SurveyModule: Model<Survey>,
    private jwtService: JwtService,
    private uploadService: UploadService,
  ) {}

  async createSurvey(
    dataSurvey: CreateSurveyDto,
    userId: string,
    image?: Express.Multer.File,
  ) {
    const creatorSurvey = userId;
    let imageUrl: string | undefined;
    if (image) {
      const { originalname, buffer, mimetype } = image;
      try {
        const fileName = `surveys/${Date.now()}-${originalname}`;
        imageUrl = await this.uploadService.uploadFile(
          fileName,
          buffer,
          mimetype,
        );
      } catch (error) {
        if (error instanceof Error) {
          throw new InternalServerErrorException(
            `Error uploading image: ${error.message}`,
          );
        }
        throw new InternalServerErrorException('Error uploading image');
      }
    }

    const surveyCreated = await this.SurveyModule.create({
      title: dataSurvey.title,
      description: dataSurvey.description,
      creator: creatorSurvey,
      imageUrl: imageUrl,
    });

    return surveyCreated;
  }

  async editSurvey(
    surveyId: string,
    dataSurvey: UpdateSurveyDto,
    userId: string,
    buffer?: Buffer,
    originalname?: string,
    mimetype?: string,
  ): Promise<Survey> {
    const surveyToUpdate = await this.SurveyModule.findById(surveyId);
    if (!surveyToUpdate) {
      throw new NotFoundException('Encuesta no encontrada.');
    }

    if (surveyToUpdate.creator.toString() !== userId) {
      throw new UnauthorizedException(
        'No tienes permisos para editar esta encuesta.',
      );
    }

    if (buffer && originalname && mimetype) {
      if (surveyToUpdate.imageUrl) {
        const oldKey = surveyToUpdate.imageUrl.split('.com/')[1];
        await this.uploadService.deleteFile(oldKey);
      }
      const newFileName = `surveys/${Date.now()}-${originalname}`;
      const newImageUrl = await this.uploadService.uploadFile(
        newFileName,
        buffer,
        mimetype,
      );
      surveyToUpdate.imageUrl = newImageUrl;
    }
    Object.assign(surveyToUpdate, dataSurvey);

    await surveyToUpdate.save();
    return surveyToUpdate;
  }

  async deleteSurvey(surveyId: string, userId: string) {
    const surveyToDelete = await this.SurveyModule.findById(surveyId);
    if (!surveyToDelete) {
      throw new NotFoundException('Encuesta no encontrada.');
    }

    if (surveyToDelete.creator.toString() !== userId) {
      throw new UnauthorizedException(
        'No tienes permisos para eliminar esta encuesta.',
      );
    }

    if (surveyToDelete.imageUrl) {
      const key = surveyToDelete.imageUrl.split('.com/')[1];
      try {
        await this.uploadService.deleteFile(key);
      } catch (error) {
        console.warn('Error eliminando imagen de S3:', error);
      }
    }

    await this.SurveyModule.findByIdAndDelete(surveyId);

    return { message: 'Encuesta eliminada correctamente.' };
  }

  async showSurveys(authHeader?: string): Promise<Survey[]> {
    try {
      let creatorId: string | undefined;
      if (authHeader) {
        const token = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : authHeader;

        try {
          const decoded: JwtPayload = this.jwtService.verify(token);
          creatorId = decoded.userId;
        } catch (jwtError) {
          console.warn(
            'JWT inválido o expirado:',
            jwtError instanceof Error ? jwtError.message : 'Error desconocido',
          );
        }
      }
      const query = creatorId ? { creator: creatorId } : {};

      return await this.SurveyModule.find(query, {
        title: 1,
        description: 1,
        _id: 0,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener las encuestas: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener las encuestas');
    }
  }
  async showSpecificSurvey(surveyId: string) {
    try {
      const foundSurvey = await this.SurveyModule.findById(surveyId);

      if (!foundSurvey) {
        throw new Error(`Survey with ID ${surveyId} not found`);
      }

      return foundSurvey;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener la encuesta: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener la encuesta');
    }
  }

  async createQuestionWithIdSurvey(
    surveyId: string,
    questionDto: CreateQuestionDto,
    userId: string,
  ) {
    const survey = await this.SurveyModule.findOne({
      _id: surveyId,
      creator: userId,
    });

    if (!survey) {
      throw new UnauthorizedException();
    }

    const newQuestion = {
      text: questionDto.text,
      type: questionDto.type,
      options:
        questionDto.options?.map((option) => ({
          text: option.text,
          count: 0,
        })) || [],
    };

    return await this.SurveyModule.findByIdAndUpdate(
      surveyId,
      { $push: { questions: newQuestion } },
      { new: true },
    );
  }

  async deleteQuestionWithIdSurvey(
    surveyId: string,
    userId: string,
    questionId: string,
  ) {
    const survey = await this.SurveyModule.findOne({
      _id: surveyId,
      creator: userId,
    });

    if (!survey) {
      throw new UnauthorizedException();
    }

    const questionToDelete = await this.SurveyModule.findByIdAndUpdate(
      surveyId,
      {
        $pull: {
          questions: { _id: questionId },
        },
      },
      { new: true },
    );

    return questionToDelete;
  }

  async editQuestionWithIdSurvey(
    surveyId: string,
    userId: string,
    questionId: string,
    updateQuestionDto: UpdateQuestionDto,
  ) {
    const survey = await this.SurveyModule.findOne({
      _id: surveyId,
      creator: userId,
    });

    if (!survey) {
      throw new UnauthorizedException();
    }

    const questionExists = survey.questions.some((q) => {
      return q._id instanceof Types.ObjectId && q._id.toString() === questionId;
    });

    if (!questionExists) {
      throw new NotFoundException('Pregunta no encontrada en survey');
    }

    const updatedSurvey = await this.SurveyModule.findOneAndUpdate(
      {
        _id: surveyId,
        'questions._id': questionId,
      },
      {
        $set: {
          'questions.$[elem].text': updateQuestionDto.text,
          'questions.$[elem].type': updateQuestionDto.type,
          'questions.$[elem].options': updateQuestionDto.options,
        },
      },
      {
        arrayFilters: [{ 'elem._id': questionId }],
        new: true,
      },
    );

    return updatedSurvey;
  }

  async ResultOfOneSurvey(surveyId: string, userId: string) {
    const survey = await this.SurveyModule.findOne(
      { _id: surveyId, creator: userId },
      { questions: 1 },
    ).lean();

    if (!survey) {
      throw new UnauthorizedException(
        'No autorizado o encuesta no encontrada.',
      );
    }
    return survey.questions;
  }

  async AnswerSurvey(surveyId: string, submitAnswers: SubmitAnswersDto) {
    const survey = await this.SurveyModule.findOne({
      _id: surveyId,
    });

    if (!survey) {
      throw new UnauthorizedException();
    }

    const { questionId, optionId } = submitAnswers;

    const questionExists = survey.questions.some((q) => {
      return q._id instanceof Types.ObjectId && q._id.toString() === questionId;
    });

    if (!questionExists) {
      throw new NotFoundException('Pregunta no encontrada en survey');
    }

    const option = questionId;
    if (!option) {
      throw new NotFoundException('Option not found in question');
    }

    const updatedSurvey = await this.SurveyModule.findOneAndUpdate(
      {
        _id: surveyId,
        'questions._id': questionId,
        'questions.options._id': optionId,
      },
      {
        $inc: {
          'questions.$[question].options.$[option].count': 1,
        },
      },
      {
        arrayFilters: [
          { 'question._id': questionId },
          { 'option._id': optionId },
        ],
        new: true,
      },
    );

    return updatedSurvey;
  }
}
