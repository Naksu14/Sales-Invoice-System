import { Injectable } from '@nestjs/common';
import { CreateSiRecordDto } from './dto/create-si-record.dto';
import { UpdateSiRecordDto } from './dto/update-si-record.dto';

@Injectable()
export class SiRecordsService {
  create(createSiRecordDto: CreateSiRecordDto) {
    return 'This action adds a new siRecord';
  }

  findAll() {
    return `This action returns all siRecords`;
  }

  findOne(id: number) {
    return `This action returns a #${id} siRecord`;
  }

  update(id: number, updateSiRecordDto: UpdateSiRecordDto) {
    return `This action updates a #${id} siRecord`;
  }

  remove(id: number) {
    return `This action removes a #${id} siRecord`;
  }
}
