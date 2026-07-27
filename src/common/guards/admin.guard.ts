import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminId = request.headers['x-admin-id'];

    if (!adminId) throw new ForbiddenException('x-admin-id header requerido');

    const admin = await this.prisma.user.findUnique({
      where: { telegramId: BigInt(adminId) },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Solo administradores');
    }

    request.admin = admin;
    return true;
  }
}
