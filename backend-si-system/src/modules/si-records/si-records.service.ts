import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiRecord } from './entities/si-record.entity';
import { CreateSiRecordDto } from './dto/create-si-record.dto';
import { UpdateSiRecordDto } from './dto/update-si-record.dto';
import { Spreadsheet } from '../spreadsheets/entities/spreadsheet.entity';
import { SheetColumn } from '../sheet-column/entities/sheet-column.entity';
import { GoogleSheetsService } from '../spreadsheets/google-sheets.service';

@Injectable()
export class SiRecordsService {
  constructor(
    @InjectRepository(SiRecord)
    private siRecordRepository: Repository<SiRecord>,
    @InjectRepository(Spreadsheet)
    private spreadsheetRepository: Repository<Spreadsheet>,
    @InjectRepository(SheetColumn)
    private sheetColumnRepository: Repository<SheetColumn>,
    private googleSheetsService: GoogleSheetsService,
  ) {}

  async create(createSiRecordDto: CreateSiRecordDto) {
    const spreadsheet = await this.spreadsheetRepository.findOne({ where: { id: createSiRecordDto.sheetId } });
    if (!spreadsheet) throw new NotFoundException('Spreadsheet not found');

    const siRecord = this.siRecordRepository.create({
      data: createSiRecordDto.data,
      spreadsheet,
    });
    const saved = await this.siRecordRepository.save(siRecord);

    // Append the row to the live Google Sheet asynchronously (don't block response)
    this.appendToGoogleSheet(spreadsheet, createSiRecordDto.data).catch((err) =>
      console.error('[GoogleSheets] Failed to append row:', err.message),
    );

    return saved;
  }

  private async appendToGoogleSheet(spreadsheet: Spreadsheet, data: Record<string, unknown>) {
    // Fetch columns ordered by columnOrder to build the row in the correct sequence
    const columns = await this.sheetColumnRepository.find({
      where: { spreadsheet: { id: spreadsheet.id } },
      order: { columnOrder: 'ASC' },
    });

    if (columns.length === 0) return;

    const rowValues = columns.map((c) => {
      const val = data[c.dbFieldName];
      return val !== undefined && val !== null ? String(val) : '';
    });

    await this.googleSheetsService.appendRow(
      spreadsheet.spreadsheetUId,
      spreadsheet.sheetTabName,
      rowValues,
    );
  }

  findAll() {
    return this.siRecordRepository.find({ relations: ['spreadsheet'] });
  }

  findBySheet(sheetId: number) {
    return this.siRecordRepository.find({
      where: { spreadsheet: { id: sheetId } },
      relations: ['spreadsheet'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const siRecord = await this.siRecordRepository.findOne({ where: { id }, relations: ['spreadsheet'] });
    if (!siRecord) throw new NotFoundException('SI record not found');
    return siRecord;
  }

  async update(id: number, updateSiRecordDto: UpdateSiRecordDto) {
    const existing = await this.siRecordRepository.findOne({ where: { id }, relations: ['spreadsheet'] });
    if (!existing) throw new NotFoundException('SI record not found');

    const updatePayload: any = {};

    if (updateSiRecordDto.data !== undefined) {
      updatePayload.data = updateSiRecordDto.data;
    }

    if (updateSiRecordDto.sheetId !== undefined) {
      const spreadsheet = await this.spreadsheetRepository.findOne({ where: { id: updateSiRecordDto.sheetId } });
      if (!spreadsheet) throw new NotFoundException('Spreadsheet not found');
      updatePayload.spreadsheet = spreadsheet;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException('No valid fields provided to update');
    }

    await this.siRecordRepository.update(id, updatePayload);
    return this.findOne(id);
  }
  
  async remove(id: number) {
    const result = await this.siRecordRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('SI record not found');
    return { deleted: true };
  }
}
