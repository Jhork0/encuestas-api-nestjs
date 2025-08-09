import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as Types } from 'mongoose';

@Schema()
export class Option extends Document {
  @Prop({ required: true })
  text: string;

  @Prop({ default: 0 })
  count: number;
}
export const OptionSchema = SchemaFactory.createForClass(Option);

@Schema()
export class Question extends Document {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: [OptionSchema], default: [] })
  options: Option[];
}
export const QuestionSchema = SchemaFactory.createForClass(Question);

@Schema()
export class Survey extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creator: typeof Types.ObjectId;

  @Prop()
  imageUrl: string;

  @Prop({ type: [QuestionSchema], default: [] })
  questions: Question[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: true })
  isPublic: boolean;
}

export const SurveySchema = SchemaFactory.createForClass(Survey);
