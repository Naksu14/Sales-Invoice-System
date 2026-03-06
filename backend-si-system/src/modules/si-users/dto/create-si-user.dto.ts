import {
	IsBoolean,
	IsEmail,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator';
import { SiUserRole } from '../entities/si-user.entity';

export class CreateSiUserDto {
	@IsString()
	@MaxLength(255)
	full_name: string;

	@IsEmail()
	@MaxLength(255)
	email: string;

	@IsString()
	@MinLength(6)
	@MaxLength(255)
	password: string;

	@IsEnum(SiUserRole)
	role: SiUserRole;
    
	@IsOptional()
	@IsInt()
	verifycode?: number;
}
