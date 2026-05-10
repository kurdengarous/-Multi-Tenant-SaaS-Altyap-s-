import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}

  @Get() list() { return this.svc.list(); }

  @Post()
  create(@Body() b: { name: string; description?: string }, @Req() req: any) {
    return this.svc.create(b.name, b.description, req.user.sub);
  }
}
