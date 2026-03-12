import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SheetColumnService } from './sheet-column.service';
import { CreateSheetColumnDto } from './dto/create-sheet-column.dto';
import { UpdateSheetColumnDto } from './dto/update-sheet-column.dto';

@Controller('sheet-column')
export class SheetColumnController {
  constructor(private readonly sheetColumnService: SheetColumnService) {}

  @Post()
  async create(@Body() createSheetColumnDto: CreateSheetColumnDto | CreateSheetColumnDto[]) {
    if (Array.isArray(createSheetColumnDto)) {
      return this.sheetColumnService.createBulk(createSheetColumnDto)
    }
    return this.sheetColumnService.create(createSheetColumnDto)
  }

  @Get()
  findAll() {
    return this.sheetColumnService.findAll();
  }

  @Get("columns/:sheetId")
  async getColumns(@Param("sheetId") spreadsheetId:number){
    return this.sheetColumnService.findTable({
      where:{ id_sheets:spreadsheetId },
      order:{ column_order:"ASC"}
    })

}

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSheetColumnDto: UpdateSheetColumnDto) {
    return this.sheetColumnService.update(+id, updateSheetColumnDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sheetColumnService.remove(+id);
  }
}
