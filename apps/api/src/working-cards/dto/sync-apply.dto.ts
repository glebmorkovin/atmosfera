import { IsArray, IsString } from "class-validator";

export class SyncApplyDto {
  @IsArray()
  @IsString({ each: true })
  fields!: string[];
}
