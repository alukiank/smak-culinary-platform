import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CloudinaryService } from '../cloudinary.service';

@Processor('cloudinary-cleanup', { concurrency: 5 })
export class CloudinaryCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CloudinaryCleanupProcessor.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {
    super();
  }

  async process(job: Job<{ publicId: string }>): Promise<void> {
    const { publicId } = job.data;
    this.logger.log(
      `[Job:${job.id}] [Cloudinary Cleanup] Attempting to delete image: ${publicId}`,
    );

    const deleted = await this.cloudinaryService.deleteImage(publicId);

    if (deleted) {
      this.logger.log(
        `[Job:${job.id}] [Cloudinary Cleanup] Successfully deleted image: ${publicId}`,
      );
    } else {
      this.logger.warn(
        `[Job:${job.id}] [Cloudinary Cleanup] Image not found or could not be deleted from Cloudinary: ${publicId}`,
      );
    }
  }
}
