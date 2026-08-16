import { Controller, Get, UseGuards } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { AuthGuard } from '@nestjs/passport';
import { CloudinarySignatureResponse } from './interfaces/cloudinary-signature-response.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('Cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @ApiOperation({
    summary: 'Отримання підпису для завантаження файлів у Cloudinary',
    description:
      'Генерує підпис для безпечного завантаження зображень безпосередньо з фронтенду на сервери Cloudinary. ' +
      'Це дозволяє уникнути передачі важких файлів через бекенд. ',
  })
  @ApiCookieAuth('jwt-access')
  @ApiResponse({
    status: 200,
    description: 'Параметри підпису для Cloudinary.',
    schema: {
      example: {
        signature: 'abcd1234efgh5678...',
        timestamp: 1714567890,
        folder: 'recipes/images',
        publicId: 'recipe_123_abc',
        apiKey: '123456789012345',
        cloudName: 'my-cloud-name',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - access token is missing or invalid.',
  })
  @Get('signature')
  @UseGuards(AuthGuard('jwt-access'))
  getSignature(): Promise<CloudinarySignatureResponse> {
    return this.cloudinaryService.createSignature();
  }
}
