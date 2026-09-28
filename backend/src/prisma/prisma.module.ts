import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Глобален модул – PrismaService е достъпен във всички модули
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
