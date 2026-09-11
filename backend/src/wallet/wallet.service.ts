import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { PKPass } from 'passkit-generator';
import fs from 'fs';
import path from 'path';

@Injectable()
export class WalletService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private attendance: AttendanceService,
  ) {}

  private walletConfig() {
    const required = [
      'APPLE_PASS_TYPE_IDENTIFIER', 'APPLE_TEAM_IDENTIFIER',
      'APPLE_WWDR_CERT_PATH', 'APPLE_SIGNER_CERT_PATH', 'APPLE_SIGNER_KEY_PATH'
    ];
    const missing = required.filter(k => !this.config.get<string>(k));
    return { available: missing.length === 0, missing };
  }

  status() { return this.walletConfig(); }

  async buildPass(userId: string) {
    const cfg = this.walletConfig();
    if (!cfg.available) throw new Error(`Wallet certificates are not configured: ${cfg.missing.join(', ')}`);
    const student = await this.prisma.studentProfile.findUnique({ where: { userId }, include: { user: true } });
    if (!student) throw new Error('Student not found');
    const { credential } = await this.attendance.createStudentCredential(userId);

    const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p));
    const pass = await PKPass.from({
      model: path.resolve(process.cwd(), '../wallet/UniAttend.pass'),
      certificates: {
        wwdr: read(this.config.getOrThrow('APPLE_WWDR_CERT_PATH')),
        signerCert: read(this.config.getOrThrow('APPLE_SIGNER_CERT_PATH')),
        signerKey: read(this.config.getOrThrow('APPLE_SIGNER_KEY_PATH')),
        signerKeyPassphrase: this.config.get<string>('APPLE_SIGNER_KEY_PASSPHRASE') || undefined,
      }
    }, {
      serialNumber: student.walletSerial,
      passTypeIdentifier: this.config.getOrThrow('APPLE_PASS_TYPE_IDENTIFIER'),
      teamIdentifier: this.config.getOrThrow('APPLE_TEAM_IDENTIFIER'),
      organizationName: this.config.get<string>('APPLE_ORGANIZATION_NAME') || 'Demo University',
      description: 'UniAttend AI Student Card',
    });

    const p: any = pass;
    p.primaryFields.push({ key: 'name', label: 'STUDENT', value: `${student.user.firstName} ${student.user.lastName}` });
    p.secondaryFields.push({ key: 'faculty', label: 'FACULTY NO.', value: student.facultyNumber });
    p.secondaryFields.push({ key: 'program', label: 'PROGRAM', value: student.program });
    p.auxiliaryFields.push({ key: 'year', label: 'YEAR', value: String(student.year) });
    pass.setBarcodes(credential);
    return pass.getAsBuffer();
  }
}
