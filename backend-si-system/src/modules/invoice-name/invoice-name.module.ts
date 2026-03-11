import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceName } from './entities/invoice-name.entity';
import { InvoiceNameService } from './invoice-name.service';
import { InvoiceNameController } from './invoice-name.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceName])],
  controllers: [InvoiceNameController],
  providers: [InvoiceNameService],
  exports: [InvoiceNameService],
})
export class InvoiceNameModule {}
