import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SheetColumnService } from './sheet-column.service';
import { SheetColumnController } from './sheet-column.controller';
import { SheetColumn } from './entities/sheet-column.entity';
import { Spreadsheet } from '../spreadsheets/entities/spreadsheet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SheetColumn, Spreadsheet])],
  controllers: [SheetColumnController],
  providers: [SheetColumnService],
  exports: [SheetColumnService]
})
export class SheetColumnModule {}
