import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500

    response.status(status).json({
      statusCode: status,
      message: exception.message || 'An error occurred',
    })
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS
  if (process.env.NODE_ENV !== 'development') {
    console.log('CORS ENABLED! for https://roko-basilisk.netlify.app')
    app.enableCors({
      origin: ['https://roko-basilisk.netlify.app'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
      credentials: true,
    })
  } else {
    console.log('CORS ENABLED! for *')
    app.enableCors({
      origin: '*', // Allow all origins
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
      credentials: true,
    })
  }

  // Optional logging for debugging CORS
  app.use((req, res, next) => {
    console.log('Origin:', req.headers.origin) // Logs the incoming origin
    console.log('req.path:', req.path)
    next()
  })

  // Use global exception filter
  app.useGlobalFilters(new AllExceptionsFilter())

  await app.listen(process.env.PORT)
}
bootstrap()
