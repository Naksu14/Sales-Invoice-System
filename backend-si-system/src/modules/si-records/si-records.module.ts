import { Module } from '@nestjs/common';
import { SiRecordsService } from './si-records.service';
import { SiRecordsController } from './si-records.controller';

@Module({
  controllers: [SiRecordsController],
  providers: [SiRecordsService],
})
export class SiRecordsModule {}
