import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, DeliverPurchaseOrderDto } from './purchase-orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PurchaseOrdersController {
  constructor(private orders: PurchaseOrdersService) {}

  @Get('projects/:projectId/purchase-orders') list(@Param('projectId') id: string) { return this.orders.list(id); }

  @Post('purchase-orders') @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  create(@Body() dto: CreatePurchaseOrderDto) { return this.orders.create(dto); }

  @Patch('purchase-orders/:id/deliver') @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.SITE_ENGINEER)
  deliver(@Param('id') id: string, @Body() dto: DeliverPurchaseOrderDto) { return this.orders.deliver(id, dto); }

  @Patch('purchase-orders/:id/cancel') @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  cancel(@Param('id') id: string) { return this.orders.cancel(id); }
}
