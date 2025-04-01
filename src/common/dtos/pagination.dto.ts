import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Min(1)
  @Type(() => Number) // enableImplicitConversion: true
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number) // enableImplicitConversion: true
  offset?: number;
}
