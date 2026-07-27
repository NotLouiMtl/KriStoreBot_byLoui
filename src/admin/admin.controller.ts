import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { AddBalanceDto } from '../common/dto/add-balance.dto';
import { CreateStockDto } from '../common/dto/create-stock.dto';
import { BulkImportDto } from '../common/dto/bulk-import.dto';
import { BlockUserDto } from '../common/dto/block-user.dto';
import { CreateServiceDto } from '../common/dto/create-service.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('setup')
  async setup(@Body() body: { telegramId: string; password: string; username?: string }) {
    return this.adminService.initialSetup(body.telegramId, body.password, body.username);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('add-balance')
  @UseGuards(JwtAuthGuard)
  async addBalance(@Body() body: AddBalanceDto) {
    return this.adminService.addBalance(body.telegramId, body.amount);
  }

  @Post('block-user')
  @UseGuards(JwtAuthGuard)
  async blockUser(@Body() body: BlockUserDto) {
    return this.adminService.toggleBlockUser(body.telegramId);
  }

  @Post('create-account')
  @UseGuards(JwtAuthGuard)
  async createAccount(@Body() body: CreateStockDto) {
    return this.adminService.createStock(
      body.serviceId,
      body.email,
      body.password,
      body.pin,
      body.profiles,
      body.profilePins,
      body.type,
    );
  }

  @Post('stock/bulk-import')
  @UseGuards(JwtAuthGuard)
  async bulkImport(@Body() body: BulkImportDto) {
    return this.adminService.bulkImport(
      body.serviceId,
      body.emails,
      body.password,
      body.pin,
    );
  }

  @Get('stock')
  @UseGuards(JwtAuthGuard)
  async getStockSummary() {
    return this.adminService.getStockSummary();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('services')
  @UseGuards(JwtAuthGuard)
  async getServices() {
    return this.adminService.getServices();
  }

  @Post('services')
  @UseGuards(JwtAuthGuard)
  async createService(@Body() body: CreateServiceDto) {
    return this.adminService.createService(body.name, body.price);
  }

  @Put('services/:id')
  @UseGuards(JwtAuthGuard)
  async updateService(
    @Param('id') id: string,
    @Body() body: { name?: string; price?: number; active?: boolean },
  ) {
    return this.adminService.updateService(Number(id), body);
  }

  @Delete('services/:id')
  @UseGuards(JwtAuthGuard)
  async deleteService(@Param('id') id: string) {
    return this.adminService.deleteService(Number(id));
  }

  @Delete('user/:id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(Number(id));
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions() {
    return this.adminService.getTransactions();
  }

  @Get('users/:id/purchases')
  @UseGuards(JwtAuthGuard)
  async getUserPurchases(@Param('id') id: string) {
    return this.adminService.getUserPurchases(Number(id));
  }

  @Post('make-admin')
  @UseGuards(JwtAuthGuard)
  async makeAdmin(
    @Body() body: { telegramId: string; password: string; username?: string },
  ) {
    return this.adminService.makeAdmin(
      body.telegramId,
      body.password,
      body.username,
    );
  }

  @Get('stock/accounts')
  @UseGuards(JwtAuthGuard)
  async getAllAccounts() {
    return this.adminService.getAllAccounts();
  }

  @Put('stock/account/:id')
  @UseGuards(JwtAuthGuard)
  async updateAccount(
    @Param('id') id: string,
    @Body() body: { email?: string; password?: string; pin?: string },
  ) {
    return this.adminService.updateAccount(Number(id), body);
  }

  @Delete('stock/account/:id')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Param('id') id: string) {
    return this.adminService.deleteAccount(Number(id));
  }

  @Post('stock/account/:id/profiles')
  @UseGuards(JwtAuthGuard)
  async addProfiles(@Param('id') id: string, @Body() body: { count: number }) {
    return this.adminService.addProfiles(Number(id), body.count || 1);
  }

  @Delete('stock/profile/:id')
  @UseGuards(JwtAuthGuard)
  async deleteProfile(@Param('id') id: string) {
    return this.adminService.deleteProfile(Number(id));
  }

  @Put('stock/profile/:id')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Param('id') id: string, @Body() body: { pin?: string }) {
    return this.adminService.updateProfile(Number(id), body);
  }

  @Post('convert-account/:id')
  @UseGuards(JwtAuthGuard)
  async convertAccount(
    @Param('id') id: string,
    @Body() body: { profiles: number },
  ) {
    return this.adminService.convertAccount(Number(id), body.profiles || 5);
  }

  @Post('set-username')
  @UseGuards(JwtAuthGuard)
  async setUsername(@Body() body: { username: string }, @Req() req: any) {
    return this.adminService.setUsername(req.user.userId, body.username);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  async setPassword(
    @Body() body: { telegramId: string; password: string },
    @Req() req: any,
  ) {
    return this.adminService.setPassword(
      body.telegramId,
      body.password,
      req.user.userId,
    );
  }

  @Post('migrate-converted')
  @UseGuards(JwtAuthGuard)
  async migrateConverted() {
    return this.adminService.migrateConvertedAccounts();
  }
}
