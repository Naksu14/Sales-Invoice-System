import { PartialType } from '@nestjs/mapped-types';
import { CreateSheetColumnDto } from './create-sheet-column.dto';

export class UpdateSheetColumnDto extends PartialType(CreateSheetColumnDto) {}
