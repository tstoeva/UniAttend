// Изключено: Apple Wallet карта с QR код (от първата версия, заменена от RFID).
// За включване: passkit-generator, APPLE_* настройките в .env, AttendanceService.createStudentCredential
// (+ exports в AttendanceModule) и WalletModule в app.module.ts.
//
// import { Module } from '@nestjs/common';
// import { AttendanceModule } from '../attendance/attendance.module';
// import { WalletController } from './wallet.controller';
// import { WalletService } from './wallet.service';
// @Module({ imports: [AttendanceModule], controllers: [WalletController], providers: [WalletService] })
// export class WalletModule {}
