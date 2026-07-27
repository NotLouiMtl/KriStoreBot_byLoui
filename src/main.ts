import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { BotService } from './bot/bot.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const botService = app.get(BotService);
  app.use('/bot', botService.getWebhookMiddleware());

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:3001',
      ];
      if (
        !origin ||
        allowed.some((a) => origin.includes(a)) ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}
bootstrap();
