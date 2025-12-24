import { IsOptional, IsString } from "class-validator";

export class CreateEngagementRequestDto {
  @IsString()
  playerId!: string;

  @IsOptional()
  @IsString()
  message?: string;
}
