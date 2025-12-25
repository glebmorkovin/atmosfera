import { IsOptional, IsString } from "class-validator";

export class CreateVacancyApplicationDto {
  @IsOptional()
  @IsString()
  messageFromPlayer?: string;

  @IsOptional()
  @IsString()
  playerId?: string;
}
