import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SiRecordsService } from './si-records.service';
import { CreateSiRecordDto } from './dto/create-si-record.dto';
import { UpdateSiRecordDto } from './dto/update-si-record.dto';

@Controller('si-records')
export class SiRecordsController {
  constructor(private readonly siRecordsService: SiRecordsService) {}

  @Post()
  create(@Body() createSiRecordDto: CreateSiRecordDto) {
    return this.siRecordsService.create(createSiRecordDto);
  }

  @Get()
  findAll() {
    return this.siRecordsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.siRecordsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSiRecordDto: UpdateSiRecordDto) {
    return this.siRecordsService.update(+id, updateSiRecordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.siRecordsService.remove(+id);
  }
}
