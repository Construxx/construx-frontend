import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { CreateDocumentDto, DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { uploadOptions } from '../../uploads/upload.config';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DocumentsController {
  constructor(private docs: DocumentsService) {}

  @Get('projects/:projectId/documents') list(@Param('projectId') id: string) { return this.docs.list(id); }

  @Post('projects/:projectId/documents')
  @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  create(
    @Param('projectId') id: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.docs.create(id, user.id, dto, file);
  }

  @Delete('documents/:id') @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  remove(@Param('id') id: string) { return this.docs.remove(id); }
}
