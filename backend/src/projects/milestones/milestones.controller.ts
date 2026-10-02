import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class MilestonesController {
  constructor(private milestones: MilestonesService) {}

  @Get('projects/:projectId/milestones') list(@Param('projectId') id: string) { return this.milestones.list(id); }

  @Post('projects/:projectId/milestones') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  create(@Param('projectId') id: string, @Body() dto: CreateMilestoneDto) { return this.milestones.create(id, dto); }

  @Patch('milestones/:id') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) { return this.milestones.update(id, dto); }
}
