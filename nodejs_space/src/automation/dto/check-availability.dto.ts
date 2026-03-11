import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CheckAvailabilityDto {
  @ApiProperty({
    example: 'Constanta',
    description: 'Orașul în care se află clinica'
  })
  @IsString()
  @IsNotEmpty()
  oras: string;

  @ApiProperty({
    example: 'Clinica Gral Constanta',
    description: 'Numele centrului medical'
  })
  @IsString()
  @IsNotEmpty()
  centru: string;

  @ApiProperty({
    example: 'ENDOCRINOLOGIE',
    description: 'Specialitatea medicală'
  })
  @IsString()
  @IsNotEmpty()
  specialitate: string;

  @ApiProperty({
    example: 'Medic specialist Raducan Doina',
    description: 'Numele medicului'
  })
  @IsString()
  @IsNotEmpty()
  medic: string;

  @ApiProperty({
    example: 'Consult - Medic specialist 250 RON',
    description: 'Serviciul medical dorit'
  })
  @IsString()
  @IsNotEmpty()
  serviciu: string;

  @ApiProperty({
    example: '11/03/2026',
    description: 'Data dorită în format DD/MM/YYYY sau "primul_loc_disponibil"'
  })
  @IsString()
  @IsNotEmpty()
  data: string;
}

export class SlotDisponibil {
  @ApiProperty({ example: '11/03/2026' })
  data: string;

  @ApiProperty({ example: '10:00' })
  ora: string;
}

export class CheckAvailabilityResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [SlotDisponibil] })
  sloturi_disponibile: SlotDisponibil[];

  @ApiProperty({ example: 'Sloturi disponibile găsite', required: false })
  message?: string;
}
