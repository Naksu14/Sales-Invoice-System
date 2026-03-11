import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SpreadsheetsService } from './spreadsheets.service';
import { CreateSpreadsheetDto } from './dto/create-spreadsheet.dto';
import { UpdateSpreadsheetDto } from './dto/update-spreadsheet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('spreadsheets')
export class SpreadsheetsController {
  constructor(private readonly spreadsheetsService: SpreadsheetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createSpreadsheetDto: CreateSpreadsheetDto) {
    return this.spreadsheetsService.create(createSpreadsheetDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.spreadsheetsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.spreadsheetsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateSpreadsheetDto: UpdateSpreadsheetDto) {
    return this.spreadsheetsService.update(+id, updateSpreadsheetDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.spreadsheetsService.remove(+id);
  }
}
