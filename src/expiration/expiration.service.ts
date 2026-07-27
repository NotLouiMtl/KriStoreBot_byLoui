import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async liberarExpirados() {
    const now = new Date();
    const expirados = await this.prisma.purchase.findMany({
      where: { expiresAt: { lte: now }, status: 'completed' },
      include: { profile: true, account: true },
    });

    for (const purchase of expirados) {
      await this.prisma.$transaction(async (tx) => {
        await tx.purchase.update({
          where: { id: purchase.id },
          data: { status: 'expired' },
        });
        if (purchase.profile) {
          await tx.profile.update({
            where: { id: purchase.profile.id },
            data: { isOccupied: false, assignedToId: null, assignedAt: null },
          });
        }
        if (purchase.account) {
          await tx.account.update({
            where: { id: purchase.account.id },
            data: { isOccupied: false, assignedToId: null, assignedAt: null },
          });
        }
      });
    }

    if (expirados.length > 0) {
      this.logger.log(`Liberados ${expirados.length} items expirados`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async decrementarDiasRestantes() {
    const cuentasActivas = await this.prisma.account.findMany({
      where: { status: 'active', daysRemaining: { gt: 0 } },
      include: { profiles: true },
    });

    let liberadas = 0;

    for (const cuenta of cuentasActivas) {
      const nuevoDias = cuenta.daysRemaining - 1;

      if (nuevoDias <= 0) {
        await this.prisma.$transaction(async (tx) => {
          await tx.account.update({
            where: { id: cuenta.id },
            data: {
              daysRemaining: 0,
              isOccupied: false,
              assignedToId: null,
              assignedAt: null,
              status: 'dead',
            },
          });

          await tx.profile.updateMany({
            where: { accountId: cuenta.id, isOccupied: true },
            data: { isOccupied: false, assignedToId: null, assignedAt: null },
          });

          await tx.purchase.updateMany({
            where: { accountId: cuenta.id, status: 'completed' },
            data: { status: 'expired' },
          });

          const profileIds = cuenta.profiles.map((p) => p.id);
          if (profileIds.length > 0) {
            await tx.purchase.updateMany({
              where: { profileId: { in: profileIds }, status: 'completed' },
              data: { status: 'expired' },
            });
          }
        });
        liberadas++;
      } else {
        await this.prisma.account.update({
          where: { id: cuenta.id },
          data: { daysRemaining: nuevoDias },
        });
      }
    }

    if (cuentasActivas.length > 0) {
      this.logger.log(
        `Dias decrementados: ${cuentasActivas.length} cuentas procesadas, ${liberadas} cuentas agotadas`,
      );
    }
  }
}
