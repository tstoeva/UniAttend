import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
@Module({ imports: [AttendanceModule], controllers: [WalletController], providers: [WalletService] })
export class WalletModule {}
