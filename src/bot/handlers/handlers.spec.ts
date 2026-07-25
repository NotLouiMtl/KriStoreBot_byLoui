import { registerStartHandler } from './start.handler';
import { registerSaldoHandler } from './saldo.handler';
import { registerServiciosHandler } from './servicios.handler';
import { registerComprarHandler } from './comprar.handler';

describe('Bot Handlers', () => {
  let mockBot: any;

  beforeEach(() => {
    mockBot = {
      command: jest.fn(),
      start: jest.fn(),
      on: jest.fn(),
      launch: jest.fn(),
      stop: jest.fn(),
    };
  });

  describe('registerStartHandler', () => {
    const mockUsersService = { findOrCreate: jest.fn() };

    it('registra comando start', () => {
      registerStartHandler(mockBot, mockUsersService as any);
      expect(mockBot.start).toHaveBeenCalledWith(expect.any(Function));
    });

    it('el handler responde con bienvenida', async () => {
      const ctx = { reply: jest.fn(), from: { id: 123, username: 'test' } };
      registerStartHandler(mockBot, mockUsersService as any);

      const handler = mockBot.start.mock.calls[0][0];
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Bienvenido'), expect.objectContaining({ reply_markup: expect.anything() }));
    });
  });

  describe('registerSaldoHandler', () => {
    it('registra comando saldo', () => {
      registerSaldoHandler(mockBot, {} as any);
      expect(mockBot.command).toHaveBeenCalledWith('saldo', expect.any(Function));
    });
  });

  describe('registerServiciosHandler', () => {
    it('registra comando servicios', () => {
      registerServiciosHandler(mockBot, {} as any);
      expect(mockBot.command).toHaveBeenCalledWith('servicios', expect.any(Function));
    });
  });

  describe('registerComprarHandler', () => {
    it('registra comando comprar', () => {
      registerComprarHandler(mockBot, {} as any, {} as any);
      expect(mockBot.command).toHaveBeenCalledWith('comprar', expect.any(Function));
    });
  });
});
