import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';
import { MilestonesController } from './milestones/milestones.controller';
import { MilestonesService } from './milestones/milestones.service';
import { SiteUpdatesController } from './site-updates/site-updates.controller';
import { SiteUpdatesService } from './site-updates/site-updates.service';
import { DocumentsController } from './documents/documents.controller';
import { DocumentsService } from './documents/documents.service';

@Module({
  imports: [AlertsModule],
  controllers: [ProjectsController, TasksController, MilestonesController, SiteUpdatesController, DocumentsController],
  providers: [ProjectsService, TasksService, MilestonesService, SiteUpdatesService, DocumentsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
