import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from '../common/dto/login.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress;
    return this.authService.login(
      dto.telegramId || dto.username!,
      dto.password,
      ip,
      req.headers['user-agent'],
    );
  }
}
