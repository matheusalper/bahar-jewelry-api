import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator';

class ReorderItem {
  @IsString()
  id: string;

  @IsInt()
  sortOrder: number;
}

export class ReorderBannersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items: ReorderItem[];
}
