import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadToCloudinaryProvider {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('appConfig.cloudinary_name'),
      api_key: this.configService.get<string>('appConfig.cloudinary_api_key'),
      api_secret: this.configService.get<string>(
        'appConfig.cloudinary_api_secret',
      ),
    });
  }

  public async fileUpload(file: Express.Multer.File, folder = 'hotel-booking') {
    if (!file || !file.buffer) {
      throw new BadRequestException('Không có tệp được cung cấp');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Tệp quá lớn, tối đa 5MB');
    }

    try {
      // Chuyển buffer thành chuỗi base64
      const base64 = file.buffer.toString('base64');
      const dataURI = `data:${file.mimetype};base64,${base64}`;

      // Tải lên Cloudinary bằng uploader.upload
      const result = await cloudinary.uploader.upload(dataURI, {
        folder,
        resource_type: 'auto',
      });

      return {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
