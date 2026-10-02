import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { AiEngineController } from './ai-engine.controller';
import { AiEngineService } from './ai-engine.service';
import { AnthropicClient } from './anthropic-client';

@Module({
  imports: [AlertsModule],
  controllers: [AiEngineController],
  providers: [AiEngineService, AnthropicClient],
  exports: [AiEngineService],
})
export class AiEngineModule {}
