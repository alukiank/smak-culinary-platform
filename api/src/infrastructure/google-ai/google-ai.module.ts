import { Module, Global } from '@nestjs/common';
import { GoogleAiService } from './services/google-ai.service';

@Global()
@Module({
  imports: [],
  providers: [GoogleAiService],
  exports: [GoogleAiService],
})
export class GoogleAiModule {}
