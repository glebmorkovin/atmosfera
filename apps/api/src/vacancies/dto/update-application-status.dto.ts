import { IsEnum, IsOptional, IsString } from "class-validator";
import { VacancyApplicationStatus } from "@prisma/client";

export class UpdateApplicationStatusDto {
  @IsEnum(VacancyApplicationStatus)
  status!: VacancyApplicationStatus;

  @IsOptional()
  @IsString()
  messageFromClub?: string;
}
