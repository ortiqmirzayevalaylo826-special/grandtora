import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Render/Vercel proxy ortida: haqiqiy IP (tezlik cheklovi) va secure cookie uchun
  (app.getHttpAdapter().getInstance() as any).set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(','),
    credentials: true,
  });
  // Barcha kiruvchi ma'lumot tekshiriladi; DTO'da yo'q maydonlar olib tashlanadi.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000); // Render PORT beradi
  await app.listen(port, '0.0.0.0');
  console.log(`Grantora API: http://localhost:${port}/api`);
}
bootstrap();
