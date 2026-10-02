import { IsString, MaxLength } from 'class-validator';

export class AskDto {
  @IsString() projectId: string;
  @IsString() @MaxLength(1000) question: string;
}
