import { IsString, MinLength } from "class-validator";

export class ResetConfirmDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
