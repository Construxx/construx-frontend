import { Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Get('projects/:projectId/alerts')
  forProject(@Param('projectId') id: string, @Query('includeResolved') inc?: string) {
    return this.alerts.listForProject(id, inc === 'true');
  }

  @Get('buildings/:buildingId/alerts')
  forBuilding(@Param('buildingId') id: string, @Query('includeResolved') inc?: string) {
    return this.alerts.listForBuilding(id, inc === 'true');
  }

  /** Re-checks every material of a project against the look-ahead window. */
  @Post('projects/:projectId/alerts/scan')
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.PROCUREMENT_OFFICER)
  scan(@Param('projectId') id: string) { return this.alerts.evaluateProject(id); }

  @Patch('alerts/:id/resolve')
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.PROCUREMENT_OFFICER)
  resolve(@Param('id') id: string) { return this.alerts.resolve(id); }
}
