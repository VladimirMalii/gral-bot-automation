import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { GralmedApiService } from './gralmed-api.service';

@Module({
  controllers: [AutomationController],
  providers: [AutomationService, GralmedApiService],
  exports: [AutomationService, GralmedApiService]
})
export class AutomationModule {}
