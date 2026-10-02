import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto } from './materials.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class MaterialsController {
  constructor(private materials: MaterialsService) {}

  @Get('projects/:projectId/materials') list(@Param('projectId') id: string) { return this.materials.list(id); }

  /** Inventory view = materials with stock cover; same data, friendlier alias for the frontend. */
  @Get('projects/:projectId/inventory') inventory(@Param('projectId') id: string) { return this.materials.list(id); }

  @Post('projects/:projectId/materials') @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.SITE_ENGINEER)
  create(@Param('projectId') id: string, @Body() dto: CreateMaterialDto) { return this.materials.create(id, dto); }

  @Patch('materials/:id') @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.SITE_ENGINEER)
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) { return this.materials.update(id, dto); }

  @Get('materials/:id/logs') logs(@Param('id') id: string) { return this.materials.logs(id); }
}
