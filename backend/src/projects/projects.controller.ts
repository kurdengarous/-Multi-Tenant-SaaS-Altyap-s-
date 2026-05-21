import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
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

  @Put(':id')
  update(@Param('id') id: string, @Body() b: { name: string; description?: string }) {
    return this.svc.update(id, b.name, b.description || '');
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
