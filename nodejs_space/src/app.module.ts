import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AutomationModule } from './automation/automation.module';

@Module({
  imports: [AutomationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
