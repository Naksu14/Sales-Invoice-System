import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInvoiceNameDto } from './dto/create-invoice-name.dto';
import { UpdateInvoiceNameDto } from './dto/update-invoice-name.dto';
import { InvoiceName } from './entities/invoice-name.entity';

@Injectable()
export class InvoiceNameService {
  constructor(
    @InjectRepository(InvoiceName)
    private invoiceNameRepository: Repository<InvoiceName>
  ) {}

  async create(createInvoiceNameDto: CreateInvoiceNameDto) {
    const { name } = createInvoiceNameDto;
    // Check if an invoice name with the same name already exists
    const existingInvoiceName = await this.invoiceNameRepository.findOne({ where: { name } });
    if (existingInvoiceName) {
      throw new ConflictException('Invoice name with this name already exists');
    }
    const newInvoiceName = this.invoiceNameRepository.create(createInvoiceNameDto);
    return this.invoiceNameRepository.save(newInvoiceName);
  }

  async findAll() {
    return this.invoiceNameRepository.find();
  }

  async findOne(id: number) {
    return this.invoiceNameRepository.findOne({ where: { id } });
  }

  async update(id: number, updateInvoiceNameDto: UpdateInvoiceNameDto) {
    await this.invoiceNameRepository.update(id, updateInvoiceNameDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const invoiceName = await this.findOne(id);
    if (!invoiceName) {
      throw new ConflictException('Invoice name not found');
    }
    return this.invoiceNameRepository.remove(invoiceName);
  }
}
