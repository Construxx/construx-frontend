import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BuildingsService } from './buildings.service';
import { MaintenanceService } from './maintenance/maintenance.service';
import {
  CreateEquipmentDto, CreateMaintenanceTaskDto, CreateRoomDto, CreateSystemDto, HandoverDto,
  UpdateEquipmentDto, UpdateMaintenanceTaskDto, UpdateSystemDto,
} from './buildings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BuildingsController {
  constructor(private buildings: BuildingsService, private maintenance: MaintenanceService) {}

  @Post('projects/:projectId/handover') @Roles(Role.ADMIN)
  handover(@Param('projectId') id: string, @Body() dto: HandoverDto) { return this.buildings.handover(id, dto); }

  @Get('buildings') list() { return this.buildings.list(); }
  @Get('buildings/:id') findOne(@Param('id') id: string) { return this.buildings.findOne(id); }
  @Get('buildings/:id/floors') floors(@Param('id') id: string) { return this.buildings.floors(id); }

  @Get('buildings/:id/floors/:floorId/rooms/:roomId')
  room(@Param('id') id: string, @Param('floorId') floorId: string, @Param('roomId') roomId: string) {
    return this.buildings.getRoom(id, floorId, roomId);
  }

  // ---- assets ----
  @Post('floors/:floorId/rooms') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  addRoom(@Param('floorId') floorId: string, @Body() dto: CreateRoomDto) { return this.buildings.addRoom(floorId, dto); }

  @Post('rooms/:roomId/equipment') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  addEquipment(@Param('roomId') roomId: string, @Body() dto: CreateEquipmentDto) { return this.buildings.addEquipment(roomId, dto); }

  @Patch('equipment/:id') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  updateEquipment(@Param('id') id: string, @Body() dto: UpdateEquipmentDto) { return this.buildings.updateEquipment(id, dto); }

  @Post('rooms/:roomId/systems') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  addSystem(@Param('roomId') roomId: string, @Body() dto: CreateSystemDto) { return this.buildings.addSystem(roomId, dto); }

  @Patch('systems/:id') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  updateSystem(@Param('id') id: string, @Body() dto: UpdateSystemDto) { return this.buildings.updateSystem(id, dto); }

  // ---- maintenance ----
  @Get('buildings/:id/maintenance-tasks')
  listMaintenance(@Param('id') id: string, @Query('status') status?: string) { return this.maintenance.list(id, status); }

  @Post('buildings/:id/maintenance-tasks') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  createMaintenance(@Param('id') id: string, @Body() dto: CreateMaintenanceTaskDto) { return this.maintenance.create(id, dto); }

  @Patch('maintenance-tasks/:id') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  updateMaintenance(@Param('id') id: string, @Body() dto: UpdateMaintenanceTaskDto) { return this.maintenance.update(id, dto); }
}
