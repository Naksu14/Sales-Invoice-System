import { IsNotEmpty, IsNumber, IsObject } from 'class-validator'

export class CreateSiRecordDto {
	@IsNumber()
	@IsNotEmpty()
	sheetId: number

	@IsObject()
	@IsNotEmpty()
	data: Record<string, unknown>
}
