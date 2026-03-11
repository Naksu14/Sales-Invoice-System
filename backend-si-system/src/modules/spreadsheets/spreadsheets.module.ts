import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spreadsheet } from './entities/spreadsheet.entity';
import { InvoiceName } from '../invoice-name/entities/invoice-name.entity';
import { SpreadsheetsService } from './spreadsheets.service';
import { SpreadsheetsController } from './spreadsheets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Spreadsheet, InvoiceName])],
  controllers: [SpreadsheetsController],
  providers: [SpreadsheetsService],
  exports: [SpreadsheetsService],
})
export class SpreadsheetsModule {}
