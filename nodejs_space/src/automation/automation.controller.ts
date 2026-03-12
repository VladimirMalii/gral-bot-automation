import { Controller, Post, Get, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { GralmedApiService } from './gralmed-api.service';
import { AppointmentFinalizationService } from './appointment-finalization.service';
import { CheckAvailabilityDto, CheckAvailabilityResponseDto } from './dto/check-availability.dto';
import { CheckAvailabilityFastDto } from './dto/check-availability-fast.dto';
import { FinalizeAppointmentDto, FinalizeAppointmentResponseDto } from './dto/finalize-appointment.dto';

@ApiTags('Automation')
@Controller()
export class AutomationController {
  private readonly logger = new Logger(AutomationController.name);

  constructor(
    private readonly automationService: AutomationService,
    private readonly gralmedApiService: GralmedApiService,
    private readonly appointmentFinalizationService: AppointmentFinalizationService
  ) {}

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

  @Post('check-availability-fast')
  @ApiOperation({ 
    summary: '⚡ RAPID: Verifică disponibilitatea folosind ID-uri directe (0.5-2 secunde)',
    description: 'Această metodă apelează direct API-ul intern Gralmed fără browser automation. Este 45-67x mai rapidă decât metoda standard. Necesită ID-uri interne Gralmed pentru oraș, centru, specialitate, medic și serviciu.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sloturi disponibile găsite',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        sloturi_disponibile: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              data: { type: 'string', example: '23.03.2026' },
              ora: { type: 'string', example: '14:00' }
            }
          }
        },
        message: { type: 'string', example: 'Sloturi disponibile găsite' },
        response_time_seconds: { type: 'number', example: 0.89 }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Date de intrare invalide' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Eroare internă la verificarea disponibilității' 
  })
  async checkAvailabilityFast(
    @Body() dto: CheckAvailabilityFastDto
  ) {
    try {
      this.logger.log(`Received check-availability-fast request with IDs: ${JSON.stringify(dto)}`);
    
      const startTime = Date.now();
    
      // Format date for API
      const formattedDate = this.gralmedApiService.formatDateForApi(dto.date);
    
      // Call Gralmed API directly
      const hours = await this.gralmedApiService.getAvailableHours({
        city_id: dto.city_id,
        location_id: dto.location_id,
        specialization_id: dto.specialization_id,
        service_id: dto.service_id,
        doctor_id: dto.doctor_id,
        date: formattedDate
      });
    
      const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
      // Transform hours array to sloturi format
      const sloturi = hours.map(hour => {
        // Extract HH:MM from HH:MM:SS
        const timeMatch = hour.match(/^(\d{2}):(\d{2})/);
        const ora = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : hour;
      
        return {
          data: dto.date,
          ora: ora
        };
      });
    
      this.logger.log(`Found ${sloturi.length} slots in ${responseTime}s`);
    
      return {
        success: true,
        sloturi_disponibile: sloturi,
        message: sloturi.length > 0 ? 'Sloturi disponibile găsite' : 'Nu există sloturi disponibile',
        response_time_seconds: parseFloat(responseTime)
      };
    
    } catch (error) {
      this.logger.error(`Error in checkAvailabilityFast endpoint: ${error.message}`, error.stack);
    
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
