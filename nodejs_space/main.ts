import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all origins (n8n integration)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  logger.log('CORS enabled for all origins');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API Documentation
  const swaggerPath = 'api-docs';
  const config = new DocumentBuilder()
    .setTitle('Gralmed Automation API')
    .setDescription('API pentru automarea programărilor medicale pe platforma Gralmed Medical')
    .setVersion('1.0')
    .addTag('Automation', 'Endpoints pentru verificarea disponibilității programărilor')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Prevent CDN/browser caching of Swagger docs
  app.use(`/${swaggerPath}`, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  SwaggerModule.setup(swaggerPath, app, document, {
    customSiteTitle: 'Gralmed Automation API',
    customfavIcon: 'data:image/svg+xml,<svg xmlns=%22https://upload.wikimedia.org/wikipedia/commons/a/a3/BSicon_HOSPITAL.svg viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏥</text></svg>',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 30px 0; }
      .swagger-ui .info .title { 
        font-size: 36px; 
        color: #1a1a1a;
        font-weight: 700;
      }
      .swagger-ui .info .description { 
        color: #4a4a4a;
        font-size: 16px;
        line-height: 1.6;
      }
      .swagger-ui .scheme-container { 
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        box-shadow: none;
      }
      .swagger-ui .opblock { 
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        margin-bottom: 16px;
        border: 1px solid #e0e0e0;
      }
      .swagger-ui .opblock-tag {
        font-size: 20px;
        font-weight: 600;
        color: #2c3e50;
        padding: 16px 20px;
        border-bottom: 2px solid #3498db;
      }
      .swagger-ui .opblock-summary-path {
        color: #2980b9;
        font-weight: 600;
      }
      .swagger-ui .btn.execute {
        background-color: #27ae60;
        color: white;
        border: none;
        padding: 10px 20px;
        font-weight: 600;
        border-radius: 6px;
      }
      .swagger-ui .btn.execute:hover {
        background-color: #229954;
      }
      .swagger-ui .response-col_status {
        color: #27ae60;
        font-weight: 600;
      }
      body {
        background: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      .swagger-ui .wrapper {
        padding: 20px 40px;
        max-width: 1400px;
      }
    `,
  });

  logger.log(`API Documentation available at: /${swaggerPath}`);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/${swaggerPath}`);
}
bootstrap();
