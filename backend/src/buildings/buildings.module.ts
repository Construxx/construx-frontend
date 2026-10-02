import { Module } from '@nestjs/common';
import { BuildingsController } from './buildings.controller';
import { BuildingsService } from './buildings.service';
import { MaintenanceService } from './maintenance/maintenance.service';

@Module({ controllers: [BuildingsController], providers: [BuildingsService, MaintenanceService], exports: [BuildingsService] })
export class BuildingsModule {}
