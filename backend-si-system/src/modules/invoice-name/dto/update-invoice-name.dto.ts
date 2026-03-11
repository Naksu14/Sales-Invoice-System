import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceNameDto } from './create-invoice-name.dto';

export class UpdateInvoiceNameDto extends PartialType(CreateInvoiceNameDto) {}
