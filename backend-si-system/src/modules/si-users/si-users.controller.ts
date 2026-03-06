import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SiUsersService } from './si-users.service';
import { CreateSiUserDto } from './dto/create-si-user.dto';
import { UpdateSiUserDto } from './dto/update-si-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('si-users')
export class SiUsersController {
  constructor(private readonly siUsersService: SiUsersService) {}

  @Post()
  create(@Body() createSiUserDto: CreateSiUserDto) {
    return this.siUsersService.create(createSiUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.siUsersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.siUsersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateSiUserDto: UpdateSiUserDto) {
    return this.siUsersService.update(+id, updateSiUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.siUsersService.remove(+id);
  }
}
