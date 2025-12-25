import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { VacancyType } from "@prisma/client";

export class CreateVacancyDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsEnum(VacancyType)
  type?: VacancyType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positions?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  ageFrom?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ageTo?: number;

  @IsOptional()
  @IsString()
  locationCountry?: string;

  @IsOptional()
  @IsString()
  locationCity?: string;

  @IsOptional()
  @IsString()
  leagueId?: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @IsOptional()
  @IsString()
  contactMode?: string;
}
