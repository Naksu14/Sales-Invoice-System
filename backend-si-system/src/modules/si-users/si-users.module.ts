import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiUser } from './entities/si-user.entity';
import { SiUsersService } from './si-users.service';
import { SiUsersController } from './si-users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiUser])],
  controllers: [SiUsersController],
  providers: [SiUsersService],
  exports: [SiUsersService],
})
export class SiUsersModule {}
