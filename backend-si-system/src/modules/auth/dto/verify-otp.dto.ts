import { IsEmail, IsInt, MaxLength, Min, Max } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsInt()
  @Min(100000)
  @Max(999999)
  otp: number;
}
