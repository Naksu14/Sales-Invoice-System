import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiRecord } from './entities/si-record.entity';
import { CreateSiRecordDto } from './dto/create-si-record.dto';
import { UpdateSiRecordDto } from './dto/update-si-record.dto';
import { Spreadsheet } from '../spreadsheets/entities/spreadsheet.entity';
import { SheetColumn } from '../sheet-column/entities/sheet-column.entity';
import { SiUser } from '../si-users/entities/si-user.entity';
import { GoogleSheetsService } from '../spreadsheets/google-sheets.service';
import { formatValueForSheet, normalizeValueForStorage } from '../../utils/formatters';

@Injectable()
export class SiRecordsService {
  constructor(
    @InjectRepository(SiRecord)
    private siRecordRepository: Repository<SiRecord>,
    @InjectRepository(Spreadsheet)
    private spreadsheetRepository: Repository<Spreadsheet>,
    @InjectRepository(SheetColumn)
    private sheetColumnRepository: Repository<SheetColumn>,
    @InjectRepository(SiUser)
    private siUserRepository: Repository<SiUser>,
    private googleSheetsService: GoogleSheetsService,
  ) {}

  private normalizeRecordData(columns: SheetColumn[], data: Record<string, unknown>) {
    const normalizedData: Record<string, unknown> = { ...(data || {}) };

    columns.forEach((column) => {
      const key = column.dbFieldName;
      if (!Object.prototype.hasOwnProperty.call(normalizedData, key)) return;

      const rawValue = normalizedData[key];
      normalizedData[key] = normalizeValueForStorage(rawValue, column.dataType, column.columnName);
    });

    return normalizedData;
  }

  private async getSpreadsheetColumns(spreadsheetId: number) {
    return this.sheetColumnRepository.find({
      where: { spreadsheet: { id: spreadsheetId } },
      order: { columnOrder: 'ASC' },
    });
  }

  async create(createSiRecordDto: CreateSiRecordDto) {
    const spreadsheet = await this.spreadsheetRepository.findOne({ where: { id: createSiRecordDto.sheetId } });
    if (!spreadsheet) throw new NotFoundException('Spreadsheet not found');
    const columns = await this.getSpreadsheetColumns(spreadsheet.id);
    let inputUser: SiUser | undefined = undefined
    if (createSiRecordDto.inputUserId !== undefined && createSiRecordDto.inputUserId !== null) {
      const foundUser = await this.siUserRepository.findOne({ where: { user_id: createSiRecordDto.inputUserId } })
      if (!foundUser) throw new NotFoundException('Input user not found')
      inputUser = foundUser
    }

    const normalizedData = this.normalizeRecordData(columns, createSiRecordDto.data || {});

    const siRecord = this.siRecordRepository.create({
      data: normalizedData,
      spreadsheet,
      inputUser,
    });
    const saved = await this.siRecordRepository.save(siRecord);

    // Append the row to the live Google Sheet asynchronously (don't block response)
    this.appendToGoogleSheet(spreadsheet, normalizedData).catch((err) =>
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
      return formatValueForSheet(val, c.dataType, c.columnName);
    });

    await this.googleSheetsService.appendRow(
      spreadsheet.spreadsheetUId,
      spreadsheet.sheetTabName,
      rowValues,
    );
  }

  private async buildOrderedRowValues(spreadsheetId: number, data: Record<string, unknown>) {
    const columns = await this.sheetColumnRepository.find({
      where: { spreadsheet: { id: spreadsheetId } },
      order: { columnOrder: 'ASC' },
    })

    if (columns.length === 0) return [] as string[]

    return columns.map((column) => {
      const value = data?.[column.dbFieldName]
      return formatValueForSheet(value, column.dataType, column.columnName)
    })
  }

  findAll() {
    return this.siRecordRepository.find({ relations: ['spreadsheet', 'inputUser'] });
  }

  findBySheet(sheetId: number) {
    return this.siRecordRepository.find({
      where: { spreadsheet: { id: sheetId } },
      relations: ['spreadsheet', 'inputUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const siRecord = await this.siRecordRepository.findOne({ where: { id }, relations: ['spreadsheet', 'inputUser'] });
    if (!siRecord) throw new NotFoundException('SI record not found');
    return siRecord;
  }

  async update(id: number, updateSiRecordDto: UpdateSiRecordDto) {
    const existing = await this.siRecordRepository.findOne({ where: { id }, relations: ['spreadsheet'] });
    if (!existing) throw new NotFoundException('SI record not found');
    const targetSpreadsheetId = updateSiRecordDto.sheetId ?? existing.spreadsheet?.id;
    const columns = targetSpreadsheetId ? await this.getSpreadsheetColumns(targetSpreadsheetId) : [];

    const updatePayload: any = {};

    if (updateSiRecordDto.data !== undefined) {
      updatePayload.data = this.normalizeRecordData(columns, updateSiRecordDto.data || {});
    }

    if (updateSiRecordDto.sheetId !== undefined) {
      const spreadsheet = await this.spreadsheetRepository.findOne({ where: { id: updateSiRecordDto.sheetId } });
      if (!spreadsheet) throw new NotFoundException('Spreadsheet not found');
      updatePayload.spreadsheet = spreadsheet;
    }

    if (updateSiRecordDto.inputUserId !== undefined) {
      if (updateSiRecordDto.inputUserId === null) {
        updatePayload.inputUser = null
      } else {
        const user = await this.siUserRepository.findOne({ where: { user_id: updateSiRecordDto.inputUserId } })
        if (!user) throw new NotFoundException('Input user not found')
        updatePayload.inputUser = user
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException('No valid fields provided to update');
    }

    await this.siRecordRepository.update(id, updatePayload);
    const updatedRecord = await this.findOne(id);

    // Keep DB as source of truth. Google Sheets sync is best-effort and should not block API success.
    try {
      const sourceSpreadsheet = existing.spreadsheet
      const targetSpreadsheet = updatedRecord.spreadsheet

      if (sourceSpreadsheet?.id !== targetSpreadsheet?.id) {
        const rowValues = await this.buildOrderedRowValues(
          targetSpreadsheet.id,
          updatedRecord.data || {},
        )

        if (rowValues.length > 0) {
          await this.googleSheetsService.appendRow(
            targetSpreadsheet.spreadsheetUId,
            targetSpreadsheet.sheetTabName,
            rowValues,
          )
        }
      } else if (updateSiRecordDto.data !== undefined) {
        const oldRowValues = await this.buildOrderedRowValues(
          sourceSpreadsheet.id,
          existing.data || {},
        )
        const newRowValues = await this.buildOrderedRowValues(
          sourceSpreadsheet.id,
          updatedRecord.data || {},
        )

        if (oldRowValues.length > 0 && newRowValues.length > 0) {
          const updated = await this.googleSheetsService.updateRowByMatch(
            sourceSpreadsheet.spreadsheetUId,
            sourceSpreadsheet.sheetTabName,
            oldRowValues,
            newRowValues,
          )

          if (!updated) {
            console.warn(`[GoogleSheets] Could not find matching row to update for SI record ${id}`)
          }
        }
      }
    } catch (err: any) {
      console.error('[GoogleSheets] Failed to sync SI record update:', err?.message || err)
    }

    return updatedRecord;
  }
  
  async remove(id: number) {
    const result = await this.siRecordRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('SI record not found');
    return { deleted: true };
  }
}
