import { PartialType } from '@nestjs/mapped-types';
import { CreateSiUserDto } from './create-si-user.dto';

export class UpdateSiUserDto extends PartialType(CreateSiUserDto) {}
