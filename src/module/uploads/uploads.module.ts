import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { UploadToCloudinaryProvider } from './provider/upload-to-cloudinary.provider';
import { Upload } from './entities/upload.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [UploadsController],
  providers: [UploadToCloudinaryProvider, UploadsService],
  imports: [TypeOrmModule.forFeature([Upload])],
})
export class UploadsModule {}
