import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Reflector } from '@nestjs/core';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  device: {
    create: jest.fn().mockResolvedValue({}),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

describe('AuthController', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /admin/login', () => {
    it('login exitoso como admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        telegramId: BigInt(123),
        username: 'admin',
        role: 'ADMIN',
      });

      const res = await request(app.getHttpServer())
        .post('/admin/login')
        .send({ telegramId: '123', password: 'test123' })
        .expect(201);

      expect(res.body.access_token).toBe('mock-token');
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('rechaza usuario no-admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 2,
        telegramId: BigInt(456),
        username: 'user',
        role: 'USER',
      });

      const res = await request(app.getHttpServer())
        .post('/admin/login')
        .send({ telegramId: '456', password: 'test123' })
        .expect(401);

      expect(res.body.message).toBe('Credenciales inválidas');
    });

    it('rechaza usuario inexistente', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/admin/login')
        .send({ telegramId: '999', password: 'test123' })
        .expect(401);
    });
  });
});
