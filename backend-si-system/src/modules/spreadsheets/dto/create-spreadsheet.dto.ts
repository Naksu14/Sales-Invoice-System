import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator'

export class CreateSpreadsheetDto {
	@IsNumber()
	@IsNotEmpty()
	invoiceNameId: number

	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	spreadsheetUId: string

	@IsString()
	@IsNotEmpty()
	@MaxLength(200)
	sheetTabName: string
}
