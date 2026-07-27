import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async comprar(
    userId: number,
    serviceId: number,
    preferredType?: 'full' | 'profile',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const service = await tx.service.findUnique({ where: { id: serviceId } });

      if (!user || !service) throw new Error('Datos inválidos');
      if (user.isBlocked) throw new Error('Usuario bloqueado');
      if (Number(user.saldo) < Number(service.price)) {
        throw new Error(
          `Saldo insuficiente. Necesitas $${service.price}, tienes $${user.saldo}`,
        );
      }

      if (preferredType !== 'profile') {
        const fullAccount = await tx.account.findFirst({
          where: {
            serviceId,
            type: 'full',
            isOccupied: false,
            status: 'active',
          },
        });

        if (fullAccount) {
          await tx.account.update({
            where: { id: fullAccount.id },
            data: {
              isOccupied: true,
              assignedToId: userId,
              assignedAt: new Date(),
            },
          });

          await tx.user.update({
            where: { id: userId },
            data: { saldo: { decrement: service.price } },
          });

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await tx.purchase.create({
            data: {
              userId,
              serviceId,
              accountId: fullAccount.id,
              price: service.price,
              expiresAt,
            },
          });

          await tx.transaction.create({
            data: {
              userId,
              type: 'purchase',
              amount: service.price,
              description: `Compra: ${service.name} - Cuenta completa`,
            },
          });

          const remaining = await this.prisma.account.count({
            where: {
              serviceId,
              type: 'full',
              isOccupied: false,
              status: 'active',
            },
          });
          if (remaining <= 3) {
            this.logger.warn(
              `Stock bajo (cuentas completas) para "${service.name}": ${remaining} disponible(s)`,
            );
          }

          return {
            type: 'full',
            account: fullAccount,
            serviceName: service.name,
          };
        }
      }

      const profile = await tx.profile.findFirst({
        where: {
          isOccupied: false,
          account: { serviceId, type: 'profile', status: 'active' },
        },
        include: { account: true },
      });

      if (!profile) throw new Error('Sin stock disponible');

      await tx.profile.update({
        where: { id: profile.id },
        data: {
          isOccupied: true,
          assignedToId: userId,
          assignedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { saldo: { decrement: service.price } },
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await tx.purchase.create({
        data: {
          userId,
          serviceId,
          profileId: profile.id,
          price: service.price,
          expiresAt,
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'purchase',
          amount: service.price,
          description: `Compra: ${service.name} - Perfil #${profile.profileNumber}`,
        },
      });

      const remaining = await this.prisma.profile.count({
        where: { isOccupied: false, account: { serviceId, status: 'active' } },
      });
      if (remaining <= 3) {
        this.logger.warn(
          `Stock bajo para "${service.name}": ${remaining} perfil(es) disponible(s)`,
        );
      }

      return { type: 'profile', profile, serviceName: service.name };
    });
  }

  async findByUserId(userId: number) {
    return this.prisma.purchase.findMany({
      where: { userId },
      include: {
        service: true,
        profile: { include: { account: true } },
        account: true,
      },
    });
  }
}
