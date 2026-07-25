import { Telegraf } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service';

export function registerServiciosHandler(bot: Telegraf, prisma: PrismaService) {
  bot.command('servicios', async (ctx) => {
    const services = await prisma.service.findMany({
      where: { active: true },
      include: {
        accounts: {
          include: { profiles: { where: { isOccupied: false }, select: { id: true } } },
        },
      },
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

    const keyboard = entries.map((e) => [{ text: e.text, callback_data: e.callback_data }]);

    ctx.reply('Selecciona un servicio:', {
      reply_markup: { inline_keyboard: keyboard },
    });
  });
}
