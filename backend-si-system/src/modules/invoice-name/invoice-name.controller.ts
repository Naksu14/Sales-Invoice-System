import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { InvoiceNameService } from './invoice-name.service';
import { CreateInvoiceNameDto } from './dto/create-invoice-name.dto';
import { UpdateInvoiceNameDto } from './dto/update-invoice-name.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoice-names')
export class InvoiceNameController {
  constructor(private readonly invoiceNameService: InvoiceNameService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createInvoiceNameDto: CreateInvoiceNameDto) {
    return this.invoiceNameService.create(createInvoiceNameDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.invoiceNameService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.invoiceNameService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateInvoiceNameDto: UpdateInvoiceNameDto) {
    return this.invoiceNameService.update(+id, updateInvoiceNameDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.invoiceNameService.remove(+id);
  }
}
