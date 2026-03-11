import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateInvoiceNameDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(200)
	name: string

	@IsOptional()
	@IsString()
	description?: string
}
