import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesService } from './purchases.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PurchasesService', () => {
  let service: PurchasesService;
  let mockTx: any;
  let mockPrisma: any;

  beforeEach(async () => {
    mockTx = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      service: {
        findUnique: jest.fn(),
      },
      account: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(10),
      },
      profile: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      purchase: {
        create: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
      },
    };

    mockPrisma = {
      $transaction: jest.fn((cb: (tx: any) => any) => cb(mockTx)),
      purchase: {
        findMany: jest.fn(),
      },
      account: {
        count: jest.fn().mockResolvedValue(10),
      },
      profile: {
        count: jest.fn().mockResolvedValue(10),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
  });

  describe('comprar', () => {
    const user = { id: 1, saldo: 100, isBlocked: false };
    const serviceData = { id: 1, name: 'Netflix', price: 25 };
    const profile = {
      id: 1,
      profileNumber: 1,
      account: { email: 'a@b.com', password: 'pass', pin: null },
    };

    it('compra exitosa', async () => {
      mockTx.user.findUnique.mockResolvedValue(user);
      mockTx.service.findUnique.mockResolvedValue(serviceData);
      mockTx.profile.findFirst.mockResolvedValue(profile);

      const result = await service.comprar(1, 1);

      expect(result).toEqual({ type: 'profile', profile, serviceName: 'Netflix' });
      expect(mockTx.profile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ isOccupied: true, assignedToId: 1 }),
      });
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { saldo: { decrement: 25 } },
      });
      expect(mockTx.purchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 1, serviceId: 1, price: 25 }),
      });
      expect(mockTx.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 1, type: 'purchase', amount: 25 }),
      });
    });

    it('lanza error si usuario no existe', async () => {
      mockTx.user.findUnique.mockResolvedValue(null);

      await expect(service.comprar(99, 1)).rejects.toThrow('Datos inválidos');
    });

    it('lanza error si servicio no existe', async () => {
      mockTx.user.findUnique.mockResolvedValue(user);
      mockTx.service.findUnique.mockResolvedValue(null);

      await expect(service.comprar(1, 99)).rejects.toThrow('Datos inválidos');
    });

    it('lanza error si usuario bloqueado', async () => {
      mockTx.user.findUnique.mockResolvedValue({ ...user, isBlocked: true });
      mockTx.service.findUnique.mockResolvedValue(serviceData);

      await expect(service.comprar(1, 1)).rejects.toThrow('Usuario bloqueado');
    });

    it('lanza error si saldo insuficiente', async () => {
      mockTx.user.findUnique.mockResolvedValue({ ...user, saldo: 10 });
      mockTx.service.findUnique.mockResolvedValue(serviceData);

      await expect(service.comprar(1, 1)).rejects.toThrow(/Saldo insuficiente/);
    });

    it('lanza error si no hay stock', async () => {
      mockTx.user.findUnique.mockResolvedValue(user);
      mockTx.service.findUnique.mockResolvedValue(serviceData);
      mockTx.profile.findFirst.mockResolvedValue(null);

      await expect(service.comprar(1, 1)).rejects.toThrow('Sin stock disponible');
    });
  });
});
