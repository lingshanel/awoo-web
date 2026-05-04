import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ensureUploadDir, getUploadDir } from './common/uploads/upload-path';
import { AppModule } from './app.module';

function getCorsOrigin() {
  const configuredOrigins = process.env.CLIENT_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CLIENT_ORIGIN must be set in production.');
  }

  return true;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  ensureUploadDir();

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: getCorsOrigin(),
    credentials: false,
  });
  app.useStaticAssets(getUploadDir(), {
    prefix: '/uploads',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
