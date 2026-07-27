import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class BulkImportDto {
  @IsNumber()
  serviceId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  emails: string[];

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  pin?: string;
}
