import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spreadsheet } from './entities/spreadsheet.entity';
import { InvoiceName } from '../invoice-name/entities/invoice-name.entity';
import { SpreadsheetsService } from './spreadsheets.service';
import { SpreadsheetsController } from './spreadsheets.controller';
import { GoogleSheetsService } from './google-sheets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Spreadsheet, InvoiceName])],
  controllers: [SpreadsheetsController],
  providers: [SpreadsheetsService, GoogleSheetsService],
  exports: [SpreadsheetsService, GoogleSheetsService],
})
export class SpreadsheetsModule {}
