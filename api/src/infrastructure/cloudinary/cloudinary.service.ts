import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { CloudinarySignatureResponse } from './interfaces/cloudinary-signature-response.interface';
import { ConfigService } from '@nestjs/config';
import { CLOUDINARY_CONSTANTS } from './cloudinary.constants';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async createSignature(): Promise<CloudinarySignatureResponse> {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = CLOUDINARY_CONSTANTS.FOLDERS.RECIPES;
    const generatedPublicId = uuidv4();

    const paramsToSign = {
      timestamp,
      folder,
      public_id: generatedPublicId,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.configService.get<string>('CLOUDINARY_API_SECRET'),
    );

    return {
      signature,
      timestamp,
      folder,
      publicId: generatedPublicId,
      apiKey: this.configService.get<string>('CLOUDINARY_API_KEY'),
      cloudName: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
    };
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const fullPublicId = publicId.includes('/')
        ? publicId
        : `${CLOUDINARY_CONSTANTS.FOLDERS.RECIPES}/${publicId}`;
      const result = await cloudinary.uploader.destroy(fullPublicId);
      return result.result === 'ok';
    } catch (error) {
      this.logger.error(
        `[Cloudinary] Failed to delete image "${publicId}": ${error.message}`,
        error.stack,
      );
      throw new ServiceUnavailableException(
        `Could not delete image from cloud storage.`,
      );
    }
  }

  async fetchImageAsBase64(
    publicId: string,
  ): Promise<{ data: string; mimeType: string }> {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');

    if (!cloudName) {
      this.logger.error(
        '[Cloudinary] CLOUDINARY_CLOUD_NAME is not set in configuration.',
      );
      throw new InternalServerErrorException(
        'Image service is improperly configured',
      );
    }

    try {
      const url = this.getCloudinaryImageUrl(
        publicId,
        CLOUDINARY_CONSTANTS.DEFAULT_FETCH_OPTIONS,
      );

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.error(
          `[Cloudinary] Failed to fetch image "${publicId}" from URL: ${url}. Status: ${response.status} ${response.statusText}`,
        );
        throw new ServiceUnavailableException(
          'Failed to download image from cloud storage',
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType =
        response.headers.get('content-type') ||
        CLOUDINARY_CONSTANTS.DEFAULT_MIME_TYPE;

      return {
        data: buffer.toString('base64'),
        mimeType: mimeType,
      };
    } catch (error) {
      this.logger.error(
        `[Cloudinary] Error fetching image "${publicId}" as base64: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof ServiceUnavailableException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException('Error processing image data');
    }
  }

  getCloudinaryImageUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
    },
  ) {
    const transformationOptions: any = {
      fetch_format: 'auto',
    };
    if (options?.width) transformationOptions.width = options.width;
    if (options?.height) transformationOptions.height = options.height;
    if (options?.crop) transformationOptions.crop = options.crop;
    if (options?.quality) transformationOptions.quality = options.quality;

    const fullPublicId = publicId.includes('/')
      ? publicId
      : `${CLOUDINARY_CONSTANTS.FOLDERS.RECIPES}/${publicId}`;
    return cloudinary.url(fullPublicId, transformationOptions);
  }
}
