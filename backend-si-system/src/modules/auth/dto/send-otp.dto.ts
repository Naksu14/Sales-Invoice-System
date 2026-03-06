import { IsEmail, MaxLength } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  @MaxLength(255)
  email: string;
}
