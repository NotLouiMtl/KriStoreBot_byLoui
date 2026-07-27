import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    telegramIdOrUsername: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    const isNumeric = /^\d+$/.test(telegramIdOrUsername);
    const user = isNumeric
      ? await this.prisma.user.findUnique({
          where: { telegramId: BigInt(telegramIdOrUsername) },
        })
      : await this.prisma.user.findFirst({
          where: { username: telegramIdOrUsername },
        });

    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.password) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    }

    if (ip) {
      await this.prisma.device.create({
        data: { userId: user.id, ip, userAgent: userAgent || null },
      });
    }

    const payload = {
      sub: user.id,
      telegramId: user.telegramId.toString(),
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '1d' }),
      user: {
        id: user.id,
        username: user.username,
        telegramId: user.telegramId.toString(),
        role: user.role,
      },
    };
  }
}
