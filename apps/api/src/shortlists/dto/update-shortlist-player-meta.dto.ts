import { IsArray, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateShortlistPlayerMetaDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  note?: string | null;
}
