import { IsOptional, IsString } from "class-validator";

export class SubmitVacancyDto {
  @IsOptional()
  @IsString()
  note?: string;
}
