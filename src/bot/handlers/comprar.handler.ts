import { Telegraf } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { PurchasesService } from '../../purchases/purchases.service';
import { formatFullPurchaseMessage, formatProfilePurchaseMessage } from '../helpers/message.helper';

export function registerComprarHandler(
  bot: Telegraf,
  usersService: UsersService,
  purchasesService: PurchasesService,
) {
  bot.command('comprar', async (ctx) => {
    const text = ctx.message.text;
    const args = text.split(' ');
    if (args.length < 2) return ctx.reply('Usa: /comprar <ID del servicio>');

    const serviceId = parseInt(args[1]);
    if (isNaN(serviceId)) return ctx.reply('ID invalido.');

    try {
      const user = await usersService.findByTelegramId(BigInt(ctx.from.id));
      if (!user) return ctx.reply('No estas registrado. Usa /start');

      const result = await purchasesService.comprar(user.id, serviceId);

      if (result.type === 'full' && result.account) {
        const a = result.account;
        ctx.reply(
          formatFullPurchaseMessage({
            serviceName: result.serviceName,
            email: a.email,
            password: a.password,
            pin: a.pin,
            daysRemaining: a.daysRemaining,
          }),
        );
      } else if (result.profile) {
        const profile = result.profile;
        ctx.reply(
          formatProfilePurchaseMessage({
            serviceName: result.serviceName,
            email: profile.account.email,
            password: profile.account.password,
            pin: profile.pin,
            accountPin: profile.account.pin,
            profileNumber: profile.profileNumber,
            daysRemaining: profile.account.daysRemaining,
          }),
        );
      }
    } catch (error: any) {
      ctx.reply(error.message || 'Error al procesar la compra.');
    }
  });
}
