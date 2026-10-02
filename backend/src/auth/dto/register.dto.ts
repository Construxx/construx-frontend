import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;

  // Public registration is self-service only for read-only accounts. Privileged roles
  // must be assigned through trusted administrative tooling.
  @IsOptional()
  @IsIn([Role.VIEWER])
  role?: Role;
}
