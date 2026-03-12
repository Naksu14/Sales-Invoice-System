import { PartialType } from '@nestjs/mapped-types';
import { CreateSiRecordDto } from './create-si-record.dto';

export class UpdateSiRecordDto extends PartialType(CreateSiRecordDto) {}
