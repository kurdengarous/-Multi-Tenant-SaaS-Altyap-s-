import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MigrationsService } from './database/migrations.service';
import { SeedService } from './database/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));
  app.setGlobalPrefix('api');

  // On boot: build public schema + tenant schemas, seed example data.
  // In production this would be a separate migration job.
  const migrations = app.get(MigrationsService);
  await migrations.run();
  const seed = app.get(SeedService);
  await seed.run();

  const port = Number(process.env.PORT || 4000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[saas-backend] listening on :${port}`);
}
bootstrap();
