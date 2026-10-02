import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/prisma-exception.filter';
import { UPLOAD_DIR } from './uploads/upload.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.use((request: import('express').Request, response: import('express').Response, next: import('express').NextFunction) => {
    const startedAt = Date.now();
    response.on('finish', () => console.info(JSON.stringify({
      level: 'info', event: 'http.request', method: request.method, path: request.path,
      statusCode: response.statusCode, durationMs: Date.now() - startedAt,
    })));
    next();
  });
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173,http://localhost:3000')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  });
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useStaticAssets(join(process.cwd(), UPLOAD_DIR), { prefix: `/${UPLOAD_DIR}` });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.info(JSON.stringify({ level: 'info', event: 'server.started', port }));
}
bootstrap().catch((error: unknown) => {
  console.error(JSON.stringify({ level: 'fatal', event: 'server.bootstrap_failed', message: error instanceof Error ? error.message : 'Unknown startup error' }));
  process.exit(1);
});
