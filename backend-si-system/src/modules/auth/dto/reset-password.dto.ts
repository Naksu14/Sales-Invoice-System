import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  new_password?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  newPassword?: string;
}
