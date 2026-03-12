import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './config/typeorm.config';
import { SiUsersModule } from './modules/si-users/si-users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InvoiceNameModule } from './modules/invoice-name/invoice-name.module';
import { SpreadsheetsModule } from './modules/spreadsheets/spreadsheets.module';
import { SheetColumnModule } from './modules/sheet-column/sheet-column.module';
import { SiRecordsModule } from './modules/si-records/si-records.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    SiUsersModule,
    AuthModule,
    InvoiceNameModule,
    SpreadsheetsModule,
    SheetColumnModule,
    SiRecordsModule
  ],
})
export class AppModule {}
