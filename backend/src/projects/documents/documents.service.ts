import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { UPLOAD_DIR, publicUrl } from '../../uploads/upload.config';

export class CreateDocumentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() type?: string; // DRAWING | REPORT | PERMIT | OTHER
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  list(projectId: string) {
    return this.prisma.document.findMany({
      where: { projectId },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(projectId: string, userId: string, dto: CreateDocumentDto, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('A file is required (field name: file)');
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    return this.prisma.document.create({
      data: {
        projectId,
        uploadedById: userId,
        title: dto.title ?? file.originalname,
        type: dto.type ?? 'OTHER',
        fileUrl: publicUrl(file.filename),
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
    });
  }

  async remove(id: string) {
    const doc = await this.prisma.document.delete({ where: { id } });
    await unlink(join(process.cwd(), UPLOAD_DIR, doc.fileUrl.split('/').pop() as string)).catch(() => undefined);
    return { deleted: true };
  }
}
