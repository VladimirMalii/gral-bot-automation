import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityFastDto {
  @ApiProperty({
    description: 'ID-ul orașului în sistemul Gralmed',
    example: '6'
  })
  @IsString()
  @IsNotEmpty()
  city_id: string;

  @ApiProperty({
    description: 'ID-ul centrului medical în sistemul Gralmed',
    example: '21'
  })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({
    description: 'ID-ul specialității în sistemul Gralmed',
    example: '25'
  })
  @IsString()
  @IsNotEmpty()
  specialization_id: string;

  @ApiProperty({
    description: 'ID-ul serviciului medical în sistemul Gralmed',
    example: 'CC002'
  })
  @IsString()
  @IsNotEmpty()
  service_id: string;

  @ApiProperty({
    description: 'ID-ul medicului în sistemul Gralmed',
    example: '142388'
  })
  @IsString()
  @IsNotEmpty()
  doctor_id: string;

  @ApiProperty({
    description: 'Data programării în format DD.MM.YYYY sau M/D/YYYY',
    example: '23.03.2026'
  })
  @IsString()
  @IsNotEmpty()
  date: string;
}
