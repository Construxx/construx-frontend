import { Body, Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { SiteUpdatesService } from './site-updates.service';
import { CreateSiteUpdateDto } from './site-updates.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { uploadOptions } from '../../uploads/upload.config';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/site-updates')
export class SiteUpdatesController {
  constructor(private updates: SiteUpdatesService) {}

  @Get() list(@Param('projectId') id: string) { return this.updates.list(id); }

  /** multipart/form-data: note, [materialId, remainingQty], [photo] — or plain JSON without a photo */
  @Post()
  @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  @UseInterceptors(FileInterceptor('photo', uploadOptions))
  create(
    @Param('projectId') id: string,
    @Body() dto: CreateSiteUpdateDto,
    @CurrentUser() user: AuthUser,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.updates.create(id, user.id, dto, photo);
  }
}
