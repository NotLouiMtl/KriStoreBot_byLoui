import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { UsersService } from '../users/users.service';
import { PurchasesService } from '../purchases/purchases.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  registerStartHandler,
  registerSaldoHandler,
  registerServiciosHandler,
  registerComprarHandler,
  registerCallbackHandler,
} from './handlers';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly purchasesService: PurchasesService,
  ) {
    this.bot = new Telegraf(process.env.BOT_TOKEN!);
  }

  async onModuleInit() {
    registerStartHandler(this.bot, this.usersService);
    registerSaldoHandler(this.bot, this.usersService);
    registerServiciosHandler(this.bot, this.prisma);
    registerComprarHandler(this.bot, this.usersService, this.purchasesService);
    registerCallbackHandler(
      this.bot,
      this.usersService,
      this.purchasesService,
      this.prisma,
    );

    const webhookUrl = process.env.WEBHOOK_URL;
    if (webhookUrl) {
      this.bot.telegram
        .setWebhook(webhookUrl)
        .catch((err) => {
          this.logger.warn(
            `Webhook registration failed (non-fatal): ${err.message}`,
          );
        });
      this.logger.log('Bot webhook configurado');
    } else {
      this.logger.warn('WEBHOOK_URL no configurado, webhook no registrado');
    }
  }

  getWebhookMiddleware() {
    return this.bot.webhookCallback('/');
  }
}
