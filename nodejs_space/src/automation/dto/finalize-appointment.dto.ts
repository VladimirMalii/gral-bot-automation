import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class FinalizeAppointmentDto {
  @ApiProperty({
    example: '31',
    description: 'ID-ul orașului (31 = Slatina)'
  })
  @IsString()
  @IsNotEmpty()
  city_id: string;

  @ApiProperty({
    example: '82',
    description: 'ID-ul clinicii (82 = Clinica Gral Slatina)'
  })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({
    example: '3',
    description: 'ID-ul specialității (3 = Cardiologie, 18 = Oncologie)'
  })
  @IsString()
  @IsNotEmpty()
  specialization_id: string;

  @ApiProperty({
    example: 'CC001',
    description: 'ID-ul serviciului (CC001 = Consult Cardiologie, CC5360 = Consult Oncologie)'
  })
  @IsString()
  @IsNotEmpty()
  service_id: string;

  @ApiProperty({
    example: '144611',
    description: 'ID-ul medicului (144611 = Dr. Vilceanu, 144616 = Dr. Pirciu)'
  })
  @IsString()
  @IsNotEmpty()
  doctor_id: string;

  @ApiProperty({
    example: '25.03.2026',
    description: 'Data programării în format DD.MM.YYYY'
  })
  @IsString()
  @IsNotEmpty()
  data_programare: string;

  @ApiProperty({
    example: '17:40',
    description: 'Ora programării în format HH:MM'
  })
  @IsString()
  @IsNotEmpty()
  ora_programare: string;

  @ApiProperty({
    example: 'Ion Popescu',
    description: 'Numele și prenumele complet al pacientului'
  })
  @IsString()
  @IsNotEmpty()
  nume_prenume: string;

  @ApiProperty({
    example: '15.03.1985',
    description: 'Data nașterii pacientului în format DD.MM.YYYY'
  })
  @IsString()
  @IsNotEmpty()
  data_nasterii: string;

  @ApiProperty({
    example: '0721234567',
    description: 'Număr de telefon format 10 cifre începând cu 07'
  })
  @IsString()
  @IsNotEmpty()
  telefon: string;

  @ApiProperty({
    example: 'ion.popescu@gmail.com',
    description: 'Adresa de email a pacientului'
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Alergii la penicilină',
    description: 'Observații sau mențiuni medicale suplimentare',
    required: false
  })
  @IsString()
  @IsOptional()
  observatii?: string;
}

export class FinalizeAppointmentResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Programarea a fost înregistrată cu succes!' })
  message: string;

  @ApiProperty({ 
    example: {
      medic: 'Dr. Vilceanu Gabriel Cosmin',
      data: '25.03.2026',
      ora: '17:40',
      pacient: 'Ion Popescu'
    },
    required: false
  })
  detalii?: {
    medic: string;
    data: string;
    ora: string;
    pacient: string;
  };
}
