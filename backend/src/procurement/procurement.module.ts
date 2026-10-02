import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { MaterialsController } from './materials/materials.controller';
import { MaterialsService } from './materials/materials.service';
import { SuppliersController } from './suppliers/suppliers.controller';
import { SuppliersService } from './suppliers/suppliers.service';
import { PurchaseOrdersController } from './purchase-orders/purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders/purchase-orders.service';

@Module({
  imports: [AlertsModule],
  controllers: [MaterialsController, SuppliersController, PurchaseOrdersController],
  providers: [MaterialsService, SuppliersService, PurchaseOrdersService],
})
export class ProcurementModule {}
