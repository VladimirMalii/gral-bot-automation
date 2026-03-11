import { Controller, Post, Get, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { CheckAvailabilityDto, CheckAvailabilityResponseDto } from './dto/check-availability.dto';

@ApiTags('Automation')
@Controller()
export class AutomationController {
  private readonly logger = new Logger(AutomationController.name);

  constructor(private readonly automationService: AutomationService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-03-11T12:00:00.000Z' },
        service: { type: 'string', example: 'Gralmed Automation API' }
      }
    }
  })
  getHealth() {
    this.logger.log('Health check requested');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Gralmed Automation API'
    };
  }

  @Post('check-availability')
  @ApiOperation({ summary: 'Verifică disponibilitatea sloturilor de programare' })
  @ApiResponse({ 
    status: 200, 
    description: 'Sloturi disponibile găsite',
    type: CheckAvailabilityResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Date de intrare invalide' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Eroare internă la verificarea disponibilității' 
  })
  async checkAvailability(
    @Body() checkAvailabilityDto: CheckAvailabilityDto
  ): Promise<CheckAvailabilityResponseDto> {
    try {
      this.logger.log(`Received check-availability request: ${JSON.stringify(checkAvailabilityDto)}`);
      
      const result = await this.automationService.checkAvailability(checkAvailabilityDto);
      
      this.logger.log(`Successfully checked availability: ${result.sloturi_disponibile.length} slots found`);
      
      return result;
      
    } catch (error) {
      this.logger.error(`Error in checkAvailability endpoint: ${error.message}`, error.stack);
      
      throw new HttpException(
        {
          success: false,
          message: `Failed to check availability: ${error.message}`,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
