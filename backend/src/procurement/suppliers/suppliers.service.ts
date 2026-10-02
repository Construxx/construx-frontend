import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './suppliers.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}
  list() { return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } }); }
  create(dto: CreateSupplierDto) { return this.prisma.supplier.create({ data: dto }); }
  update(id: string, dto: UpdateSupplierDto) { return this.prisma.supplier.update({ where: { id }, data: dto }); }
}
