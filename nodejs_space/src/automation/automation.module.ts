import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { GralmedApiService } from './gralmed-api.service';
import { AppointmentFinalizationService } from './appointment-finalization.service';

@Module({
  controllers: [AutomationController],
  providers: [AutomationService, GralmedApiService, AppointmentFinalizationService],
  exports: [AutomationService, GralmedApiService, AppointmentFinalizationService]
})
export class AutomationModule {}
