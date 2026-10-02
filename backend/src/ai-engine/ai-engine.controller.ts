import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AiEngineService } from './ai-engine.service';
import { AskDto } from './ai-engine.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiEngineController {
  constructor(private ai: AiEngineService) {}

  @Get('status') status() { return this.ai.status(); }
  @Post('risk-check/:projectId') risk(@Param('projectId') id: string) { return this.ai.riskCheck(id); }
  @Post('procurement-suggestion/:projectId') procurement(@Param('projectId') id: string) { return this.ai.procurementSuggestion(id); }
  @Post('ask') ask(@Body() dto: AskDto) { return this.ai.ask(dto.projectId, dto.question); }
  @Get('executive-summary/:projectId') summary(@Param('projectId') id: string) { return this.ai.executiveSummary(id); }
  @Post('building-check/:buildingId') building(@Param('buildingId') id: string) { return this.ai.buildingCheck(id); }
}
