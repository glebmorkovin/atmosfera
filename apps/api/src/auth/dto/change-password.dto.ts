import { IsEmail, IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  oldPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
