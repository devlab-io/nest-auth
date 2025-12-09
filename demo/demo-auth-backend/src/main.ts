import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for the frontend
  app.enableCors({
    origin: process.env.FRONTEND_URLS?.split(',') || [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Frontend-Url'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Demo Auth API')
    .setDescription('Demo API for nest-auth')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 4001;
  await app.listen(port);

  console.log('');
  console.log('🚀 Demo Auth Backend');
  console.log('─────────────────────────────────────────');
  console.log(`📡 API:       http://localhost:${port}`);
  console.log(`📚 Swagger:   http://localhost:${port}/api`);
  console.log(`🌐 Frontend:  http://localhost:3000`);
  console.log('─────────────────────────────────────────');
  console.log(`🗄️  Adminer:   http://localhost:8080`);
  console.log(`📧 Inbucket:  http://localhost:9000`);
  console.log('─────────────────────────────────────────');
  console.log('');
}

bootstrap();
