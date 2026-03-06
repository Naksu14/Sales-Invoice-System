import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAuthDto {
	@IsEmail()
	@MaxLength(255)
	email: string;

	@IsString()
	@MinLength(6)
	@MaxLength(255)
	password: string;
}
