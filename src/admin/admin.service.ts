import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async addBalance(telegramId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
      });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      const newSaldo = Number(user.saldo) + amount;
      if (newSaldo < 0) throw new Error('El saldo no puede quedar negativo');

      await tx.user.update({
        where: { id: user.id },
        data: { saldo: { increment: amount } },
      });
      const type = amount >= 0 ? 'deposit' : 'withdrawal';
      const description =
        amount >= 0 ? 'Saldo agregado por admin' : 'Saldo removido por admin';
      await tx.transaction.create({
        data: { userId: user.id, type, amount, description },
      });
      return { ...user, saldo: newSaldo };
    });
  }

  async toggleBlockUser(telegramId: string) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
    if (!user) throw new Error('Usuario no encontrado');
    return this.prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { isBlocked: !user.isBlocked },
    });
  }

  async createStock(
    serviceId: number,
    email: string,
    password: string,
    pin?: string,
    profiles = 5,
    profilePins?: string[],
    type = 'profile',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: { serviceId, email, password, pin, type, daysRemaining: 30 },
      });
      if (type === 'full') {
        return { account, type: 'full' };
      }
      const profileData = Array.from({ length: profiles }, (_, i) => ({
        accountId: account.id,
        profileNumber: i + 1,
        pin:
          profilePins && i < profilePins.length ? profilePins[i] || null : null,
      }));
      await tx.profile.createMany({ data: profileData });
      return { account, profilesCreated: profiles, type: 'profile' };
    });
  }

  async getAllAccounts() {
    return this.prisma.account.findMany({
      where: { status: 'active' },
      include: {
        service: { select: { id: true, name: true } },
        profiles: {
          select: {
            id: true,
            profileNumber: true,
            pin: true,
            isOccupied: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAccount(
    id: number,
    data: { email?: string; password?: string; pin?: string },
  ) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    return this.prisma.account.update({ where: { id }, data });
  }

  async deleteAccount(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id } });
      if (!account) throw new NotFoundException('Cuenta no encontrada');
      await tx.purchase.deleteMany({ where: { accountId: id } });
      const profileIds = (
        await tx.profile.findMany({
          where: { accountId: id },
          select: { id: true },
        })
      ).map((p) => p.id);
      await tx.purchase.deleteMany({
        where: { profileId: { in: profileIds } },
      });
      await tx.profile.deleteMany({ where: { accountId: id } });
      await tx.account.delete({ where: { id } });
      return { deleted: true };
    });
  }

  async addProfiles(accountId: number, count: number) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId },
        include: { profiles: true },
      });
      if (!account) throw new NotFoundException('Cuenta no encontrada');
      if (account.isOccupied)
        throw new Error('No se pueden agregar perfiles a una cuenta vendida');
      const maxNum = account.profiles.reduce(
        (m, p) => Math.max(m, p.profileNumber),
        0,
      );
      const data = Array.from({ length: count }, (_, i) => ({
        accountId: account.id,
        profileNumber: maxNum + i + 1,
      }));
      await tx.profile.createMany({ data });
      return { added: count, totalProfiles: account.profiles.length + count };
    });
  }

  async deleteProfile(id: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: { account: true },
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    if (profile.isOccupied)
      throw new Error('No se puede borrar un perfil vendido');
    if (profile.account.type === 'full')
      throw new Error('No se pueden borrar perfiles de cuentas completas');
    await this.prisma.purchase.deleteMany({ where: { profileId: id } });
    await this.prisma.profile.delete({ where: { id } });
    return { deleted: true };
  }

  async updateProfile(id: number, data: { pin?: string }) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return this.prisma.profile.update({ where: { id }, data });
  }

  async convertAccount(accountId: number, numProfiles: number) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId },
        include: { service: true },
      });
      if (!account) throw new NotFoundException('Cuenta no encontrada');
      if (account.type === 'profile')
        throw new Error('La cuenta ya esta en modo perfiles');
      if (account.isOccupied)
        throw new Error('No se puede convertir una cuenta vendida');

      const baseName = account.service.name.replace(/\s+Completa$/i, '');
      const profileServiceName = `${baseName} Perfil`;
      let profileService = await tx.service.findFirst({
        where: { name: profileServiceName },
      });
      if (!profileService) {
        profileService = await tx.service.create({
          data: { name: profileServiceName, price: account.service.price },
        });
      }

      const profileData = Array.from({ length: numProfiles }, (_, i) => ({
        accountId: account.id,
        profileNumber: i + 1,
      }));
      await tx.profile.createMany({ data: profileData });
      await tx.account.update({
        where: { id: account.id },
        data: { type: 'profile', serviceId: profileService.id },
      });
      return {
        accountId: account.id,
        profilesCreated: numProfiles,
        profileServiceId: profileService.id,
      };
    });
  }

  async getStockSummary() {
    const byService = await this.prisma.service.findMany({
      include: {
        accounts: {
          include: {
            profiles: true,
          },
        },
      },
    });

    const summary = byService.map((s) => {
      const fullAccounts = s.accounts.filter(
        (a) => a.type === 'full' && !a.isOccupied,
      );
      const profileAccounts = s.accounts.filter((a) => a.type === 'profile');
      const profileAvailable = profileAccounts.reduce((sum, a) => {
        return sum + a.profiles.filter((p) => !p.isOccupied).length;
      }, 0);
      const occupiedProfiles = profileAccounts.reduce((sum, a) => {
        return sum + a.profiles.filter((p) => p.isOccupied).length;
      }, 0);
      return {
        id: s.id,
        name: s.name,
        accounts: s.accounts.length,
        fullAvailable: fullAccounts.length,
        fullAccounts: fullAccounts.map((a) => ({
          id: a.id,
          email: a.email,
          pin: a.pin,
          daysRemaining: a.daysRemaining,
        })),
        profileAccounts: profileAccounts.map((a) => ({
          id: a.id,
          email: a.email,
          profiles: a.profiles,
          profileCount: a.profiles.length,
          daysRemaining: a.daysRemaining,
        })),
        profileAvailable,
        occupiedProfiles,
        available: fullAccounts.length + profileAvailable,
      };
    });

    const totalFull = await this.prisma.account.count({
      where: { type: 'full' },
    });
    const totalProfiles = await this.prisma.profile.count();
    const availableFull = await this.prisma.account.count({
      where: { type: 'full', isOccupied: false },
    });
    const availableProfiles = await this.prisma.profile.count({
      where: { isOccupied: false },
    });

    return {
      summary,
      total: totalFull + totalProfiles,
      available: availableFull + availableProfiles,
      sold: totalFull + totalProfiles - (availableFull + availableProfiles),
    };
  }

  async getStats() {
    const [
      totalUsers,
      totalSaldo,
      availableFull,
      availableProfiles,
      todaySales,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.aggregate({ _sum: { saldo: true } }),
      this.prisma.account.count({ where: { type: 'full', isOccupied: false } }),
      this.prisma.profile.count({ where: { isOccupied: false } }),
      this.prisma.purchase.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      totalUsers,
      totalSaldo: totalSaldo._sum.saldo || 0,
      stockAvailable: availableFull + availableProfiles,
      todaySales,
    };
  }

  async getServices() {
    return this.prisma.service.findMany({ orderBy: { id: 'asc' } });
  }

  async createService(name: string, price: number) {
    return this.prisma.service.create({ data: { name, price } });
  }

  async updateService(
    id: number,
    data: { name?: string; price?: number; active?: boolean },
  ) {
    return this.prisma.service.update({ where: { id }, data });
  }

  async getTransactions() {
    return this.prisma.transaction.findMany({
      include: {
        user: { select: { id: true, username: true, telegramId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getUserPurchases(userId: number) {
    return this.prisma.purchase.findMany({
      where: { userId },
      include: {
        service: true,
        profile: { include: { account: true } },
        account: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteService(id: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.purchase.deleteMany({ where: { account: { serviceId: id } } });
      const profiles = await tx.profile.findMany({
        where: { account: { serviceId: id } },
        select: { id: true },
      });
      const profileIds = profiles.map((p) => p.id);
      await tx.purchase.deleteMany({
        where: { profileId: { in: profileIds } },
      });
      const accounts = await tx.account.findMany({
        where: { serviceId: id },
        select: { id: true },
      });
      const accountIds = accounts.map((a) => a.id);
      await tx.profile.deleteMany({ where: { accountId: { in: accountIds } } });
      await tx.account.deleteMany({ where: { serviceId: id } });
      await tx.service.delete({ where: { id } });
      return { deleted: true };
    });
  }

  async makeAdmin(telegramId: string, password: string, username?: string) {
    const hashed = await bcrypt.hash(password, 10);
    return this.prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: {
        role: 'ADMIN',
        password: hashed,
        ...(username ? { username } : {}),
      },
      create: {
        telegramId: BigInt(telegramId),
        username: username || `admin_${telegramId}`,
        role: 'ADMIN',
        password: hashed,
        saldo: 0,
      },
      select: { id: true, telegramId: true, username: true, role: true },
    });
  }

  async initialSetup(telegramId: string, password: string, username?: string) {
    const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) throw new ForbiddenException('Ya existe un administrador');
    return this.makeAdmin(telegramId, password, username);
  }

  async deleteUser(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      // Free occupied profiles/accounts assigned to this user
      await tx.profile.updateMany({
        where: { assignedToId: id },
        data: { isOccupied: false, assignedToId: null, assignedAt: null },
      });
      await tx.account.updateMany({
        where: { assignedToId: id },
        data: { isOccupied: false, assignedToId: null, assignedAt: null },
      });

      await tx.purchase.deleteMany({ where: { userId: id } });
      await tx.transaction.deleteMany({ where: { userId: id } });
      await tx.deposit.deleteMany({ where: { userId: id } });
      await tx.device.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
      return { deleted: true };
    });
  }

  async bulkImport(
    serviceId: number,
    emails: string[],
    password: string,
    pin?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const accounts = await Promise.all(
        emails.map((email) =>
          tx.account.create({
            data: {
              serviceId,
              email,
              password,
              pin,
              type: 'full',
              daysRemaining: 30,
            },
          }),
        ),
      );
      return { created: accounts.length, accounts };
    });
  }

  async setUsername(userId: number, username: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { username },
      select: { id: true, username: true, telegramId: true, role: true },
    });
  }

  async setPassword(telegramId: string, password: string, adminUserId: number) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });
    if (!admin || admin.role !== 'ADMIN')
      throw new ForbiddenException('Solo admins');

    const hashed = await bcrypt.hash(password, 10);
    return this.prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { password: hashed },
      select: { id: true, telegramId: true, role: true },
    });
  }

  async migrateConvertedAccounts() {
    const profilePrices: Record<string, number> = {
      Disney: 10,
      Prime: 12,
      Crunchyroll: 15,
      'Vix 1m': 3,
      'Vix 6m': 5,
      'Vix 12m': 10,
    };

    return this.prisma.$transaction(async (tx) => {
      for (const [name, price] of Object.entries(profilePrices)) {
        const serviceName = `${name} Perfil`;
        const exists = await tx.service.findFirst({
          where: { name: serviceName },
        });
        if (!exists) {
          await tx.service.create({ data: { name: serviceName, price } });
        }
      }

      const profileAccounts = await tx.account.findMany({
        where: { type: 'profile' },
        include: { service: true },
      });

      let migrated = 0;
      for (const account of profileAccounts) {
        const alreadyCorrect = account.service.name.endsWith(' Perfil');
        if (alreadyCorrect) continue;

        const baseName = account.service.name.replace(/\s+Completa$/i, '');
        const targetName = `${baseName} Perfil`;
        let targetService = await tx.service.findFirst({
          where: { name: targetName },
        });
        if (!targetService) {
          const defaultPrice = profilePrices[baseName] ?? account.service.price;
          targetService = await tx.service.create({
            data: { name: targetName, price: defaultPrice },
          });
        }

        if (account.serviceId !== targetService.id) {
          await tx.account.update({
            where: { id: account.id },
            data: { serviceId: targetService.id },
          });
          migrated++;
        }
      }

      const services = await tx.service.findMany({ orderBy: { id: 'asc' } });
      return {
        servicesCreated: Object.keys(profilePrices).length,
        migrated,
        services,
      };
    });
  }
}
