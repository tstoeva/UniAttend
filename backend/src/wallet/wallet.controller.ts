import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class WalletController {
  constructor(private wallet: WalletService) {}
  @Get('status') status() { return this.wallet.status(); }
  @Get('pass')
  async pass(@Req() req: any, @Res() res: Response) {
    try {
      const buffer = await this.wallet.buildPass(req.user.sub);
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', 'attachment; filename="UniAttend.pkpass"');
      res.send(buffer);
    } catch (e: any) {
      res.status(503).json({ error: e.message, fallback: 'Use GET /api/attendance/credential for the demo QR flow.' });
    }
  }
}
