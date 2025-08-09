import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS configuration');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(
    fileName: string,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: file,
        ContentType: contentType,
      }),
    );

    return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
  }
  async deleteFile(fileName: string): Promise<void> {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      }),
    );
  }

  async replaceFile(
    oldFileName: string,
    newFileName: string,
    newFile: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.deleteFile(oldFileName);

    return this.uploadFile(newFileName, newFile, contentType);
  }
}
