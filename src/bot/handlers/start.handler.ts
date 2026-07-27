import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import { UsersService } from '../../users/users.service';

export function registerStartHandler(
  bot: Telegraf,
  usersService: UsersService,
) {
  bot.start(async (ctx) => {
    await usersService.findOrCreate(BigInt(ctx.from.id), ctx.from.username);
    ctx.reply(
      `Bienvenido! Selecciona una opción:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('💰 Ver Saldo', 'menu_saldo')],
        [Markup.button.callback('🛒 Comprar', 'menu_servicios')],
      ]),
    );
  });
}
