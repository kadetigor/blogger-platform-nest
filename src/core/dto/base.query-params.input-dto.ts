// src/core/dto/base.query-params.input-dto.ts
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export class BaseQueryParams {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNumber: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Add reasonable max limit
  pageSize: number = 10;

  @Transform(({ value }) => value || SortDirection.Desc)
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.Desc;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}