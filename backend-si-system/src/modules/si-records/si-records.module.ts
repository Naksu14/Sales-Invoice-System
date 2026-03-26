import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiRecord } from './entities/si-record.entity';
import { Spreadsheet } from '../spreadsheets/entities/spreadsheet.entity';
import { SheetColumn } from '../sheet-column/entities/sheet-column.entity';
import { SiUser } from '../si-users/entities/si-user.entity';
import { SiRecordsService } from './si-records.service';
import { SiRecordsController } from './si-records.controller';
import { SpreadsheetsModule } from '../spreadsheets/spreadsheets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SiRecord, Spreadsheet, SheetColumn, SiUser]),
    SpreadsheetsModule,
  ],
  controllers: [SiRecordsController],
  providers: [SiRecordsService],
  exports: [SiRecordsService],
})
export class SiRecordsModule {}
