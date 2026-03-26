import { IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator'

export class CreateSiRecordDto {
	@IsNumber()
	@IsNotEmpty()
	sheetId: number

	@IsObject()
	@IsNotEmpty()
	data: Record<string, unknown>

	@IsOptional()
	@IsNumber()
	inputUserId?: number
}
