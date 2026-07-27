import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByServiceId(serviceId: number) {
    return this.prisma.account.findMany({
      where: { serviceId, status: 'active' },
      include: { profiles: true },
    });
  }

  async findById(id: number) {
    return this.prisma.account.findUnique({
      where: { id },
      include: { profiles: true },
    });
  }
}
