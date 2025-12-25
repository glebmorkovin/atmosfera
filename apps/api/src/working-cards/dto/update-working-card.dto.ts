import { IsArray, IsDateString, IsOptional, IsString } from "class-validator";

export class UpdateWorkingCardDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  cityText?: string;

  @IsOptional()
  @IsString()
  positionText?: string;

  @IsOptional()
  @IsString()
  cooperationUntil?: string;

  @IsOptional()
  @IsString()
  potentialText?: string;

  @IsOptional()
  @IsString()
  skillsText?: string;

  @IsOptional()
  @IsString()
  contractStatusText?: string;

  @IsOptional()
  @IsString()
  contactsText?: string;

  @IsOptional()
  @IsString()
  clubText?: string;

  @IsOptional()
  @IsString()
  pipelineStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
