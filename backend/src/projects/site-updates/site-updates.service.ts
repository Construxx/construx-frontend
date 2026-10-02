import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsService } from '../../alerts/alerts.service';
import { CreateSiteUpdateDto } from './site-updates.dto';
import { publicUrl } from '../../uploads/upload.config';

@Injectable()
export class SiteUpdatesService {
  constructor(private prisma: PrismaService, private alerts: AlertsService) {}

  list(projectId: string) {
    return this.prisma.siteUpdate.findMany({
      where: { projectId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(projectId: string, authorId: string, dto: CreateSiteUpdateDto, file?: Express.Multer.File) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (dto.materialId && dto.remainingQty === undefined) {
      throw new BadRequestException('remainingQty is required when materialId is given');
    }

    const siteUpdate = await this.prisma.$transaction(async (tx) => {
      const created = await tx.siteUpdate.create({
        data: {
          projectId,
          authorId,
          note: dto.note,
          photoUrl: file ? publicUrl(file.filename) : undefined,
          materialId: dto.materialId,
          remainingQty: dto.remainingQty,
        },
      });
      if (dto.materialId) {
        const material = await tx.material.findFirst({ where: { id: dto.materialId, projectId } });
        if (!material) throw new NotFoundException('Material not found in this project');
        await tx.material.update({ where: { id: material.id }, data: { quantityOnSite: dto.remainingQty } });
        await tx.inventoryLog.create({
          data: {
            projectId,
            materialId: material.id,
            changeQty: (dto.remainingQty as number) - material.quantityOnSite,
            reason: `Site update: ${dto.note.slice(0, 80)}`,
          },
        });
      }
      return created;
    });

    // inventory changed -> re-run the procurement rule for that material
    const alert = dto.materialId ? await this.alerts.evaluateMaterial(dto.materialId) : null;
    return { siteUpdate, alert };
  }
}
