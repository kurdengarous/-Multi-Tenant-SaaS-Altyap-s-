import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { MigrationsService } from './migrations.service';
import { SeedService } from './seed.service';

@Global()
@Module({
  providers: [DatabaseService, MigrationsService, SeedService],
  exports: [DatabaseService, MigrationsService, SeedService],
})
export class DatabaseModule {}
