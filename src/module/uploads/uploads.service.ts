import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Upload } from './entities/upload.entity';
import { UploadToCloudinaryProvider } from './provider/upload-to-cloudinary.provider';
import { UploadFileInterface } from './interfaces/upload-file';
import { FileTypes } from './enums/file-types.enum';

@Injectable()
export class UploadsService {
  constructor(
    private readonly uploadToCloudinaryProvider: UploadToCloudinaryProvider,

    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
  ) {}
  public async uploadFileToCloudinary(file: Express.Multer.File) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ hỗ trợ định dạng JPEG, PNG, GIF');
    }

    try {
      const result = await this.uploadToCloudinaryProvider.fileUpload(file);

      const uploadFile: UploadFileInterface = {
        publicId: result.public_id,
        path: result.url,
        type: FileTypes.IMAGE,
        mime: file.mimetype,
        size: file.size,
      };

      const upload = this.uploadRepository.create(uploadFile);

      return await this.uploadRepository.save(upload);
    } catch (error) {
      throw new ConflictException(error);
    }
  }
}
