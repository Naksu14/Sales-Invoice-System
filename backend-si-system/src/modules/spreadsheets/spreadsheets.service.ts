import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Spreadsheet } from './entities/spreadsheet.entity';
import { CreateSpreadsheetDto } from './dto/create-spreadsheet.dto';
import { UpdateSpreadsheetDto } from './dto/update-spreadsheet.dto';
import { InvoiceName } from '../invoice-name/entities/invoice-name.entity';

@Injectable()
export class SpreadsheetsService {
  constructor(
    @InjectRepository(Spreadsheet)
    private spreadsheetRepository: Repository<Spreadsheet>,
    @InjectRepository(InvoiceName)
    private invoiceNameRepository: Repository<InvoiceName>,
  ) {}

   async create(createSpreadsheetDto: CreateSpreadsheetDto) {
    // If caller provided invoiceNameId, load the InvoiceName entity and attach it
    const { invoiceNameId, spreadsheetUId, sheetTabName } = createSpreadsheetDto as any

    const payload: Partial<Spreadsheet> = {
      spreadsheetUId,
      sheetTabName,
    }

    if (invoiceNameId) {
      const inv = await this.invoiceNameRepository.findOne({ where: { id: invoiceNameId } })
      if (!inv) throw new NotFoundException('InvoiceName not found')
      // check uniqueness: same sheetTabName under this invoice
      const existing = await this.spreadsheetRepository.findOne({ where: { sheetTabName, invoiceName: { id: invoiceNameId } }, relations: ['invoiceName'] })
      if (existing) throw new ConflictException('Sheet tab name already exists for this invoice')
      payload.invoiceName = inv
    }

    const spreadsheet = this.spreadsheetRepository.create(payload)
    return this.spreadsheetRepository.save(spreadsheet)
  }

  async findAll() {
    return this.spreadsheetRepository.find({ relations: ['invoiceName'] });
  }

  async findOne(id: number) {
    return this.spreadsheetRepository.findOne({ where: { id } });
  }

  async update(id: number, updateSpreadsheetDto: UpdateSpreadsheetDto) {
    const spreadsheet = await this.findOne(id)
    if (!spreadsheet) throw new ConflictException('Spreadsheet not found')

    const { invoiceNameId, spreadsheetUId, sheetTabName } = updateSpreadsheetDto as any

    if (invoiceNameId) {
      const inv = await this.invoiceNameRepository.findOne({ where: { id: invoiceNameId } })
      if (!inv) throw new NotFoundException('InvoiceName not found')
      // check uniqueness for new invoice relation and sheetTabName
      if (sheetTabName) {
        const existing = await this.spreadsheetRepository.findOne({ where: { sheetTabName, invoiceName: { id: invoiceNameId } }, relations: ['invoiceName'] })
        if (existing && existing.id !== id) throw new ConflictException('Sheet tab name already exists for this invoice')
      }
      spreadsheet.invoiceName = inv
    }

    if (spreadsheetUId !== undefined) spreadsheet.spreadsheetUId = spreadsheetUId
    if (sheetTabName !== undefined) {
      // if invoiceNameId not provided, check uniqueness under current invoice
      if (!invoiceNameId && spreadsheet.invoiceName) {
        const existing = await this.spreadsheetRepository.findOne({ where: { sheetTabName, invoiceName: { id: spreadsheet.invoiceName.id } }, relations: ['invoiceName'] })
        if (existing && existing.id !== id) throw new ConflictException('Sheet tab name already exists for this invoice')
      }
      spreadsheet.sheetTabName = sheetTabName
    }

    return this.spreadsheetRepository.save(spreadsheet)
  }

  async remove(id: number) {
    const spreadsheet = await this.findOne(id);
    if (!spreadsheet) {
      throw new ConflictException('Spreadsheet not found');
    }
    return this.spreadsheetRepository.remove(spreadsheet);
  }
}
