import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateSheetColumnDto {
	@IsNumber()
	@IsNotEmpty()
	spreadsheetId: number

	@IsString()
	@IsNotEmpty()
	@MaxLength(200)
	columnName: string

	@IsString()
	@IsNotEmpty()
	@MaxLength(200)
	dbFieldName: string

	@IsNumber()
	@IsOptional()
	columnOrder?: number

	@IsBoolean()
	@IsOptional()
	isRequired?: boolean
}
