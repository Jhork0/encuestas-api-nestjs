import { Module } from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Survey, SurveySchema } from './schemas/surveys.schema';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Survey.name, schema: SurveySchema }]),
    UploadModule,
  ],
  providers: [SurveysService],
  controllers: [SurveysController],
})
export class SurveysModule {}
