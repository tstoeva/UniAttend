import { IsString, MaxLength } from 'class-validator';

// Съдържанието на качения конспект (текстов файл)
export class SyllabusDto {
  @IsString() @MaxLength(20000) content!: string;
}
