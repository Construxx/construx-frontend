import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get('projects/:projectId/tasks') list(@Param('projectId') id: string) { return this.tasks.list(id); }

  @Post('projects/:projectId/tasks') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  create(@Param('projectId') id: string, @Body() dto: CreateTaskDto) { return this.tasks.create(id, dto); }

  @Patch('tasks/:taskId') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  update(@Param('taskId') id: string, @Body() dto: UpdateTaskDto) { return this.tasks.update(id, dto); }

  @Delete('tasks/:taskId') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  remove(@Param('taskId') id: string) { return this.tasks.remove(id); }
}
