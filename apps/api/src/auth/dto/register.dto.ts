import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export type RegisterRole = "player" | "parent" | "scout" | "agent" | "admin";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  role: RegisterRole;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  positionTitle?: string;
}
