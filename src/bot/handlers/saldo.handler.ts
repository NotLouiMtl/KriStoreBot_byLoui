import { Telegraf } from 'telegraf';
import { UsersService } from '../../users/users.service';

export function registerSaldoHandler(
  bot: Telegraf,
  usersService: UsersService,
) {
  bot.command('saldo', async (ctx) => {
    const saldo = await usersService.getSaldo(BigInt(ctx.from.id));
    ctx.reply(`Saldo: $${saldo}`);
  });
}
