import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator'

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

	@IsString()
	@IsOptional()
	@IsIn(['text', 'number', 'date', 'dropdown'])
	dataType?: string

	@IsString()
	@IsOptional()
	@MaxLength(4000)
	dropdownOptions?: string

	@IsNumber()
	@IsOptional()
	columnOrder?: number

	@IsBoolean()
	@IsOptional()
	isRequired?: boolean
}
