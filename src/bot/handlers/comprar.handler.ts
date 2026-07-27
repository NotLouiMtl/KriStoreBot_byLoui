import { Telegraf } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { PurchasesService } from '../../purchases/purchases.service';

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
        const pinText = a.pin ? `\nPIN: ${a.pin}` : '';
        ctx.reply(
          `Compra exitosa!\n\nServicio: ${result.serviceName} (Cuenta completa)\nCuenta: ${a.email}\nPassword: ${a.password}${pinText}\n\nEsta cuenta tiene ${a.daysRemaining} dias restantes.`,
        );
      } else if (result.profile) {
        const profile = result.profile;
        const pinText = profile.pin
          ? `\nPIN del perfil: ${profile.pin}`
          : profile.account.pin
            ? `\nPIN: ${profile.account.pin}`
            : '';
        ctx.reply(
          `Compra exitosa!\n\nServicio: ${result.serviceName} (Perfil)\nCuenta: ${profile.account.email}\nPassword: ${profile.account.password}${pinText}\nPerfil: #${profile.profileNumber}\n\nEsta cuenta tiene ${profile.account.daysRemaining} dias restantes.`,
        );
      }
    } catch (error: any) {
      ctx.reply(error.message || 'Error al procesar la compra.');
    }
  });
}
