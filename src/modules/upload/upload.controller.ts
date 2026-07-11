import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('upload')
@UseGuards(AuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file?: any) {
    if (!file) {
      throw new BadRequestException('No image file provided.');
    }

    const result = await this.uploadService.uploadFromBuffer(file.buffer, file.originalname);

    return {
      success: true,
      message: 'Image uploaded successfully.',
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
      },
    };
  }
}
