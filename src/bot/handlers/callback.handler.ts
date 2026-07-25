import { Telegraf, Markup } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { PurchasesService } from '../../purchases/purchases.service';
import { PrismaService } from '../../prisma/prisma.service';

export function registerCallbackHandler(bot: Telegraf, usersService: UsersService, purchasesService: PurchasesService, prisma: PrismaService) {
  bot.on('callback_query', async (ctx) => {
    if (!('data' in ctx.callbackQuery)) return;
    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (data === 'menu_saldo') {
      const saldo = await usersService.getSaldo(BigInt(ctx.from.id));
      return ctx.reply(`Tu saldo: $${saldo}`);
    }

    if (data === 'menu_servicios') {
      const services = await prisma.service.findMany({
        where: { active: true },
        include: { accounts: { include: { profiles: { where: { isOccupied: false }, select: { id: true } } } } },
      });

      const entries: { text: string; callback_data: string }[] = [];

      for (const s of services) {
        const fullCount = s.accounts.filter(a => a.type === 'full' && !a.isOccupied).length;
        const profileCount = s.accounts.reduce((sum, a) => {
          if (a.type === 'profile') return sum + a.profiles.length;
          return sum;
        }, 0);

        if (fullCount > 0) {
          entries.push({
            text: `${s.name} (Cuenta completa) - $${s.price} (${fullCount} disp.)`,
            callback_data: `buy_${s.id}_full`,
          });
        }
        if (profileCount > 0) {
          entries.push({
            text: `${s.name} (Perfil) - $${s.price} (${profileCount} disp.)`,
            callback_data: `buy_${s.id}_profile`,
          });
        }
      }

      if (entries.length === 0) return ctx.reply('No hay servicios disponibles.');

      const keyboard = entries.map((e) => [Markup.button.callback(e.text, e.callback_data)]);

      return ctx.reply('Selecciona un servicio:', { reply_markup: { inline_keyboard: keyboard } });
    }

    if (data.startsWith('buy_')) {
      const parts = data.split('_');
      const serviceId = parseInt(parts[1]);
      const preferredType = parts[2] as 'full' | 'profile' | undefined;
      if (isNaN(serviceId)) return ctx.reply('ID invalido');

      try {
        const user = await usersService.findByTelegramId(BigInt(ctx.from.id));
        if (!user) return ctx.reply('No estas registrado. Usa /start');

        const result = await purchasesService.comprar(user.id, serviceId, preferredType);

        if (result.type === 'full' && result.account) {
          const a = result.account;
          const pinText = a.pin ? `\nPIN: ${a.pin}` : '';
          await ctx.editMessageText(
            `Compra exitosa!\n\nServicio: ${result.serviceName} (Cuenta completa)\nCuenta: ${a.email}\nPassword: ${a.password}${pinText}\n\nEsta cuenta expira en 30 dias.`
          );
        } else if (result.profile) {
          const profile = result.profile;
          const pinText = profile.pin
            ? `\nPIN del perfil: ${profile.pin}`
            : profile.account.pin
              ? `\nPIN: ${profile.account.pin}`
              : '';
          await ctx.editMessageText(
            `Compra exitosa!\n\nServicio: ${result.serviceName} (Perfil)\nCuenta: ${profile.account.email}\nPassword: ${profile.account.password}${pinText}\nPerfil: #${profile.profileNumber}\n\nEste perfil expira en 30 dias.`
          );
        }
      } catch (error: any) {
        ctx.reply(error.message || 'Error al procesar la compra.');
      }
    }
  });
}
