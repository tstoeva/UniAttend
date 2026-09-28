import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentModule } from './student/student.module';
import { LecturerModule } from './lecturer/lecturer.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AppController } from './app.controller';
// import { WalletModule } from './wallet/wallet.module'; // Apple Wallet (изключено)

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StudentModule,
    LecturerModule,
    AttendanceModule,
    // WalletModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
