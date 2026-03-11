import { PartialType } from '@nestjs/mapped-types';
import { CreateSpreadsheetDto } from './create-spreadsheet.dto';

export class UpdateSpreadsheetDto extends PartialType(CreateSpreadsheetDto) {}
