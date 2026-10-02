import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './suppliers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private suppliers: SuppliersService) {}
  @Get() list() { return this.suppliers.list(); }
  @Post() @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER) create(@Body() dto: CreateSupplierDto) { return this.suppliers.create(dto); }
  @Patch(':id') @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) { return this.suppliers.update(id, dto); }
}
