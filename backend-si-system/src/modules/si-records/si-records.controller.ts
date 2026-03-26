import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { SiRecordsService } from './si-records.service';
import { CreateSiRecordDto } from './dto/create-si-record.dto';
import { UpdateSiRecordDto } from './dto/update-si-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('si-records')
export class SiRecordsController {
  constructor(private readonly siRecordsService: SiRecordsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createSiRecordDto: CreateSiRecordDto) {
    // automatically set inputUserId from authenticated user
    if (req?.user?.user_id) {
      createSiRecordDto.inputUserId = req.user.user_id
    }
    return this.siRecordsService.create(createSiRecordDto);
  }

  @Get()
  findAll() {
    return this.siRecordsService.findAll();
  }

  @Get('by-sheet/:sheetId')
  findBySheet(@Param('sheetId', ParseIntPipe) sheetId: number) {
    return this.siRecordsService.findBySheet(sheetId);
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
